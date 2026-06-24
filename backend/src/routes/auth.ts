/**
 * JAXI Intelligence — OAuth Routes
 * Handles Microsoft + Procore OAuth 2.0 authorization flows.
 *
 * Routes:
 *   GET  /api/v1/auth/microsoft/connect   → Redirect to Microsoft login
 *   GET  /api/v1/auth/microsoft/callback  → Handle Microsoft OAuth callback
 *   GET  /api/v1/auth/procore/connect     → Redirect to Procore login
 *   GET  /api/v1/auth/procore/callback    → Handle Procore OAuth callback
 *   GET  /api/v1/auth/status              → Check connection status for current user
 *   POST /api/v1/auth/sync/:projectId     → Trigger manual Procore + Outlook sync
 *   GET  /api/v1/auth/procore/projects    → List Procore projects for current user
 */

import { Router, Request, Response } from 'express';
import axios from 'axios';
import jwt from 'jsonwebtoken';
import { upsertUser, upsertOAuthToken, getOAuthToken, getTokensByUser, getUserById } from '../utils/db';
import { procoreSync } from '../services/procoreSync';
import { outlookSync } from '../services/outlookSync';

const router = Router();

const FRONTEND_URL = process.env.FRONTEND_URL || 'http://localhost:3000';
const JWT_SECRET   = process.env.JWT_SECRET   || 'dev-secret-key';

// ── Helpers ──────────────────────────────────────────────

function makeToken(userId: string): string {
  return jwt.sign({ userId }, JWT_SECRET, { expiresIn: '8h' });
}

function encode(text: string): string {
  return Buffer.from(text).toString('base64');
}

function decode(text: string): string {
  try { return Buffer.from(text, 'base64').toString('utf-8'); } catch { return text; }
}

function authMiddleware(req: Request): string | null {
  const h = req.headers.authorization;
  if (!h?.startsWith('Bearer ')) return null;
  try {
    const p = jwt.verify(h.slice(7), JWT_SECRET) as { userId: string };
    return p.userId;
  } catch { return null; }
}

// ── Microsoft OAuth ───────────────────────────────────────

router.get('/microsoft/connect', (req: Request, res: Response) => {
  const clientId = process.env.MICROSOFT_CLIENT_ID;
  if (!clientId || clientId === 'YOUR_AZURE_CLIENT_ID_HERE') {
    return res.redirect(`${FRONTEND_URL}/settings?error=microsoft_not_configured`);
  }

  const params = new URLSearchParams({
    client_id:     clientId,
    response_type: 'code',
    redirect_uri:  process.env.MICROSOFT_REDIRECT_URI!,
    scope:         'openid email profile Mail.Read User.Read offline_access',
    response_mode: 'query',
  });

  const tenant = process.env.MICROSOFT_TENANT_ID || 'common';
  res.redirect(`https://login.microsoftonline.com/${tenant}/oauth2/v2.0/authorize?${params}`);
});

router.get('/microsoft/callback', async (req: Request, res: Response) => {
  const { code, error } = req.query;
  if (error || !code) {
    return res.redirect(`${FRONTEND_URL}/settings?error=microsoft_denied`);
  }

  try {
    const tenant = process.env.MICROSOFT_TENANT_ID || 'common';
    const tokenParams = new URLSearchParams({
      client_id:     process.env.MICROSOFT_CLIENT_ID!,
      client_secret: process.env.MICROSOFT_CLIENT_SECRET!,
      code:          code as string,
      redirect_uri:  process.env.MICROSOFT_REDIRECT_URI!,
      grant_type:    'authorization_code',
      scope:         'openid email profile Mail.Read User.Read offline_access',
    });

    const tokenRes = await axios.post(
      `https://login.microsoftonline.com/${tenant}/oauth2/v2.0/token`,
      tokenParams.toString(),
      { headers: { 'Content-Type': 'application/x-www-form-urlencoded' } }
    );
    const { access_token, refresh_token, expires_in } = tokenRes.data;

    // Get user profile
    const profileRes = await axios.get('https://graph.microsoft.com/v1.0/me', {
      headers: { Authorization: `Bearer ${access_token}` },
    });
    const { id: msId, displayName, mail, userPrincipalName } = profileRes.data;
    const email = mail || userPrincipalName;

    // Save user + token
    const user = upsertUser({ email, name: displayName || email, microsoftId: msId });
    upsertOAuthToken({
      userId:       user.id,
      provider:     'MICROSOFT_OUTLOOK',
      accessToken:  encode(access_token),
      refreshToken: refresh_token ? encode(refresh_token) : undefined,
      expiresAt:    new Date(Date.now() + expires_in * 1000),
      scope:        'Mail.Read User.Read',
    });

    const token = makeToken(user.id);
    res.redirect(`${FRONTEND_URL}/dashboard?token=${token}&connected=microsoft&user=${encodeURIComponent(displayName || email)}`);
  } catch (err: any) {
    console.error('[Auth] Microsoft callback failed:', err?.response?.data || err.message);
    res.redirect(`${FRONTEND_URL}/settings?error=microsoft_failed`);
  }
});

// ── Procore OAuth ─────────────────────────────────────────

router.get('/procore/connect', (req: Request, res: Response) => {
  const clientId = process.env.PROCORE_CLIENT_ID;
  if (!clientId || clientId === 'YOUR_PROCORE_CLIENT_ID_HERE') {
    return res.redirect(`${FRONTEND_URL}/settings?error=procore_not_configured`);
  }

  const params = new URLSearchParams({
    client_id:     clientId,
    response_type: 'code',
    redirect_uri:  process.env.PROCORE_REDIRECT_URI!,
  });

  res.redirect(`https://login.procore.com/oauth/authorize?${params}`);
});

router.get('/procore/callback', async (req: Request, res: Response) => {
  const { code, error } = req.query;
  if (error || !code) {
    return res.redirect(`${FRONTEND_URL}/settings?error=procore_denied`);
  }

  try {
    const tokenRes = await axios.post('https://login.procore.com/oauth/token', {
      grant_type:    'authorization_code',
      client_id:     process.env.PROCORE_CLIENT_ID!,
      client_secret: process.env.PROCORE_CLIENT_SECRET!,
      code:          code as string,
      redirect_uri:  process.env.PROCORE_REDIRECT_URI!,
    });
    const { access_token, refresh_token, expires_in } = tokenRes.data;

    // Get Procore profile
    const profileRes = await axios.get('https://api.procore.com/rest/v1.0/me', {
      headers: { Authorization: `Bearer ${access_token}` },
    });
    const { id: pcId, name, login: email } = profileRes.data;

    const user = upsertUser({ email, name, procoreId: String(pcId) });
    upsertOAuthToken({
      userId:       user.id,
      provider:     'PROCORE',
      accessToken:  encode(access_token),
      refreshToken: refresh_token ? encode(refresh_token) : undefined,
      expiresAt:    new Date(Date.now() + expires_in * 1000),
    });

    const token = makeToken(user.id);
    res.redirect(`${FRONTEND_URL}/dashboard?token=${token}&connected=procore&user=${encodeURIComponent(name)}`);
  } catch (err: any) {
    console.error('[Auth] Procore callback failed:', err?.response?.data || err.message);
    res.redirect(`${FRONTEND_URL}/settings?error=procore_failed`);
  }
});

// ── Status ────────────────────────────────────────────────

router.get('/status', (req: Request, res: Response) => {
  const userId = authMiddleware(req);

  const status: any = {
    microsoftConfigured: outlookSync.isConfigured,
    procoreConfigured:   procoreSync.isConfigured,
    microsoftConnected:  false,
    procoreConnected:    false,
    user:                null,
  };

  if (userId) {
    const tokens = getTokensByUser(userId);
    status.microsoftConnected = tokens.some((t: any) => t.provider === 'MICROSOFT_OUTLOOK');
    status.procoreConnected   = tokens.some((t: any) => t.provider === 'PROCORE');

    const user = getUserById(userId);
    if (user) status.user = { id: user.id, name: user.name, email: user.email, role: user.role };
  }

  res.json(status);
});

// ── Manual sync trigger ───────────────────────────────────

router.post('/sync/:projectId', async (req: Request, res: Response) => {
  const userId = authMiddleware(req);
  if (!userId) return res.status(401).json({ error: 'Not authenticated' });

  const { projectId } = req.params;
  const results = { rfis: 0, submittals: 0, emails: 0 };

  // procoreSync needs a Procore project numeric ID
  // For now just use the projectId as the procore id
  if (procoreSync.isConfigured) {
    results.rfis       = await procoreSync.syncRFIs(userId, projectId, parseInt(projectId));
    results.submittals = await procoreSync.syncSubmittals(userId, projectId, parseInt(projectId));
  }

  if (outlookSync.isConfigured) {
    results.emails = await outlookSync.syncProjectEmails(userId, projectId, projectId);
  }

  res.json({ success: true, synced: results });
});

// ── Procore projects for user ─────────────────────────────

router.get('/procore/projects', async (req: Request, res: Response) => {
  const userId = authMiddleware(req);
  if (!userId) return res.status(401).json({ error: 'Not authenticated' });

  const projects = await procoreSync.getUserProjects(userId);
  res.json(projects);
});

export default router;

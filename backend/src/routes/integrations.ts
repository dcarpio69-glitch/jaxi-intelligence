/**
 * JAXI Intelligence — Integrations Route
 * Microsoft Outlook OAuth 2.0 + status endpoints
 */
import { Router, Request, Response } from 'express';
import axios from 'axios';
import { config } from '../config/env';
import { upsertUser, upsertOAuthToken, getDb, logSync } from '../utils/db';
import { outlookSync } from '../services/outlookSync';
import { procoreSync } from '../services/procoreSync';

const router = Router();

const ENCODE = (t: string) => Buffer.from(t).toString('base64');
const DECODE = (t: string) => { try { return Buffer.from(t, 'base64').toString('utf-8'); } catch { return t; } };

// ─── Status ──────────────────────────────────────────────────────────────────
router.get('/status', (_req: Request, res: Response) => {
  const db = getDb();

  // Check if any user has a valid Microsoft token
  const msToken = db.prepare(
    "SELECT t.expiresAt FROM oauth_tokens t WHERE t.provider='MICROSOFT_OUTLOOK' ORDER BY t.updatedAt DESC LIMIT 1"
  ).get() as any;

  const procoreToken = db.prepare(
    "SELECT t.expiresAt FROM oauth_tokens t WHERE t.provider='PROCORE' ORDER BY t.updatedAt DESC LIMIT 1"
  ).get() as any;

  const outlookConnected  = !!msToken && new Date(msToken.expiresAt) > new Date();
  const procoreConnected  = !!procoreToken && new Date(procoreToken.expiresAt) > new Date();

  // Email thread count
  const emailCount = (db.prepare('SELECT COUNT(*) as n FROM email_threads').get() as any)?.n ?? 0;
  const lastSync   = (db.prepare(
    "SELECT syncedAt FROM sync_logs WHERE source='OUTLOOK' AND status='SUCCESS' ORDER BY syncedAt DESC LIMIT 1"
  ).get() as any)?.syncedAt ?? null;

  res.json({
    integrations: {
      outlook: outlookConnected,
      procore: procoreConnected,
    },
    stats: {
      emailThreads: emailCount,
      lastOutlookSync: lastSync,
    },
  });
});

// ─── Microsoft OAuth — Step 1: Redirect to login ─────────────────────────────
router.get('/outlook/connect', (_req: Request, res: Response) => {
  if (!config.MICROSOFT_CLIENT_ID) {
    return res.status(400).json({ error: 'Microsoft credentials not configured. Add MICROSOFT_CLIENT_ID to backend/.env' });
  }

  const params = new URLSearchParams({
    client_id:     config.MICROSOFT_CLIENT_ID,
    response_type: 'code',
    redirect_uri:  config.MICROSOFT_REDIRECT_URI,
    scope:         'openid profile email User.Read offline_access',
    response_mode: 'query',
    state:         'jaxi-outlook-connect',
    prompt:        'select_account',
  });

  const tenant = config.MICROSOFT_TENANT_ID || 'organizations';
  const authUrl = `https://login.microsoftonline.com/${tenant}/oauth2/v2.0/authorize?${params.toString()}`;
  res.redirect(authUrl);

});

// ─── Microsoft Admin Consent (for org tenants with strict policies) ─────────────
router.get('/outlook/admin-consent', (_req: Request, res: Response) => {
  if (!config.MICROSOFT_CLIENT_ID) {
    return res.status(400).json({ error: 'Microsoft credentials not configured.' });
  }
  const params = new URLSearchParams({
    client_id:    config.MICROSOFT_CLIENT_ID,
    redirect_uri: config.MICROSOFT_REDIRECT_URI.replace('/callback', '/admin-callback'),
    state:        'jaxi-admin-consent',
  });
  const consentUrl = `https://login.microsoftonline.com/${config.MICROSOFT_TENANT_ID || 'common'}/adminconsent?${params.toString()}`;
  res.redirect(consentUrl);
});

// After admin grants consent, redirect to regular connect flow
router.get('/outlook/admin-callback', (_req: Request, res: Response) => {
  const { error } = _req.query as Record<string, string>;
  if (error) {
    return res.redirect(`${config.FRONTEND_URL}/settings?error=admin_consent_denied`);
  }
  // Admin consent granted — now send user through regular OAuth to get their token
  res.redirect(`${config.FRONTEND_URL}/settings?info=admin_consent_granted`);
});

// ─── Microsoft OAuth — Step 2: Callback ──────────────────────────────────────
router.get('/outlook/callback', async (req: Request, res: Response) => {
  const { code, error, error_description } = req.query as Record<string, string>;

  if (error) {
    console.error('[Outlook OAuth] Error:', error, error_description);
    return res.redirect(`${config.FRONTEND_URL}/settings?error=outlook_auth_failed&reason=${encodeURIComponent(error_description || error)}`);
  }

  if (!code) {
    return res.redirect(`${config.FRONTEND_URL}/settings?error=outlook_no_code`);
  }

  try {
    // Exchange code for tokens
    const params = new URLSearchParams({
      client_id:     config.MICROSOFT_CLIENT_ID,
      client_secret: config.MICROSOFT_CLIENT_SECRET,
      code,
      redirect_uri:  config.MICROSOFT_REDIRECT_URI,
      grant_type:    'authorization_code',
    });

    const tokenResp = await axios.post(
      `https://login.microsoftonline.com/${config.MICROSOFT_TENANT_ID || 'common'}/oauth2/v2.0/token`,
      params.toString(),
      { headers: { 'Content-Type': 'application/x-www-form-urlencoded' } }
    );

    const { access_token, refresh_token, expires_in, id_token } = tokenResp.data;

    // Get user profile from Microsoft Graph
    const profileResp = await axios.get('https://graph.microsoft.com/v1.0/me', {
      headers: { Authorization: `Bearer ${access_token}` },
    });
    const profile = profileResp.data;

    // Upsert user in DB
    const user = upsertUser({
      email:       profile.mail || profile.userPrincipalName,
      name:        profile.displayName || profile.mail,
      microsoftId: profile.id,
    });

    // Store OAuth token (encoded)
    upsertOAuthToken({
      userId:       user.id,
      provider:     'MICROSOFT_OUTLOOK',
      accessToken:  ENCODE(access_token),
      refreshToken: refresh_token ? ENCODE(refresh_token) : undefined,
      expiresAt:    new Date(Date.now() + (expires_in ?? 3600) * 1000),
      scope:        'Mail.Read User.Read offline_access',
    });

    console.log(`[Outlook] Connected: ${profile.displayName} (${profile.mail})`);

    // Trigger initial email sync in background
    triggerOutlookSync(user.id).catch(e => console.error('[Outlook] Background sync error:', e.message));

    // Redirect back to settings with success
    res.redirect(`${config.FRONTEND_URL}/settings?connected=outlook&user=${encodeURIComponent(profile.displayName || profile.mail)}`);

  } catch (e: any) {
    console.error('[Outlook OAuth] Token exchange failed:', e?.response?.data || e.message);
    res.redirect(`${config.FRONTEND_URL}/settings?error=outlook_token_failed`);
  }
});

// ─── Manual sync trigger ──────────────────────────────────────────────────────
router.post('/outlook/sync', async (req: Request, res: Response) => {
  try {
    const db = getDb();
    const tokenRec = db.prepare(
      "SELECT userId FROM oauth_tokens WHERE provider='MICROSOFT_OUTLOOK' ORDER BY updatedAt DESC LIMIT 1"
    ).get() as any;

    if (!tokenRec) {
      return res.status(400).json({ error: 'Outlook not connected. Go to /settings to connect.' });
    }

    const projects = db.prepare("SELECT id, name FROM projects WHERE status='ACTIVE'").all() as any[];
    let totalSynced = 0;

    for (const proj of projects.slice(0, 3)) { // sync first 3 active projects
      const n = await outlookSync.syncProjectEmails(tokenRec.userId, proj.id, proj.name, ['RFI', 'submittal', 'approval']);
      totalSynced += n;
    }

    res.json({ success: true, emailsSynced: totalSynced, projectsScanned: Math.min(projects.length, 3) });
  } catch (e: any) {
    res.status(500).json({ error: e.message });
  }
});

// ─── Disconnect Outlook ───────────────────────────────────────────────────────
router.delete('/outlook', (_req: Request, res: Response) => {
  try {
    const db = getDb();
    db.prepare("DELETE FROM oauth_tokens WHERE provider='MICROSOFT_OUTLOOK'").run();
    res.json({ success: true, message: 'Outlook disconnected' });
  } catch (e: any) {
    res.status(500).json({ error: e.message });
  }
});

// ─── DEMO Connect (bypasses OAuth for demo/presentation use) ──────────────────
router.get('/outlook/demo-connect', (_req: Request, res: Response) => {
  try {
    const db = getDb();

    // Create a demo user
    const demoUser = upsertUser({
      email:       'dcarpio@jaxi.com',
      name:        'Daniel Carpio',
      microsoftId: 'demo-ms-user-jaxi-001',
    });

    // Insert a 90-day fake token so status endpoint shows "connected"
    upsertOAuthToken({
      userId:       demoUser.id,
      provider:     'MICROSOFT_OUTLOOK',
      accessToken:  Buffer.from('demo-access-token-jaxi-intelligence-2026').toString('base64'),
      refreshToken: Buffer.from('demo-refresh-token-jaxi-intelligence-2026').toString('base64'),
      expiresAt:    new Date(Date.now() + 90 * 24 * 3600 * 1000),  // 90 days
      scope:        'Mail.Read User.Read offline_access',
    });

    // Seed realistic construction email threads
    const now = Date.now();
    const daysAgo = (d: number) => new Date(now - d * 86400000).toISOString();

    // 1) Ensure projects exist (FK requirement)
    const insertProject = db.prepare(`
      INSERT OR IGNORE INTO projects (id, name, code, status, city, state, procoreId)
      VALUES (@id, @name, @code, @status, @city, @state, @procoreId)
    `);
    const seedProjects = db.transaction(() => {
      insertProject.run({ id:'6008', name:'The Edge at Sunset',       code:'06008', status:'ACTIVE', city:'South Miami',     state:'FL', procoreId:'6008' });
      insertProject.run({ id:'6000', name:'626 Flagler',               code:'06000', status:'ACTIVE', city:'Fort Lauderdale', state:'FL', procoreId:'6000' });
      insertProject.run({ id:'5998', name:'Empire Brickell',           code:'05998', status:'ACTIVE', city:'Miami',           state:'FL', procoreId:'5998' });
    });
    seedProjects();

    const demoEmails = [
      { outlookId:'demo-email-001', projectId:'6008', subject:'RE: RFI #78 – Exterior Finishes & Humidity Concerns | The Edge at Sunset', senderEmail:'imelendez@owner-group.com', senderName:'Ingrid Melendez', receivedAt:daysAgo(2), hasCommitment:1, commitmentText:'We will confirm the revised moisture barrier spec by EOW.', sentiment:'NEUTRAL', rfiId:null, submittalId:null },
      { outlookId:'demo-email-002', projectId:'6008', subject:'RFI #88 – Level 3 RCP vs. Mechanical Duct Conflicts – URGENT',             senderEmail:'lricardo@jaxi.com',            senderName:'Len Ricardo',       receivedAt:daysAgo(4), hasCommitment:0, commitmentText:null, sentiment:'NEGATIVE', rfiId:null, submittalId:null },
      { outlookId:'demo-email-003', projectId:'6008', subject:'Submittal 16-16000-3 – Lighting Fixtures B.O.H. – Return for Revision',     senderEmail:'brokovich@architect-firm.com', senderName:'Betty Rokovich',    receivedAt:daysAgo(5), hasCommitment:1, commitmentText:'Please resubmit with compliant fixtures within 10 business days.', sentiment:'NEGATIVE', rfiId:null, submittalId:null },
      { outlookId:'demo-email-004', projectId:'6008', subject:'RE: Swimming Pool Finish Samples – Aquarama Review Status',                  senderEmail:'projects@aquarama-pools.com',  senderName:'Carlos Mendes – Aquarama Pools', receivedAt:daysAgo(7), hasCommitment:1, commitmentText:'Will expedite delivery to site within 3 business days after approval.', sentiment:'POSITIVE', rfiId:null, submittalId:null },
      { outlookId:'demo-email-005', projectId:'6008', subject:'OAC Meeting Notes – The Edge at Sunset – June 18, 2026',                     senderEmail:'ohernandez@jaxi.com',          senderName:'Oscar Hernandez',   receivedAt:daysAgo(6), hasCommitment:1, commitmentText:'Contractor committed to mobilize for pool deck waterproofing on July 7.', sentiment:'NEUTRAL', rfiId:null, submittalId:null },
      { outlookId:'demo-email-006', projectId:'6008', subject:'Change Order #12 – Structural Steel Reinforcement Level 4',                  senderEmail:'accounting@steelworks-miami.com', senderName:'Maria Gonzalez – SteelWorks Miami', receivedAt:daysAgo(9), hasCommitment:0, commitmentText:null, sentiment:'NEUTRAL', rfiId:null, submittalId:null },
      { outlookId:'demo-email-007', projectId:'6008', subject:'RE: FPL Vault Layout – Caymares Electric – Sub 16-16000-13',                 senderEmail:'pe@caymares-electric.com',     senderName:'Pedro Esteban – Caymares Electric', receivedAt:daysAgo(3), hasCommitment:1, commitmentText:'Crew ready to start rough-in next Monday pending submittal approval.', sentiment:'POSITIVE', rfiId:null, submittalId:null },
      { outlookId:'demo-email-008', projectId:'6008', subject:'OVERDUE – RFI #88 Response Required Immediately',                            senderEmail:'dcarpio@jaxi.com',             senderName:'Daniel Carpio',     receivedAt:daysAgo(1), hasCommitment:0, commitmentText:null, sentiment:'NEGATIVE', rfiId:null, submittalId:null },
      { outlookId:'demo-email-009', projectId:'6008', subject:'Railing Submittal 05-05100-2 – All Dade Fences – Approved',                  senderEmail:'lricardo@jaxi.com',            senderName:'Len Ricardo',       receivedAt:daysAgo(1), hasCommitment:1, commitmentText:'All Dade Fences can proceed with fabrication, expected lead time 6 weeks.', sentiment:'POSITIVE', rfiId:null, submittalId:null },
      { outlookId:'demo-email-010', projectId:'6008', subject:'Schedule Update – Critical Path Review – Week of June 23',                   senderEmail:'ohernandez@jaxi.com',          senderName:'Oscar Hernandez',   receivedAt:daysAgo(1), hasCommitment:1, commitmentText:'Pool deck waterproofing starts July 7 as committed.', sentiment:'NEUTRAL', rfiId:null, submittalId:null },
      { outlookId:'demo-email-011', projectId:'6000', subject:'RE: 626 Flagler – Permit Review Comments – City of Fort Lauderdale',         senderEmail:'permits@ftlauderdale.gov',     senderName:'City of Fort Lauderdale – Permits', receivedAt:daysAgo(10), hasCommitment:0, commitmentText:null, sentiment:'NEUTRAL', rfiId:null, submittalId:null },
      { outlookId:'demo-email-012', projectId:'5998', subject:'Empire Brickell – Foundation Pour Confirmation',                              senderEmail:'site@empire-brickell.com',     senderName:'Site Team – Empire Brickell', receivedAt:daysAgo(3), hasCommitment:1, commitmentText:'Cemex committed to delivery every 45 minutes to maintain continuous pour.', sentiment:'POSITIVE', rfiId:null, submittalId:null },
    ];

    // Insert demo email threads (skip if outlookId already exists)
    const insertEmail = db.prepare(`
      INSERT OR IGNORE INTO email_threads
        (id, outlookId, projectId, subject, senderEmail, senderName, receivedAt,
         hasCommitment, commitmentText, sentiment, rfiId, submittalId)
      VALUES
        (lower(hex(randomblob(16))), @outlookId, @projectId, @subject, @senderEmail, @senderName, @receivedAt,
         @hasCommitment, @commitmentText, @sentiment, @rfiId, @submittalId)
    `);

    const insertMany = db.transaction((emails: any[]) => {
      for (const e of emails) insertEmail.run(e);
    });
    insertMany(demoEmails);

    // Log a successful sync
    logSync({ source: 'OUTLOOK', status: 'SUCCESS', recordsProcessed: demoEmails.length, message: 'Demo connect — 12 emails seeded' });

    console.log('[Demo] Outlook demo connection established with', demoEmails.length, 'email threads');
    res.redirect(`${config.FRONTEND_URL}/settings?connected=outlook&user=${encodeURIComponent('Daniel Carpio')}`);

  } catch (e: any) {
    console.error('[Demo Connect] Error:', e.message);
    res.status(500).json({ error: e.message });
  }
});

// ─── Procore OAuth — Step 1 ───────────────────────────────────────────────────

router.get('/procore/connect', (_req: Request, res: Response) => {
  if (!config.PROCORE_CLIENT_ID) {
    return res.status(400).json({ error: 'Procore credentials not configured. Add PROCORE_CLIENT_ID to backend/.env' });
  }

  const params = new URLSearchParams({
    client_id:     config.PROCORE_CLIENT_ID,
    response_type: 'code',
    redirect_uri:  config.PROCORE_REDIRECT_URI,
  });

  res.redirect(`https://login.procore.com/oauth/authorize?${params.toString()}`);
});

// ─── Procore OAuth — Step 2: Callback ────────────────────────────────────────
router.get('/procore/callback', async (req: Request, res: Response) => {
  const { code, error } = req.query as Record<string, string>;

  if (error || !code) {
    return res.redirect(`${config.FRONTEND_URL}/settings?error=procore_auth_failed`);
  }

  try {
    const tokenResp = await axios.post('https://login.procore.com/oauth/token', {
      grant_type:    'authorization_code',
      client_id:     config.PROCORE_CLIENT_ID,
      client_secret: config.PROCORE_CLIENT_SECRET,
      redirect_uri:  config.PROCORE_REDIRECT_URI,
      code,
    });

    const { access_token, refresh_token, expires_in } = tokenResp.data;

    // Get Procore user profile
    const profileResp = await axios.get('https://api.procore.com/rest/v1.0/me', {
      headers: { Authorization: `Bearer ${access_token}` },
    });
    const profile = profileResp.data;

    const user = upsertUser({
      email:     profile.email_address || profile.login,
      name:      profile.name,
      procoreId: String(profile.id),
    });

    upsertOAuthToken({
      userId:       user.id,
      provider:     'PROCORE',
      accessToken:  ENCODE(access_token),
      refreshToken: refresh_token ? ENCODE(refresh_token) : undefined,
      expiresAt:    new Date(Date.now() + (expires_in ?? 7200) * 1000),
      scope:        'procore_global',
    });

    console.log(`[Procore] Connected: ${profile.name} (${profile.email_address})`);

    // ── Trigger initial Procore sync in background ──
    triggerProcoreSync(user.id).catch(e => console.error('[Procore] Background sync error:', e.message));

    res.redirect(`${config.FRONTEND_URL}/settings?connected=procore&user=${encodeURIComponent(profile.name)}`);

  } catch (e: any) {
    console.error('[Procore OAuth] Failed:', e?.response?.data || e.message);
    res.redirect(`${config.FRONTEND_URL}/settings?error=procore_token_failed`);
  }
});

// ─── Helper: Outlook background sync ─────────────────────────────────────────
export async function triggerOutlookSync(userId: string): Promise<void> {
  const db = getDb();
  const projects = db.prepare("SELECT id, name FROM projects WHERE status='ACTIVE' LIMIT 3").all() as any[];

  if (projects.length === 0) {
    console.log('[Outlook] No active projects found for sync — will sync on next Procore sync');
    return;
  }

  for (const proj of projects) {
    await outlookSync.syncProjectEmails(userId, proj.id, proj.name, ['RFI', 'submittal', 'approval', 'review']);
  }
}

// ─── Helper: Procore background sync ─────────────────────────────────────────
export async function triggerProcoreSync(userId: string): Promise<void> {
  const db = getDb();

  // 1. Get user's Procore projects
  console.log('[Procore] Starting initial sync...');
  const procoreProjects = await procoreSync.getUserProjects(userId);

  if (procoreProjects.length === 0) {
    console.log('[Procore] No projects found — check company access');
    return;
  }

  // 2. Upsert projects in local DB + sync RFIs & Submittals
  const insertProject = db.prepare(`
    INSERT OR IGNORE INTO projects (id, name, code, status, city, state, procoreId)
    VALUES (@id, @name, @code, @status, @city, @state, @procoreId)
  `);

  let totalRFIs = 0;
  let totalSubs = 0;

  for (const p of procoreProjects.slice(0, 5)) {  // limit to 5 projects on first sync
    const localId = `procore-${p.id}`;
    insertProject.run({
      id:        localId,
      name:      p.name,
      code:      p.project_number || String(p.id),
      status:    p.active ? 'ACTIVE' : 'INACTIVE',
      city:      p.city || null,
      state:     p.state_code || null,
      procoreId: String(p.id),
    });

    const [rfis, subs] = await Promise.all([
      procoreSync.syncRFIs(userId, localId, p.id),
      procoreSync.syncSubmittals(userId, localId, p.id),
    ]);
    totalRFIs += rfis;
    totalSubs += subs;
    console.log(`[Procore] ${p.name}: ${rfis} RFIs, ${subs} Submittals`);
  }

  console.log(`[Procore] Initial sync complete — ${totalRFIs} RFIs, ${totalSubs} Submittals across ${Math.min(procoreProjects.length, 5)} projects`);

  // 3. Now cross-reference with Outlook emails
  const outlookToken = db.prepare(
    "SELECT userId FROM oauth_tokens WHERE provider='MICROSOFT_OUTLOOK' ORDER BY updatedAt DESC LIMIT 1"
  ).get() as any;

  if (outlookToken) {
    console.log('[JAXI] Both connected — running cross-reference sync...');
    await triggerOutlookSync(outlookToken.userId);
    console.log('[JAXI] Cross-reference sync complete ✓');
  } else {
    console.log('[Procore] Outlook not connected yet — email cross-reference will run when Outlook connects');
  }
}

export default router;

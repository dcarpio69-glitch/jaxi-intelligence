import { config } from '../config/env';
import { logger } from '../utils/logger';

const GRAPH_BASE = 'https://graph.microsoft.com/v1.0';

export interface MicrosoftUserProfile {
  id: string;
  displayName: string;
  mail: string | null;
  userPrincipalName: string;
  jobTitle: string | null;
  officeLocation: string | null;
  mobilePhone: string | null;
  preferredLanguage: string | null;
}

export interface OutlookEmail {
  id: string;
  subject: string;
  receivedDateTime: string;
  from: { emailAddress: { name: string; address: string } };
  bodyPreview: string;
  hasAttachments: boolean;
  isRead: boolean;
  conversationId: string;
  webLink: string;
}

// ─── Get user profile from Microsoft Graph ────────────────
export async function getMicrosoftProfile(accessToken: string): Promise<MicrosoftUserProfile> {
  const res = await fetch(`${GRAPH_BASE}/me`, {
    headers: { Authorization: `Bearer ${accessToken}` },
  });
  if (!res.ok) {
    const err = await res.text();
    logger.error('Microsoft Graph /me failed', { status: res.status, err });
    throw new Error(`Microsoft Graph error: ${res.status}`);
  }
  return res.json();
}

// ─── Get emails related to a project keyword ─────────────
export async function searchProjectEmails(
  accessToken: string,
  projectKeyword: string,
  topN = 50,
): Promise<OutlookEmail[]> {
  const filter = encodeURIComponent(
    `contains(subject, '${projectKeyword}') or contains(body/content, '${projectKeyword}')`,
  );
  const url = `${GRAPH_BASE}/me/messages?$top=${topN}&$filter=${filter}&$select=id,subject,receivedDateTime,from,bodyPreview,hasAttachments,isRead,conversationId,webLink&$orderby=receivedDateTime desc`;

  const res = await fetch(url, {
    headers: { Authorization: `Bearer ${accessToken}` },
  });

  if (!res.ok) {
    logger.warn('Graph email search failed', { status: res.status, keyword: projectKeyword });
    return [];
  }

  const data = await res.json();
  return data.value ?? [];
}

// ─── Get full email thread by conversationId ─────────────
export async function getEmailThread(
  accessToken: string,
  conversationId: string,
): Promise<OutlookEmail[]> {
  const filter = encodeURIComponent(`conversationId eq '${conversationId}'`);
  const url = `${GRAPH_BASE}/me/messages?$filter=${filter}&$orderby=receivedDateTime asc&$top=20`;

  const res = await fetch(url, {
    headers: { Authorization: `Bearer ${accessToken}` },
  });

  if (!res.ok) return [];
  const data = await res.json();
  return data.value ?? [];
}

// ─── Refresh Microsoft access token ──────────────────────
export async function refreshMicrosoftToken(refreshToken: string): Promise<{
  access_token: string;
  refresh_token: string;
  expires_in: number;
}> {
  const res = await fetch(
    `https://login.microsoftonline.com/${config.MICROSOFT_TENANT_ID}/oauth2/v2.0/token`,
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({
        client_id: config.MICROSOFT_CLIENT_ID,
        client_secret: config.MICROSOFT_CLIENT_SECRET,
        refresh_token: refreshToken,
        grant_type: 'refresh_token',
        scope: 'Mail.Read User.Read offline_access',
      }),
    },
  );
  const data = await res.json() as any;
  if (data.error) throw new Error(`Token refresh failed: ${data.error_description}`);
  return data;
}

/**
 * JAXI Intelligence — Microsoft Outlook Sync Service
 * Fetches real emails from Microsoft Graph API,
 * links them to RFIs/Submittals, and stores in SQLite.
 */

import axios from 'axios';
import { getOAuthToken, upsertOAuthToken, upsertEmailThread, logSync, getDb } from '../utils/db';

const encode = (text: string) => Buffer.from(text).toString('base64');
const decode = (text: string) => { try { return Buffer.from(text, 'base64').toString('utf-8'); } catch { return text; } };

export class OutlookSyncService {
  private clientId     = process.env.MICROSOFT_CLIENT_ID     || '';
  private clientSecret = process.env.MICROSOFT_CLIENT_SECRET || '';
  private tenantId     = process.env.MICROSOFT_TENANT_ID     || 'common';
  private graphBase    = 'https://graph.microsoft.com/v1.0';

  get isConfigured(): boolean {
    return !!this.clientId && this.clientId !== 'YOUR_AZURE_CLIENT_ID_HERE';
  }

  async refreshToken(userId: string): Promise<string | null> {
    try {
      const rec = getOAuthToken(userId, 'MICROSOFT_OUTLOOK');
      if (!rec?.refreshToken) return null;

      const params = new URLSearchParams({
        client_id:     this.clientId,
        client_secret: this.clientSecret,
        refresh_token: decode(rec.refreshToken),
        grant_type:    'refresh_token',
        scope:         'Mail.Read User.Read offline_access',
      });

      const resp = await axios.post(
        `https://login.microsoftonline.com/${this.tenantId}/oauth2/v2.0/token`,
        params.toString(),
        { headers: { 'Content-Type': 'application/x-www-form-urlencoded' } }
      );
      const { access_token, refresh_token, expires_in } = resp.data;
      upsertOAuthToken({
        userId, provider: 'MICROSOFT_OUTLOOK',
        accessToken:  encode(access_token),
        refreshToken: refresh_token ? encode(refresh_token) : undefined,
        expiresAt:    new Date(Date.now() + expires_in * 1000),
      });
      return access_token;
    } catch (e: any) {
      console.error('[Outlook] Token refresh failed:', e.message);
      return null;
    }
  }

  async getAccessToken(userId: string): Promise<string | null> {
    const rec = getOAuthToken(userId, 'MICROSOFT_OUTLOOK');
    if (!rec) return null;
    if (new Date() < new Date(rec.expiresAt)) return decode(rec.accessToken);
    return this.refreshToken(userId);
  }

  async syncProjectEmails(userId: string, projectId: string, projectName: string, keywords: string[] = []): Promise<number> {
    const token = await this.getAccessToken(userId);
    if (!token) return 0;

    try {
      const searchQuery = [projectName, ...keywords, 'RFI', 'submittal'].map(k => `"${k}"`).join(' OR ');

      const resp = await axios.get(`${this.graphBase}/me/messages`, {
        headers: { Authorization: `Bearer ${token}` },
        params: {
          $search: searchQuery,
          $top:    200,
          $select: 'id,subject,from,receivedDateTime,bodyPreview',
          $orderby: 'receivedDateTime desc',
        },
      });

      const emails: any[] = resp.data.value || [];
      let synced = 0;
      const db = getDb();

      for (const email of emails) {
        const body = email.bodyPreview || '';
        const { hasCommitment, commitmentText, sentiment } = this.analyzeEmail(body);

        // Match to RFI/Submittal
        const rfiMatch = this.matchNumber(email.subject + ' ' + body, /RFI[\s\-#]*(\d+)/i);
        const rfi = rfiMatch ? db.prepare('SELECT id FROM rfis WHERE projectId=? AND number=?').get(projectId, rfiMatch) : null;

        const subMatch = !rfi ? this.matchNumber(email.subject + ' ' + body, /(?:SUB|submittal)[\s\-#]*(\d+)/i) : null;
        const sub = subMatch ? db.prepare('SELECT id FROM submittals WHERE projectId=? AND number=?').get(projectId, subMatch) : null;

        upsertEmailThread({
          projectId,
          rfiId:       (rfi as any)?.id || null,
          submittalId: (sub as any)?.id || null,
          outlookId:   email.id,
          subject:     email.subject,
          senderEmail: email.from.emailAddress.address,
          senderName:  email.from.emailAddress.name,
          receivedAt:  email.receivedDateTime,
          hasCommitment,
          commitmentText,
          sentiment,
        });
        synced++;
      }

      logSync(projectId, 'OUTLOOK', 'SUCCESS', synced);
      console.log(`[Outlook] Synced ${synced} emails for project ${projectId}`);
      return synced;
    } catch (e: any) {
      console.error('[Outlook] Email sync failed:', e?.response?.data || e.message);
      logSync(projectId, 'OUTLOOK', 'FAILED', 0, e.message);
      return 0;
    }
  }

  private analyzeEmail(text: string): { hasCommitment: boolean; commitmentText: string | null; sentiment: string } {
    const lower = text.toLowerCase();
    const patterns = [
      /i('ll| will) (respond|send|provide|get back|submit|review|complete).{0,60}(by|before|on|this|next)/i,
      /we('ll| will) have.{0,50}(by|before|on)/i,
      /(monday|tuesday|wednesday|thursday|friday|eod|end of day|this week|next week)/i,
    ];
    let hasCommitment = false;
    let commitmentText: string | null = null;
    for (const p of patterns) {
      const m = text.match(p);
      if (m) { hasCommitment = true; commitmentText = m[0].substring(0, 200); break; }
    }
    const urgentWords = ['urgent','critical','asap','blocking','overdue'];
    const negWords    = ['concern','issue','problem','delay','reject','wrong'];
    const posWords    = ['approved','resolved','confirmed','ready'];
    let sentiment = 'neutral';
    if (urgentWords.some(w => lower.includes(w))) sentiment = 'urgent';
    else if (negWords.some(w => lower.includes(w))) sentiment = 'negative';
    else if (posWords.some(w => lower.includes(w))) sentiment = 'positive';
    return { hasCommitment, commitmentText, sentiment };
  }

  private matchNumber(text: string, pattern: RegExp): string | null {
    const m = text.match(pattern);
    return m ? m[1] : null;
  }
}

export const outlookSync = new OutlookSyncService();

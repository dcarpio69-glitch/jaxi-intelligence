/**
 * JAXI Intelligence — Procore Sync Service
 * Fetches real RFIs and Submittals from the Procore API
 * and stores them in the local SQLite database.
 */

import axios from 'axios';
import { getOAuthToken, upsertOAuthToken, getSystemUser, upsertRFI, upsertSubmittal, logSync } from '../utils/db';

const encode = (text: string) => Buffer.from(text).toString('base64');
const decode = (text: string) => { try { return Buffer.from(text, 'base64').toString('utf-8'); } catch { return text; } };

export class ProcoreSyncService {
  private clientId     = process.env.PROCORE_CLIENT_ID     || '';
  private clientSecret = process.env.PROCORE_CLIENT_SECRET || '';
  private baseUrl      = 'https://api.procore.com';

  get isConfigured(): boolean {
    return !!this.clientId && this.clientId !== 'YOUR_PROCORE_CLIENT_ID_HERE';
  }

  async refreshToken(userId: string): Promise<string | null> {
    try {
      const rec = getOAuthToken(userId, 'PROCORE');
      if (!rec?.refreshToken) return null;

      const resp = await axios.post(`${this.baseUrl}/oauth/token`, {
        grant_type:    'refresh_token',
        client_id:     this.clientId,
        client_secret: this.clientSecret,
        refresh_token: decode(rec.refreshToken),
      });
      const { access_token, refresh_token, expires_in } = resp.data;
      upsertOAuthToken({
        userId, provider: 'PROCORE',
        accessToken:  encode(access_token),
        refreshToken: refresh_token ? encode(refresh_token) : undefined,
        expiresAt:    new Date(Date.now() + expires_in * 1000),
      });
      return access_token;
    } catch (e: any) {
      console.error('[Procore] Token refresh failed:', e.message);
      return null;
    }
  }

  async getAccessToken(userId: string): Promise<string | null> {
    const rec = getOAuthToken(userId, 'PROCORE');
    if (!rec) return null;
    if (new Date() < new Date(rec.expiresAt)) return decode(rec.accessToken);
    return this.refreshToken(userId);
  }

  async getUserProjects(userId: string): Promise<any[]> {
    const token = await this.getAccessToken(userId);
    if (!token) return [];
    try {
      const meRes = await axios.get(`${this.baseUrl}/rest/v1.0/me`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const companies = meRes.data.companies || [];
      const all: any[] = [];
      for (const co of companies) {
        const proj = await axios.get(`${this.baseUrl}/rest/v1.0/projects`, {
          headers: { Authorization: `Bearer ${token}` },
          params:  { company_id: co.id, per_page: 100 },
        });
        all.push(...(proj.data || []));
      }
      return all;
    } catch (e: any) {
      console.error('[Procore] Get projects failed:', e?.response?.data || e.message);
      return [];
    }
  }

  async syncRFIs(userId: string, projectId: string, procoreProjectId: number): Promise<number> {
    const token = await this.getAccessToken(userId);
    if (!token) return 0;
    try {
      const resp = await axios.get(`${this.baseUrl}/rest/v1.0/projects/${procoreProjectId}/rfis`, {
        headers: { Authorization: `Bearer ${token}` },
        params:  { per_page: 300, status: 'open' },
      });
      const rfis: any[] = resp.data || [];
      const sysUser = getSystemUser();
      let synced = 0;

      for (const rfi of rfis) {
        const daysOv = rfi.due_date
          ? Math.max(0, Math.floor((Date.now() - new Date(rfi.due_date).getTime()) / 86400000))
          : 0;
        const risk = Math.min(100,
          (daysOv > 90 ? 40 : daysOv > 30 ? 25 : daysOv > 7 ? 15 : 0) +
          (rfi.priority === 'critical' ? 30 : rfi.priority === 'high' ? 20 : 10) +
          (rfi.ball_in_court ? 10 : 20)
        );
        upsertRFI({
          id: `procore-rfi-${rfi.id}`,
          projectId,
          number:     String(rfi.number),
          title:      rfi.title,
          description: rfi.description || '',
          status:     this.mapStatus(rfi.status, 'rfi'),
          priority:   this.mapPriority(rfi.priority),
          dueDate:    rfi.due_date || null,
          answeredAt: rfi.answered_at || null,
          procoreId:  String(rfi.id),
          procoreNum: rfi.number,
          riskScore:  risk,
          ballInCourt: rfi.ball_in_court?.name || null,
          createdById: sysUser?.id || 'system',
        });
        synced++;
      }
      logSync(projectId, 'PROCORE', 'SUCCESS', synced);
      console.log(`[Procore] Synced ${synced} RFIs`);
      return synced;
    } catch (e: any) {
      console.error('[Procore] RFI sync failed:', e?.response?.data || e.message);
      logSync(projectId, 'PROCORE', 'FAILED', 0, e.message);
      return 0;
    }
  }

  async syncSubmittals(userId: string, projectId: string, procoreProjectId: number): Promise<number> {
    const token = await this.getAccessToken(userId);
    if (!token) return 0;
    try {
      const resp = await axios.get(`${this.baseUrl}/rest/v1.0/projects/${procoreProjectId}/submittals`, {
        headers: { Authorization: `Bearer ${token}` },
        params:  { per_page: 300 },
      });
      const subs: any[] = resp.data || [];
      const sysUser = getSystemUser();
      let synced = 0;

      for (const sub of subs) {
        const daysOv = sub.due_date
          ? Math.max(0, Math.floor((Date.now() - new Date(sub.due_date).getTime()) / 86400000))
          : 0;
        const risk = Math.min(100, daysOv > 90 ? 85 : daysOv > 30 ? 65 : daysOv > 7 ? 45 : 20);
        upsertSubmittal({
          id:           `procore-sub-${sub.id}`,
          projectId,
          number:       sub.number || String(sub.id),
          title:        sub.title,
          description:  sub.description || '',
          status:       this.mapStatus(sub.status, 'sub'),
          specSection:  sub.spec_section ? `${sub.spec_section.label} ${sub.spec_section.description}` : null,
          packageName:  sub.submittal_package?.title || null,
          submittalType: sub.submittal_type || null,
          contractor:   sub.responsible_contractor?.name || sub.received_from?.name || null,
          ballInCourt:  sub.ball_in_court?.name || null,
          dueDate:      sub.due_date || null,
          procoreId:    String(sub.id),
          procoreNum:   sub.number,
          riskScore:    risk,
          createdById:  sysUser?.id || 'system',
        });
        synced++;
      }
      logSync(projectId, 'PROCORE', 'SUCCESS', synced);
      console.log(`[Procore] Synced ${synced} Submittals`);
      return synced;
    } catch (e: any) {
      console.error('[Procore] Submittal sync failed:', e?.response?.data || e.message);
      return 0;
    }
  }

  private mapStatus(status: string, type: 'rfi' | 'sub'): string {
    if (type === 'rfi') {
      const m: Record<string, string> = { draft:'DRAFT', open:'OPEN', pending:'PENDING_REVIEW', answered:'ANSWERED', closed:'CLOSED' };
      return m[status?.toLowerCase()] || 'OPEN';
    }
    const m: Record<string, string> = { draft:'DRAFT', submitted:'SUBMITTED', in_review:'IN_REVIEW', approved:'APPROVED', approved_as_noted:'APPROVED_AS_NOTED', rejected:'REJECTED', revise_and_resubmit:'RESUBMIT_REQUIRED', closed:'APPROVED' };
    return m[status?.toLowerCase()] || 'SUBMITTED';
  }

  private mapPriority(priority: string): string {
    const m: Record<string, string> = { critical:'CRITICAL', high:'HIGH', medium:'MEDIUM', low:'LOW' };
    return m[priority?.toLowerCase()] || 'MEDIUM';
  }
}

export const procoreSync = new ProcoreSyncService();

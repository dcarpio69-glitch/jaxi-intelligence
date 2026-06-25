import { config } from '../config/env';
import { logger } from '../utils/logger';

const PROCORE_API = 'https://api.procore.com/rest/v1.0';

export interface ProcoreUserProfile {
  id: number;
  login: string;
  name: string;
  email_address: string;
  job_title: string | null;
  avatar: string | null;
  created_at: string;
  updated_at: string;
}

export interface ProcoreProject {
  id: number;
  name: string;
  display_name: string;
  project_number: string | null;
  description: string | null;
  status: 'Active' | 'Inactive' | 'Published' | 'Draft';
  start_date: string | null;
  completion_date: string | null;
  project_stage: { id: number; name: string } | null;
  project_type: { id: number; name: string } | null;
  company: { id: number; name: string };
  address: string | null;
  city: string | null;
  state_code: string | null;
  country_code: string | null;
  time_zone: string;
  logo: string | null;
}

export interface ProcoreRFI {
  id: number;
  number: string;
  title: string;
  status: string;
  priority: string;
  due_date: string | null;
  created_at: string;
  updated_at: string;
  assignees: { id: number; name: string; login: string }[];
  ball_in_court: { id: number; name: string; login: string }[];
  responsible_contractor: { id: number; name: string } | null;
  custom_fields: Record<string, any>;
}

export interface ProcoreSubmittal {
  id: number;
  number: string;
  title: string;
  status: string;
  received_from_date: string | null;
  due_date: string | null;
  submittal_manager: { id: number; name: string } | null;
  responsible_contractor: { id: number; name: string } | null;
  spec_section: { label: string; description: string } | null;
}

// ─── Get Procore user profile ─────────────────────────────
export async function getProcoreProfile(accessToken: string): Promise<ProcoreUserProfile> {
  const res = await fetch(`${PROCORE_API}/me`, {
    headers: { Authorization: `Bearer ${accessToken}` },
  });
  if (!res.ok) {
    const err = await res.text();
    logger.error('Procore /me failed', { status: res.status, err });
    throw new Error(`Procore API error: ${res.status}`);
  }
  return res.json();
}

// ─── Get all projects user is a member of ────────────────
export async function getUserProjects(accessToken: string): Promise<ProcoreProject[]> {
  // Get companies the user belongs to first
  const companiesRes = await fetch(`${PROCORE_API}/companies`, {
    headers: { Authorization: `Bearer ${accessToken}` },
  });

  if (!companiesRes.ok) {
    logger.warn('Could not fetch Procore companies', { status: companiesRes.status });
    return [];
  }

  const companies = await companiesRes.json() as Array<{ id: number; name: string }>;

  const allProjects: ProcoreProject[] = [];

  for (const company of companies) {
    const projectsRes = await fetch(
      `${PROCORE_API}/projects?company_id=${company.id}&view=normal&per_page=100`,
      { headers: { Authorization: `Bearer ${accessToken}` } },
    );

    if (!projectsRes.ok) continue;

    const projects = await projectsRes.json() as ProcoreProject[];
    // Only Active projects
    const active = projects.filter(p => p.status === 'Active');
    allProjects.push(...active);
  }

  return allProjects;
}

// ─── Get RFIs for a project ───────────────────────────────
export async function getProjectRFIs(
  accessToken: string,
  companyId: number,
  projectId: number,
): Promise<ProcoreRFI[]> {
  const url = `${PROCORE_API}/projects/${projectId}/rfis?company_id=${companyId}&status[]=open&per_page=200`;
  const res = await fetch(url, {
    headers: { Authorization: `Bearer ${accessToken}` },
  });
  if (!res.ok) {
    logger.warn('Could not fetch Procore RFIs', { projectId, status: res.status });
    return [];
  }
  return res.json() as Promise<ProcoreRFI[]>;
}

// ─── Get Submittals for a project ────────────────────────
export async function getProjectSubmittals(
  accessToken: string,
  companyId: number,
  projectId: number,
): Promise<ProcoreSubmittal[]> {
  const url = `${PROCORE_API}/projects/${projectId}/submittals?company_id=${companyId}&per_page=200`;
  const res = await fetch(url, {
    headers: { Authorization: `Bearer ${accessToken}` },
  });
  if (!res.ok) {
    logger.warn('Could not fetch Procore Submittals', { projectId, status: res.status });
    return [];
  }
  return res.json() as Promise<ProcoreSubmittal[]>;
}

// ─── Refresh Procore access token ─────────────────────────
export async function refreshProcoreToken(refreshToken: string): Promise<{
  access_token: string;
  refresh_token: string;
  expires_in: number;
}> {
  const res = await fetch('https://login.procore.com/oauth/token', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      grant_type: 'refresh_token',
      client_id: config.PROCORE_CLIENT_ID,
      client_secret: config.PROCORE_CLIENT_SECRET,
      refresh_token: refreshToken,
    }),
  });
  const data = await res.json() as any;
  if (data.error) throw new Error(`Procore token refresh failed: ${data.error}`);
  return data;
}

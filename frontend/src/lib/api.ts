// ─── JAXI Intelligence — Centralized API Client ──────────
// Handles JWT injection, error parsing, and demo-mode fallback

const BASE = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:3001/api/v1';

function getToken(): string | null {
  if (typeof window === 'undefined') return null;
  return localStorage.getItem('jaxi_token');
}

interface FetchOptions extends RequestInit {
  skipAuth?: boolean;
}

async function apiFetch<T>(path: string, options: FetchOptions = {}): Promise<T> {
  const { skipAuth, ...init } = options;
  const token = getToken();

  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(init.headers as Record<string, string>),
  };

  if (token && !skipAuth) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  const res = await fetch(`${BASE}${path}`, { ...init, headers });

  if (!res.ok) {
    let message = `API error ${res.status}`;
    try {
      const body = await res.json();
      message = body.message ?? body.error ?? message;
    } catch {}
    throw new ApiError(res.status, message);
  }

  return res.json() as Promise<T>;
}

export class ApiError extends Error {
  constructor(public status: number, message: string) {
    super(message);
    this.name = 'ApiError';
  }
}

// ─── Auth ─────────────────────────────────────────────────
export const auth = {
  me: () => apiFetch<AuthMeResponse>('/auth/me'),
  refresh: (refreshToken: string) =>
    apiFetch<{ accessToken: string; refreshToken: string }>('/auth/refresh', {
      method: 'POST',
      body: JSON.stringify({ refreshToken }),
    }),
};

// ─── Projects ─────────────────────────────────────────────
export const projects = {
  list:   () => apiFetch<Project[]>('/projects'),
  getOne: (id: string) => apiFetch<ProjectDetail>(`/projects/${id}`),
  kpis:   (id: string) => apiFetch<ProjectKPIs>(`/projects/${id}/kpis`),
};

// ─── RFIs ─────────────────────────────────────────────────
export const rfis = {
  list: (projectId: string, params?: RFIQueryParams) => {
    const qs = new URLSearchParams(params as any).toString();
    return apiFetch<RFIListResponse>(`/rfis?projectId=${projectId}${qs ? `&${qs}` : ''}`);
  },
  getOne: (rfiId: string) => apiFetch<RFIDetail>(`/rfis/${rfiId}`),
};

// ─── Submittals ───────────────────────────────────────────
export const submittals = {
  list: (projectId: string) => apiFetch<SubmittalListResponse>(`/submittals?projectId=${projectId}`),
};

// ─── Intelligence (Cross-Analysis) ───────────────────────
export const intelligence = {
  gaps:     (projectId: string) => apiFetch<Gap[]>(`/intelligence/gaps?projectId=${projectId}`),
  followup: (projectId: string) => apiFetch<FollowUp[]>(`/intelligence/followup?projectId=${projectId}`),
  chat:     (message: string, projectId: string) =>
    apiFetch<{ reply: string }>('/intelligence/chat', {
      method: 'POST',
      body: JSON.stringify({ message, projectId }),
    }),
};

// ─── Types ────────────────────────────────────────────────
export interface AuthMeResponse {
  user: {
    id: string; email: string; name: string; role: string;
    avatarUrl: string | null; microsoftId: string | null; procoreId: string | null;
  };
  integrations: {
    microsoft: { provider: string; expiresAt: string } | null;
    procore:   { provider: string; expiresAt: string } | null;
  };
  projects: Project[];
}

export interface Project {
  id: string; name: string; code: string; status: string;
  procoreId: string | null; description: string | null;
  stage?: string; type?: string; pm?: string;
  _count?: { rfis: number; submittals: number };
}

export interface ProjectDetail extends Project {
  members: { user: { id: string; name: string; role: string } }[];
}

export interface ProjectKPIs {
  openRFIs: number;
  overdueRFIs: number;
  inYourCourt: number;
  next7Days: number;
  openSubmittals: number;
  pendingReview: number;
  gaps: number;
  brokenCommitments: number;
  lastSyncAt: string;
}

export interface RFI {
  id: string;
  number: string;
  title: string;
  status: 'OPEN' | 'CLOSED' | 'DRAFT' | 'VOID';
  priority: 'CRITICAL' | 'HIGH' | 'MEDIUM' | 'LOW';
  dueDate: string | null;
  daysOverdue: number;
  discipline: string | null;
  assignedTo: { id: string; name: string } | null;
  ballInCourt: { id: string; name: string }[];
  source: 'PROCORE' | 'MANUAL';
  procoreId: string | null;
  hasOutlookThread: boolean;
  outlookThreadCount: number;
  riskScore: number;
}

export interface RFIDetail extends RFI {
  description: string | null;
  outlookEmails: {
    subject: string; from: string;
    receivedAt: string; bodyPreview: string;
  }[];
}

export interface RFIListResponse {
  rfis: RFI[];
  total: number;
  overdueCount: number;
  inYourCourtCount: number;
  next7DaysCount: number;
}

export interface RFIQueryParams {
  status?: string;
  priority?: string;
  overdue?: 'true';
  page?: string;
  limit?: string;
}

export interface Submittal {
  id: string; number: string; title: string;
  status: string; dueDate: string | null;
  daysOverdue: number;
  manager: { id: string; name: string } | null;
  specSection: string | null;
  riskScore: number;
  procoreId: string | null;
}

export interface SubmittalListResponse {
  submittals: Submittal[];
  total: number;
  overdueCount: number;
  pendingReviewCount: number;
}

export interface Gap {
  id: string; type: string; severity: 'CRITICAL' | 'HIGH' | 'MEDIUM' | 'LOW';
  title: string; description: string;
  relatedRFI: string | null; relatedSubmittal: string | null;
  outlookEvidence: string | null; detectedAt: string;
}

export interface FollowUp {
  id: string; entityType: 'RFI' | 'SUBMITTAL';
  entityNumber: string; title: string;
  urgency: 'critical' | 'high' | 'medium' | 'low';
  lastEmailDate: string | null;
  silenceDays: number;
}

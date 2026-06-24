'use client';

import { useState, useEffect, useCallback } from 'react';

const API_BASE = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:3001/api/v1';

// ─── Generic fetch hook ───────────────────────────────────
export function useApiData<T>(
  endpoint: string,
  fallback: T,
  deps: unknown[] = []
): { data: T; loading: boolean; error: string | null; isDemo: boolean; refresh: () => void } {
  const [data, setData]       = useState<T>(fallback);
  const [loading, setLoading] = useState(true);
  const [error, setError]     = useState<string | null>(null);
  const [isDemo, setIsDemo]   = useState(false);
  const [tick, setTick]       = useState(0);

  const refresh = useCallback(() => setTick(t => t + 1), []);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setError(null);

    fetch(`${API_BASE}${endpoint}`)
      .then(r => r.json())
      .then((json: { source?: string } & T) => {
        if (cancelled) return;
        setIsDemo(json.source === 'demo');
        setData(json as T);
        setLoading(false);
      })
      .catch(err => {
        if (cancelled) return;
        setError(err.message);
        setData(fallback);
        setIsDemo(true);
        setLoading(false);
      });

    return () => { cancelled = true; };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [endpoint, tick, ...deps]);

  return { data, loading, error, isDemo, refresh };
}

// ─── Dashboard summary ────────────────────────────────────
export interface DashSummary {
  source: 'live' | 'demo';
  rfis: { total: number; overdue: number; inYourCourt?: number; dueSoon?: number };
  submittals: { total: number; open?: number; overdue: number; dueSoon?: number; providers?: number };
  emails: { total: number; withCommitment: number };
  lastSync: string | null;
}

export function useDashSummary(projectId: string) {
  return useApiData<DashSummary>(
    `/data/summary?projectId=${projectId}`,
    {
      source: 'demo',
      rfis:       { total: 18, overdue: 17, inYourCourt: 5, dueSoon: 1 },
      submittals: { total: 227, open: 21, overdue: 8, dueSoon: 10, providers: 24 },
      emails:     { total: 0, withCommitment: 0 },
      lastSync:   null,
    },
    [projectId]
  );
}

// ─── RFIs list ────────────────────────────────────────────
export interface RFIItem {
  id: string;
  number: string;
  procoreNum: number;
  title: string;
  status: string;
  priority: string;
  daysOverdue: number;
  dueDate: string | null;
  ballInCourt: string | null;
  ballInCourtCompany?: string;
  riskScore: number;
  emailThreads: unknown[];
}

export interface RFIsResponse {
  source: 'live' | 'demo';
  rfis: RFIItem[];
}

export function useRFIs(projectId: string) {
  return useApiData<RFIsResponse>(
    `/data/rfis?projectId=${projectId}`,
    {
      source: 'demo',
      rfis: [],
    },
    [projectId]
  );
}

// ─── Submittals list ──────────────────────────────────────
export interface SubmittalItem {
  id: string;
  number: string;
  procoreNum: string;
  title: string;
  status: string;
  priority?: string;
  daysOverdue: number;
  dueDate: string | null;
  contractor: string | null;
  ballInCourt: string | null;
  specSection: string | null;
  riskScore: number;
  emailThreads: unknown[];
}

export interface SubmittalsResponse {
  source: 'live' | 'demo';
  submittals: SubmittalItem[];
}

export function useSubmittals(projectId: string) {
  return useApiData<SubmittalsResponse>(
    `/data/submittals?projectId=${projectId}`,
    {
      source: 'demo',
      submittals: [],
    },
    [projectId]
  );
}

// ─── Projects list ────────────────────────────────────────
export interface ProjectItem {
  id: string;
  name: string;
  code: string;
  procoreId: string | null;
  status: string;
  city?: string;
  state?: string;
  rfiCount: number;
  subCount: number;
}

export interface ProjectsResponse {
  source: 'live' | 'demo';
  projects: ProjectItem[];
}

export function useProjects() {
  return useApiData<ProjectsResponse>(
    '/data/projects',
    { source: 'demo', projects: [] }
  );
}

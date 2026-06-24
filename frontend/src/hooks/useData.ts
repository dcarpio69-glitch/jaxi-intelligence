'use client';
import { useState, useEffect, useCallback } from 'react';
import { submittals as subsApi, type Submittal, type SubmittalListResponse, ApiError } from '@/lib/api';
import { intelligence as aiApi, type Gap, type FollowUp } from '@/lib/api';

// ─── Demo Submittal data ──────────────────────────────────
const DEMO_SUBMITTALS: Submittal[] = [
  { id:'s15', number:'SUB-015', title:'Facade Panel — Material Sample',           status:'PENDING', dueDate:null, daysOverdue:21, manager:{id:'u5',name:'Eduardo Martinez (JAXI)'}, specSection:'07 40 00', riskScore:85, procoreId:'15' },
  { id:'s22', number:'SUB-022', title:'HVAC System — Equipment Shop Drawings',    status:'PENDING', dueDate:null, daysOverdue:12, manager:{id:'u3',name:'Oscar Hernandez (JAXI)'},  specSection:'23 00 00', riskScore:78, procoreId:'22' },
  { id:'s31', number:'SUB-031', title:'Concrete Mix Design — High Strength',      status:'REVIEW',  dueDate:null, daysOverdue:8,  manager:{id:'u6',name:'Owner Architect'},           specSection:'03 00 00', riskScore:70, procoreId:'31' },
  { id:'s44', number:'SUB-044', title:'Elevator Cab Interior Finishes',           status:'PENDING', dueDate:null, daysOverdue:5,  manager:{id:'u1',name:'Ingrid Melendez (Owner)'},  specSection:'14 20 00', riskScore:62, procoreId:'44' },
  { id:'s48', number:'SUB-048', title:'Fire Suppression Sprinkler Layout',        status:'PENDING', dueDate:null, daysOverdue:3,  manager:{id:'u3',name:'Oscar Hernandez (JAXI)'},  specSection:'21 00 00', riskScore:55, procoreId:'48' },
  { id:'s51', number:'SUB-051', title:'Roofing Membrane Specification Sheet',     status:'REVIEW',  dueDate:null, daysOverdue:1,  manager:{id:'u2',name:'Luis Ricardo (JAXI)'},      specSection:'07 50 00', riskScore:40, procoreId:'51' },
  { id:'s55', number:'SUB-055', title:'Structural Steel Connection Details',      status:'REVIEW',  dueDate:null, daysOverdue:1,  manager:{id:'u6',name:'Owner Architect'},           specSection:'05 12 00', riskScore:38, procoreId:'55' },
  { id:'s60', number:'SUB-060', title:'Plumbing Fixtures Schedule',               status:'PENDING', dueDate:null, daysOverdue:2,  manager:{id:'u4',name:'Ana Perez (JAXI)'},         specSection:'22 00 00', riskScore:35, procoreId:'60' },
];

const DEMO_SUB_RESPONSE: SubmittalListResponse = {
  submittals: DEMO_SUBMITTALS, total: 12, overdueCount: 8, pendingReviewCount: 8,
};

// ─── Demo Gap/Follow-up data ──────────────────────────────
const DEMO_GAPS: Gap[] = [
  { id:'g1', type:'BROKEN_COMMITMENT', severity:'CRITICAL', title:'"Te mando el plano el viernes" — sin respuesta (3 días)',   description:'Email de Luis Ricardo prometía plano el viernes. RFI 88 sigue sin respuesta en Procore.',   relatedRFI:'r88',  relatedSubmittal:null, outlookEvidence:'Subject: RFI 88 - Duct conflict', detectedAt: new Date().toISOString() },
  { id:'g2', type:'BROKEN_COMMITMENT', severity:'CRITICAL', title:'Eduardo prometió material sample — no enviado',              description:'Email de Eduardo el Lunes confirma envío de SUB-015. 5 días después nada en Procore.',      relatedRFI:null,   relatedSubmittal:'s15', outlookEvidence:'Subject: Re: Facade Panel Material', detectedAt: new Date().toISOString() },
  { id:'g3', type:'DANGEROUS_SILENCE', severity:'HIGH',     title:'RFI 142 — Oscar espera estructural hace 5 días sin email',  description:'RFI abierto, vencido 18 días. Búsqueda en Outlook: 0 emails en los últimos 5 días.',          relatedRFI:'r142', relatedSubmittal:null, outlookEvidence:null,                             detectedAt: new Date().toISOString() },
  { id:'g4', type:'APPROVAL_CONFLICT', severity:'HIGH',     title:'AT&T equipment room — aprobación pendiente del Owner',      description:'RFI 147 aprobado por JAXI en Procore pero Owner no confirma en email. Conflicto detectado.', relatedRFI:'r147', relatedSubmittal:null, outlookEvidence:'Subject: RFI 147 - AT&T Room',   detectedAt: new Date().toISOString() },
];

const DEMO_FOLLOWUPS: FollowUp[] = [
  { id:'f1', entityType:'RFI',       entityNumber:'RFI 88',  title:'"Te mando el plano el viernes" — sin respuesta (3 días)',       urgency:'critical', lastEmailDate:null, silenceDays:3 },
  { id:'f2', entityType:'SUBMITTAL', entityNumber:'SUB-015', title:'Eduardo prometió material sample — no enviado',                   urgency:'critical', lastEmailDate:null, silenceDays:5 },
  { id:'f3', entityType:'RFI',       entityNumber:'RFI 142', title:'Oscar esperando respuesta del estructural — 5 días sin email',    urgency:'high',     lastEmailDate:null, silenceDays:5 },
  { id:'f4', entityType:'RFI',       entityNumber:'RFI 147', title:'AT&T equipment room — aprobación pendiente del Owner',            urgency:'high',     lastEmailDate:null, silenceDays:3 },
  { id:'f5', entityType:'SUBMITTAL', entityNumber:'SUB-022', title:'Shop drawings HVAC — arquitecto acusó recibo pero no respondió',  urgency:'medium',   lastEmailDate:null, silenceDays:2 },
];

// ─── useSubmittals ────────────────────────────────────────
export function useSubmittals(projectId: string | null) {
  const [data,    setData]    = useState<SubmittalListResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error,   setError]   = useState<string | null>(null);
  const [isDemo,  setIsDemo]  = useState(false);
  const [tick,    setTick]    = useState(0);
  const refetch = useCallback(() => setTick(t => t + 1), []);

  useEffect(() => {
    if (!projectId) { setData(DEMO_SUB_RESPONSE); setIsDemo(true); setLoading(false); return; }
    let cancelled = false;
    setLoading(true);
    subsApi.list(projectId)
      .then(res  => { if (!cancelled) { setData(res); setIsDemo(false); } })
      .catch(err => {
        if (!cancelled) {
          console.warn('Submittals API unavailable, using demo data', err.message);
          setData(DEMO_SUB_RESPONSE); setIsDemo(true);
        }
      })
      .finally(() => { if (!cancelled) setLoading(false); });
    return () => { cancelled = true; };
  }, [projectId, tick]);

  return { data, loading, error, isDemo, refetch };
}

// ─── useGaps (Cross-Analysis Engine) ─────────────────────
export function useGaps(projectId: string | null) {
  const [gaps,     setGaps]     = useState<Gap[]>(DEMO_GAPS);
  const [followups,setFollowups]= useState<FollowUp[]>(DEMO_FOLLOWUPS);
  const [loading,  setLoading]  = useState(false);
  const [isDemo,   setIsDemo]   = useState(true);

  useEffect(() => {
    if (!projectId) { setIsDemo(true); return; }
    setLoading(true);
    Promise.all([
      aiApi.gaps(projectId).catch(() => DEMO_GAPS),
      aiApi.followup(projectId).catch(() => DEMO_FOLLOWUPS),
    ]).then(([g, f]) => {
      setGaps(g); setFollowups(f);
      setIsDemo(g === DEMO_GAPS);
    }).finally(() => setLoading(false));
  }, [projectId]);

  return { gaps, followups, loading, isDemo };
}

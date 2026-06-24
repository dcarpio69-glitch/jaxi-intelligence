'use client';
import { useState, useEffect, useCallback } from 'react';
import { rfis as rfisApi, type RFI, type RFIListResponse, type RFIQueryParams, ApiError } from '@/lib/api';

// ─── Demo fallback data ───────────────────────────────────
const DEMO_RFIS: RFI[] = [
  { id:'r78',  number:'RFI 78',  title:'Extremely Limited Space for Exterior Finishes & Humidity Concerns', status:'OPEN', priority:'CRITICAL', dueDate:null, daysOverdue:119, discipline:'Architecture', assignedTo:{id:'u1',name:'Ingrid Melendez (Owner)'},  ballInCourt:[{id:'u1',name:'Ingrid Melendez'}], source:'PROCORE', procoreId:'78',  hasOutlookThread:true,  outlookThreadCount:4, riskScore:98 },
  { id:'r88',  number:'RFI 88',  title:'Level 3 RCP vs. Mechanical Duct Conflicts',               status:'OPEN', priority:'CRITICAL', dueDate:null, daysOverdue:98,  discipline:'MEP',          assignedTo:{id:'u2',name:'Luis Ricardo (JAXI)'},      ballInCourt:[{id:'u2',name:'Luis Ricardo'}],    source:'PROCORE', procoreId:'88',  hasOutlookThread:true,  outlookThreadCount:7, riskScore:95 },
  { id:'r142', number:'RFI 142', title:'Pipe diameter vs wall thickness, N3-10',                  status:'OPEN', priority:'HIGH',     dueDate:null, daysOverdue:18,  discipline:'Plumbing',     assignedTo:{id:'u3',name:'Oscar Hernandez (JAXI)'},  ballInCourt:[{id:'u3',name:'Oscar Hernandez'}], source:'PROCORE', procoreId:'142', hasOutlookThread:false, outlookThreadCount:0, riskScore:72 },
  { id:'r147', number:'RFI 147', title:'Proposed location for AT&T equipment room',               status:'OPEN', priority:'HIGH',     dueDate:null, daysOverdue:13,  discipline:'Telecom',      assignedTo:{id:'u3',name:'Oscar Hernandez (JAXI)'},  ballInCourt:[{id:'u3',name:'Oscar Hernandez'}], source:'PROCORE', procoreId:'147', hasOutlookThread:true,  outlookThreadCount:2, riskScore:68 },
  { id:'r154', number:'RFI 154', title:'Conflict, Level 3 common-area entry doors',               status:'OPEN', priority:'HIGH',     dueDate:null, daysOverdue:9,   discipline:'Architecture', assignedTo:{id:'u3',name:'Oscar Hernandez (JAXI)'},  ballInCourt:[{id:'u3',name:'Oscar Hernandez'}], source:'PROCORE', procoreId:'154', hasOutlookThread:false, outlookThreadCount:0, riskScore:61 },
  { id:'r158', number:'RFI 158', title:'Portable Generator Connection location (Dock Station)',    status:'OPEN', priority:'MEDIUM',   dueDate:null, daysOverdue:4,   discipline:'Electrical',   assignedTo:{id:'u3',name:'Oscar Hernandez (JAXI)'},  ballInCourt:[{id:'u3',name:'Oscar Hernandez'}], source:'PROCORE', procoreId:'158', hasOutlookThread:false, outlookThreadCount:0, riskScore:45 },
  { id:'r101', number:'RFI 101', title:'Structural steel connection detail — Column C4',           status:'OPEN', priority:'CRITICAL', dueDate:null, daysOverdue:45,  discipline:'Structural',   assignedTo:{id:'u1',name:'Owner Rep'},               ballInCourt:[{id:'u1',name:'Owner Rep'}],       source:'PROCORE', procoreId:'101', hasOutlookThread:true,  outlookThreadCount:3, riskScore:88 },
  { id:'r112', number:'RFI 112', title:'Window system mockup approval',                            status:'OPEN', priority:'HIGH',     dueDate:null, daysOverdue:22,  discipline:'Architecture', assignedTo:{id:'u1',name:'Owner Rep'},               ballInCourt:[{id:'u1',name:'Owner Rep'}],       source:'PROCORE', procoreId:'112', hasOutlookThread:true,  outlookThreadCount:5, riskScore:79 },
  { id:'r160', number:'RFI 160', title:'Elevator pit waterproofing specification',                  status:'OPEN', priority:'MEDIUM',   dueDate:null, daysOverdue:2,   discipline:'Civil',        assignedTo:{id:'u2',name:'Luis Ricardo (JAXI)'},     ballInCourt:[{id:'u2',name:'Luis Ricardo'}],    source:'PROCORE', procoreId:'160', hasOutlookThread:false, outlookThreadCount:0, riskScore:38 },
  { id:'r161', number:'RFI 161', title:'Parking garage ventilation layout',                        status:'OPEN', priority:'MEDIUM',   dueDate:null, daysOverdue:5,   discipline:'MEP',          assignedTo:{id:'u4',name:'Ana Perez (JAXI)'},        ballInCourt:[{id:'u4',name:'Ana Perez'}],       source:'PROCORE', procoreId:'161', hasOutlookThread:false, outlookThreadCount:0, riskScore:42 },
  { id:'r162', number:'RFI 162', title:'Exterior lighting photometric plan',                       status:'OPEN', priority:'LOW',      dueDate:null, daysOverdue:7,   discipline:'Electrical',   assignedTo:{id:'u2',name:'Luis Ricardo (JAXI)'},     ballInCourt:[{id:'u2',name:'Luis Ricardo'}],    source:'PROCORE', procoreId:'162', hasOutlookThread:false, outlookThreadCount:0, riskScore:30 },
];

const DEMO_RESPONSE: RFIListResponse = {
  rfis: DEMO_RFIS,
  total: 18,
  overdueCount: 17,
  inYourCourtCount: 5,
  next7DaysCount: 1,
};

interface UseRFIsResult {
  data: RFIListResponse | null;
  loading: boolean;
  error: string | null;
  isDemo: boolean;
  refetch: () => void;
  // Computed helpers
  critical:       RFI[];
  myCourtOverdue: RFI[];
  ownerCourt:     RFI[];
  allOpen:        RFI[];
}

export function useRFIs(projectId: string | null, params?: RFIQueryParams): UseRFIsResult {
  const [data,    setData]    = useState<RFIListResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error,   setError]   = useState<string | null>(null);
  const [isDemo,  setIsDemo]  = useState(false);
  const [tick,    setTick]    = useState(0);

  const refetch = useCallback(() => setTick(t => t + 1), []);

  useEffect(() => {
    if (!projectId) {
      setData(DEMO_RESPONSE);
      setIsDemo(true);
      setLoading(false);
      return;
    }

    let cancelled = false;
    setLoading(true);
    setError(null);

    rfisApi.list(projectId, params)
      .then(res => {
        if (!cancelled) { setData(res); setIsDemo(false); }
      })
      .catch(err => {
        if (!cancelled) {
          // Fall back to demo data if API unreachable
          if (err instanceof ApiError && err.status === 401) {
            setError('Session expired — please log in again.');
          } else {
            console.warn('RFI API unavailable, using demo data', err.message);
            setData(DEMO_RESPONSE);
            setIsDemo(true);
          }
        }
      })
      .finally(() => { if (!cancelled) setLoading(false); });

    return () => { cancelled = true; };
  }, [projectId, tick, JSON.stringify(params)]);

  // Derived lists
  const rfis          = data?.rfis ?? [];
  const myName        = 'JAXI'; // will be replaced with auth user name in Sprint 7
  const critical       = rfis.filter(r => r.priority === 'CRITICAL' && r.daysOverdue > 0).sort((a,b) => b.daysOverdue - a.daysOverdue).slice(0,1);
  const myCourtOverdue = rfis.filter(r => r.daysOverdue > 0 && r.ballInCourt.some(b => b.name.includes(myName)));
  const ownerCourt     = rfis.filter(r => r.daysOverdue > 0 && r.ballInCourt.some(b => !b.name.includes(myName)));
  const allOpen        = rfis.filter(r => r.status === 'OPEN' && r.daysOverdue <= 0);

  return { data, loading, error, isDemo, refetch, critical, myCourtOverdue, ownerCourt, allOpen };
}

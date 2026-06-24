/**
 * JAXI Intelligence — Dashboard Data API
 * Returns RFIs, Submittals, projects, and summary from SQLite.
 * Falls back to demo data if database has no records yet.
 */

import { Router, Request, Response } from 'express';
import { getRFIs, getSubmittals, getProjects, getEmailsForRFI, getEmailsForSubmittal, getDb } from '../utils/db';
import { runIntelligenceAnalysis } from '../services/intelligenceAnalyzer';

const router = Router();

// ── GET /api/v1/data/intelligence?projectId=xxx ──────────
router.get('/intelligence', (req: Request, res: Response) => {
  const { projectId } = req.query;
  try {
    const alerts = runIntelligenceAnalysis(projectId as string | undefined);

    if (alerts.length === 0) {
      // No live data yet — return demo alerts so the UI is never empty
      return res.json({ source: 'demo', alerts: getDemoAlerts() });
    }

    res.json({ source: 'live', alerts, generatedAt: new Date().toISOString() });
  } catch (err: any) {
    console.error('[Intelligence] Analysis error:', err.message);
    res.json({ source: 'demo', alerts: getDemoAlerts() });
  }
});

// ── GET /api/v1/data/rfis?projectId=xxx ──────────────────
router.get('/rfis', (req: Request, res: Response) => {
  const { projectId } = req.query;
  try {
    const rfis = getRFIs(projectId as string | undefined);

    if (rfis.length === 0) {
      return res.json({ source: 'demo', rfis: getDemoRFIs() });
    }

    const today = Date.now();
    const enriched = rfis.map((rfi: any) => ({
      ...rfi,
      daysOverdue: rfi.dueDate
        ? Math.max(0, Math.floor((today - new Date(rfi.dueDate).getTime()) / 86400000))
        : 0,
      emailThreads: getEmailsForRFI(rfi.id),
    }));

    res.json({ source: 'live', rfis: enriched });
  } catch (err: any) {
    console.error('[Data] RFIs error:', err.message);
    res.json({ source: 'demo', rfis: getDemoRFIs() });
  }
});

// ── GET /api/v1/data/submittals?projectId=xxx ────────────
router.get('/submittals', (req: Request, res: Response) => {
  const { projectId } = req.query;
  try {
    const submittals = getSubmittals(projectId as string | undefined);

    if (submittals.length === 0) {
      return res.json({ source: 'demo', submittals: getDemoSubmittals() });
    }

    const today = Date.now();
    const enriched = submittals.map((s: any) => ({
      ...s,
      daysOverdue: s.dueDate
        ? Math.max(0, Math.floor((today - new Date(s.dueDate).getTime()) / 86400000))
        : 0,
      emailThreads: getEmailsForSubmittal(s.id),
    }));

    res.json({ source: 'live', submittals: enriched });
  } catch (err: any) {
    console.error('[Data] Submittals error:', err.message);
    res.json({ source: 'demo', submittals: getDemoSubmittals() });
  }
});

// ── GET /api/v1/data/projects ─────────────────────────────
router.get('/projects', (_req: Request, res: Response) => {
  try {
    const projects = getProjects();
    if (projects.length === 0) {
      return res.json({ source: 'demo', projects: getDemoProjects() });
    }
    res.json({ source: 'live', projects });
  } catch (err: any) {
    res.json({ source: 'demo', projects: getDemoProjects() });
  }
});

// ── GET /api/v1/data/summary?projectId=xxx ───────────────
router.get('/summary', (req: Request, res: Response) => {
  const { projectId } = req.query;
  try {
    const db = getDb();
    const projWhere = projectId ? 'AND projectId = ?' : '';
    const args = projectId ? [projectId] : [];

    const totalRFIs  = (db.prepare(`SELECT COUNT(*) as n FROM rfis WHERE status NOT IN ('CLOSED','ANSWERED') ${projWhere}`).get(...args) as any).n;
    const overdueRFIs = (db.prepare(`SELECT COUNT(*) as n FROM rfis WHERE status='OVERDUE' ${projWhere}`).get(...args) as any).n;
    const totalSubs  = (db.prepare(`SELECT COUNT(*) as n FROM submittals WHERE status != 'APPROVED' ${projWhere}`).get(...args) as any).n;
    const overdueSubs = (db.prepare(`SELECT COUNT(*) as n FROM submittals WHERE status='OVERDUE' ${projWhere}`).get(...args) as any).n;

    if (totalRFIs === 0 && totalSubs === 0) {
      return res.json({
        source: 'demo',
        rfis:       { total: 18, overdue: 17, inYourCourt: 5, dueSoon: 1 },
        submittals: { total: 227, open: 21, overdue: 8, dueSoon: 10, providers: 24 },
        emails:     { total: 0, withCommitment: 0 },
        lastSync:   null,
      });
    }

    res.json({
      source: 'live',
      rfis:       { total: totalRFIs, overdue: overdueRFIs },
      submittals: { total: totalSubs, overdue: overdueSubs },
      emails:     { total: 0, withCommitment: 0 },
      lastSync:   new Date().toISOString(),
    });
  } catch (err: any) {
    res.json({ source: 'demo', rfis: { total: 18, overdue: 17 }, submittals: { total: 227, overdue: 8 } });
  }
});

// ── Demo data fallback ────────────────────────────────────

function daysAgo(d: number): string {
  return new Date(Date.now() - d * 86400000).toISOString();
}

function getDemoRFIs() {
  return [
    { id:'demo-78',  number:'78',  procoreNum:78,  title:'Extremely Limited Space for Exterior Finishes & Humidity Concerns', status:'OPEN', priority:'CRITICAL', daysOverdue:119, dueDate:daysAgo(119), ballInCourt:'Ingrid Melendez',  ballInCourtCompany:'Owner', riskScore:95, emailThreads:[] },
    { id:'demo-88',  number:'88',  procoreNum:88,  title:'Level 3 RCP vs. Mechanical Duct Conflicts',                          status:'OPEN', priority:'HIGH',     daysOverdue:98,  dueDate:daysAgo(98),  ballInCourt:'Len Ricardo',       ballInCourtCompany:'JAXI',  riskScore:88, emailThreads:[] },
    { id:'demo-142', number:'142', procoreNum:142, title:'Pipe diameter vs wall thickness, N3–10',                               status:'OPEN', priority:'MEDIUM',   daysOverdue:18,  dueDate:daysAgo(18),  ballInCourt:'Oscar Hernandez',   ballInCourtCompany:'JAXI',  riskScore:62, emailThreads:[] },
    { id:'demo-147', number:'147', procoreNum:147, title:'Proposed location for AT&T equipment room',                            status:'OPEN', priority:'MEDIUM',   daysOverdue:13,  dueDate:daysAgo(13),  ballInCourt:'Oscar Hernandez',   ballInCourtCompany:'JAXI',  riskScore:55, emailThreads:[] },
    { id:'demo-154', number:'154', procoreNum:154, title:'Conflict, Level 3 common-area entry doors',                            status:'OPEN', priority:'MEDIUM',   daysOverdue:9,   dueDate:daysAgo(9),   ballInCourt:'Oscar Hernandez',   ballInCourtCompany:'JAXI',  riskScore:48, emailThreads:[] },
  ];
}

function getDemoSubmittals() {
  return [
    { id:'demo-s3',  number:'16-16000-3',  procoreNum:'16-16000-3',  title:'Lighting Fixtures, B.O.H.',              status:'DRAFT',     daysOverdue:183, dueDate:daysAgo(183), contractor:'Caymares Martin',  ballInCourt:null,              specSection:'16-16000 Electrical',                    riskScore:92, emailThreads:[] },
    { id:'demo-s4',  number:'13-13000-4',  procoreNum:'13-13000-4',  title:'Swimming Pool Finish Samples',           status:'SUBMITTED', daysOverdue:90,  dueDate:daysAgo(90),  contractor:'Aquarama Pools',   ballInCourt:'Ingrid Melendez', specSection:'13-13000 Swimming Pool',                 riskScore:80, emailThreads:[] },
    { id:'demo-s13', number:'16-16000-13', procoreNum:'16-16000-13', title:'Main Electrical Room FPL Vault Layout',  status:'SUBMITTED', daysOverdue:14,  dueDate:daysAgo(14),  contractor:'Caymares Martin',  ballInCourt:'Betty Rokovich',  specSection:'16-16000 Electrical',                    riskScore:65, emailThreads:[] },
    { id:'demo-s10', number:'16-16000-10', procoreNum:'16-16000-10', title:'Floor Boxes Specs',                      status:'SUBMITTED', daysOverdue:7,   dueDate:daysAgo(7),   contractor:'Caymares Martin',  ballInCourt:'Ingrid Melendez', specSection:'16-16000 Electrical',                    riskScore:55, emailThreads:[] },
    { id:'demo-s52', number:'05-05100-2',  procoreNum:'05-05100-2',  title:'Railing, Handrails & Guardrails',        status:'IN_REVIEW', daysOverdue:5,   dueDate:daysAgo(5),   contractor:'All Dade Fences',  ballInCourt:'Len Ricardo',     specSection:'05-05100 Structural & Misc. Metals',    riskScore:48, emailThreads:[] },
  ];
}

function getDemoProjects() {
  return [
    { id:'6008', name:'The Edge at Sunset',       code:'06008', procoreId:'6008', status:'ACTIVE', city:'South Miami',      state:'FL', rfiCount:18, subCount:227 },
    { id:'6000', name:'626 Flagler',               code:'06000', procoreId:'6000', status:'ACTIVE', city:'Fort Lauderdale',  state:'FL', rfiCount:0,  subCount:0   },
    { id:'5998', name:'Empire Brickell',           code:'05998', procoreId:'5998', status:'ACTIVE', city:'Miami',            state:'FL', rfiCount:0,  subCount:0   },
    { id:'5981', name:'CASSIA Condominium',        code:'05981', procoreId:'5981', status:'ACTIVE', city:'Coral Gables',     state:'FL', rfiCount:0,  subCount:0   },
    { id:'5992', name:'River North',               code:'05992', procoreId:'5992', status:'ACTIVE', city:'Miami',            state:'FL', rfiCount:0,  subCount:0   },
    { id:'6002', name:'Coral Grove (ENSO)',        code:'06002', procoreId:'6002', status:'ACTIVE', city:'Miami',            state:'FL', rfiCount:0,  subCount:0   },
    { id:'5999', name:'Urbania Nomi 125th Street', code:'05999', procoreId:'5999', status:'ACTIVE', city:'North Miami',      state:'FL', rfiCount:0,  subCount:0   },
    { id:'5996', name:'Airport Site',              code:'05996', procoreId:'5996', status:'ACTIVE', city:'Miami',            state:'FL', rfiCount:0,  subCount:0   },
    { id:'5935', name:'Alta 9600 Phase I',         code:'05935', procoreId:'5935', status:'ACTIVE', city:'Miami',            state:'FL', rfiCount:0,  subCount:0   },
    { id:'5957', name:'Southwest Hammocks',        code:'05957', procoreId:'5957', status:'ACTIVE', city:'Pembroke Pines',   state:'FL', rfiCount:0,  subCount:0   },
  ];
}

function getDemoAlerts() {
  const now = new Date();
  return [
    {
      id: 'demo-bc-001', type: 'BROKEN_COMMITMENT', severity: 'CRITICAL', riskScore: 94,
      itemType: 'RFI', itemNumber: 'RFI-078', itemTitle: 'Exterior Finishes & Humidity Concerns',
      projectId: '6008', projectName: 'The Edge at Sunset', procoreStatus: 'OPEN', daysOverdue: 4,
      headline: 'Ingrid se comprometió a responder sobre RFI-78 antes del fin de semana',
      evidence: 'Email recibido hace 2 días. Ingrid confirmó que revisaría el spec de barrera de humedad "por EOW". El RFI lleva 4 días vencido. Sin respuesta en Procore.',
      emailSubject: 'RE: RFI #78 – Exterior Finishes & Humidity Concerns', emailSender: 'Ingrid Melendez',
      commitmentText: 'We will confirm the revised moisture barrier spec by EOW.',
      emailReceivedAt: new Date(now.getTime() - 2*86400000).toISOString(),
      suggestedAction: 'Escalar a Ingrid Melendez — respuesta requerida hoy',
      draftEmailPrompt: 'Draft a firm follow-up to Ingrid about RFI-78. She committed to respond by EOW 4 days ago. Be professional but firm.',
    },
    {
      id: 'demo-pc-001', type: 'PLATFORM_CONFLICT', severity: 'HIGH', riskScore: 89,
      itemType: 'SUBMITTAL', itemNumber: 'SUB-008', itemTitle: 'Sistema HVAC',
      projectId: '6008', projectName: 'The Edge at Sunset', procoreStatus: 'APPROVED', daysOverdue: 0,
      headline: 'Procore dice APROBADO — el arquitecto tiene dudas en email',
      evidence: 'El submittal SUB-008 fue marcado como Approved en Procore el 19 jun. Ese mismo día, Betty Rokovich envió un email con objeciones sobre el material especificado.',
      emailSubject: 'Submittal 16-16000-3 – Lighting Fixtures B.O.H. – Return for Revision', emailSender: 'Betty Rokovich',
      commitmentText: null, emailReceivedAt: new Date(now.getTime() - 5*86400000).toISOString(),
      suggestedAction: 'Revisar discrepancia con Betty — ¿la aprobación de Procore es válida?',
      draftEmailPrompt: 'Draft a clarification email to Betty Rokovich about SUB-008 HVAC System. Procore shows Approved but her email raised material concerns.',
    },
    {
      id: 'demo-ds-001', type: 'DANGEROUS_SILENCE', severity: 'HIGH', riskScore: 75,
      itemType: 'RFI', itemNumber: 'RFI-142', itemTitle: 'Pipe Diameter vs Wall Thickness NI-10',
      projectId: '6008', projectName: 'The Edge at Sunset', procoreStatus: 'OPEN', daysOverdue: 18,
      headline: 'RFI-142: 5 días sin ningún email — nadie está dando seguimiento',
      evidence: 'El RFI lleva 18 días vencido. Oscar Hernandez está en cancha (JAXI). Revisión en Outlook de los últimos 7 días: cero emails con "RFI 142" o "pipe diameter". El item está siendo ignorado.',
      emailSubject: null, emailSender: 'Oscar Hernandez', commitmentText: null, emailReceivedAt: null,
      suggestedAction: 'Contactar a Oscar Hernandez — 18 días sin actividad en un RFI crítico',
      draftEmailPrompt: 'Draft an urgent escalation email about RFI-142 Pipe Diameter vs Wall Thickness. Oscar Hernandez has the ball in court and it has been 18 days overdue with zero email activity.',
    },
    {
      id: 'demo-bc-002', type: 'PENDING_COMMITMENT', severity: 'MEDIUM', riskScore: 71,
      itemType: 'SUBMITTAL', itemNumber: 'SUB-016', itemTitle: 'Exterior Finishes & Humidity Concerns',
      projectId: '6008', projectName: 'The Edge at Sunset', procoreStatus: 'IN_REVIEW', daysOverdue: 2,
      headline: 'Ingrid se comprometió a responder sobre RFI-78 antes del fin de semana',
      evidence: 'Email recibido hace 2 días. Ingrid confirmó que revisaría el spec por EOW. El RFI lleva 119 días vencido. Si no responde, habrá que escalar el lunes.',
      emailSubject: 'RE: RFI #78 – Exterior Finishes', emailSender: 'Ingrid Melendez',
      commitmentText: 'Will review the humidity spec and respond by end of week.', emailReceivedAt: new Date(now.getTime() - 2*86400000).toISOString(),
      suggestedAction: 'Monitorear — si no responde el lunes, escalar al supervisor',
      draftEmailPrompt: 'Draft a gentle reminder to Ingrid about her commitment to review SUB-016. Due date is approaching.',
    },
  ];
}

export default router;

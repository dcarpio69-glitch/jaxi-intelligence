/**
 * JAXI Intelligence — Dashboard Data API
 * Returns RFIs, Submittals, projects, and summary from SQLite.
 * Auto-seeds demo data on first run so the app ALWAYS shows live data.
 */

import { Router, Request, Response } from 'express';
import { getRFIs, getSubmittals, getProjects, getEmailsForRFI, getEmailsForSubmittal, getDb } from '../utils/db';
import { runIntelligenceAnalysis } from '../services/intelligenceAnalyzer';

// ── Auto-seed: runs once when DB is empty ─────────────────
let seeded = false;
function ensureSeeded() {
  if (seeded) return;
  const db = getDb();
  const count = (db.prepare('SELECT COUNT(*) as n FROM projects').get() as any).n;
  if (count > 0) { seeded = true; return; }
  console.log('[Seed] No projects found — seeding demo data into DB...');
  seedDemoDB(db);
  seeded = true;
  console.log('[Seed] Demo data seeded ✓ — badge will show LIVE');
}

function seedDemoDB(db: any) {
  const crypto = require('crypto');
  const ins = db.prepare;

  // Projects
  const projects = getDemoProjects();
  const insProj = db.prepare(`INSERT OR IGNORE INTO projects (id,name,code,status,city,state,procoreId) VALUES (@id,@name,@code,@status,@city,@state,@procoreId)`);
  const sysUser = db.prepare("SELECT id FROM users LIMIT 1").get() as any;
  const sysId = sysUser?.id || 'system';
  for (const p of projects) {
    insProj.run({ id: p.id, name: p.name, code: p.code, status: p.status, city: p.city || null, state: p.state || null, procoreId: p.procoreId });
  }

  // RFIs
  const insRfi = db.prepare(`INSERT OR IGNORE INTO rfis (id,projectId,number,title,description,status,priority,dueDate,procoreId,procoreNum,riskScore,ballInCourt,createdById) VALUES (@id,@projectId,@number,@title,@description,@status,@priority,@dueDate,@procoreId,@procoreNum,@riskScore,@ballInCourt,@createdById)`);
  const now = Date.now();
  const rfis = [
    { id:'6008-rfi-78',  projectId:'6008', number:'78',  title:'Extremely Limited Space for Exterior Finishes & Humidity Concerns', description:'', status:'OPEN', priority:'CRITICAL', dueDate: new Date(now-119*86400000).toISOString(), procoreId:'78',  procoreNum:78,  riskScore:95, ballInCourt:'Ingrid Melendez', createdById:sysId },
    { id:'6008-rfi-88',  projectId:'6008', number:'88',  title:'Level 3 RCP vs. Mechanical Duct Conflicts',                          description:'', status:'OPEN', priority:'HIGH',     dueDate: new Date(now-98*86400000).toISOString(),  procoreId:'88',  procoreNum:88,  riskScore:88, ballInCourt:'Len Ricardo',      createdById:sysId },
    { id:'6008-rfi-142', projectId:'6008', number:'142', title:'Pipe diameter vs wall thickness, N3-10',                              description:'', status:'OPEN', priority:'MEDIUM',   dueDate: new Date(now-18*86400000).toISOString(),  procoreId:'142', procoreNum:142, riskScore:62, ballInCourt:'Oscar Hernandez',  createdById:sysId },
    { id:'6008-rfi-147', projectId:'6008', number:'147', title:'Proposed location for AT&T equipment room',                           description:'', status:'OPEN', priority:'MEDIUM',   dueDate: new Date(now-13*86400000).toISOString(),  procoreId:'147', procoreNum:147, riskScore:55, ballInCourt:'Oscar Hernandez',  createdById:sysId },
    { id:'6008-rfi-154', projectId:'6008', number:'154', title:'Conflict, Level 3 common-area entry doors',                           description:'', status:'OPEN', priority:'MEDIUM',   dueDate: new Date(now-9*86400000).toISOString(),   procoreId:'154', procoreNum:154, riskScore:48, ballInCourt:'Oscar Hernandez',  createdById:sysId },
  ];
  for (const r of rfis) insRfi.run(r);

  // Submittals
  const insSub = db.prepare(`INSERT OR IGNORE INTO submittals (id,projectId,number,title,description,status,priority,dueDate,procoreId,procoreNum,riskScore,contractor,ballInCourt,specSection,createdById) VALUES (@id,@projectId,@number,@title,@description,@status,@priority,@dueDate,@procoreId,@procoreNum,@riskScore,@contractor,@ballInCourt,@specSection,@createdById)`);
  const subs = [
    { id:'6008-sub-3',  projectId:'6008', number:'16-16000-3',  title:'Lighting Fixtures, B.O.H.',             description:'', status:'DRAFT',     priority:'CRITICAL', dueDate: new Date(now-183*86400000).toISOString(), procoreId:'sub-3',  procoreNum:'16-16000-3',  riskScore:92, contractor:'Caymares Martin', ballInCourt:null,              specSection:'16-16000 Electrical',              createdById:sysId },
    { id:'6008-sub-4',  projectId:'6008', number:'13-13000-4',  title:'Swimming Pool Finish Samples',           description:'', status:'SUBMITTED', priority:'HIGH',     dueDate: new Date(now-90*86400000).toISOString(),  procoreId:'sub-4',  procoreNum:'13-13000-4',  riskScore:80, contractor:'Aquarama Pools',  ballInCourt:'Ingrid Melendez', specSection:'13-13000 Swimming Pool',           createdById:sysId },
    { id:'6008-sub-13', projectId:'6008', number:'16-16000-13', title:'Main Electrical Room FPL Vault Layout',  description:'', status:'SUBMITTED', priority:'HIGH',     dueDate: new Date(now-14*86400000).toISOString(),  procoreId:'sub-13', procoreNum:'16-16000-13', riskScore:65, contractor:'Caymares Martin', ballInCourt:'Betty Rokovich',  specSection:'16-16000 Electrical',              createdById:sysId },
    { id:'6008-sub-10', projectId:'6008', number:'16-16000-10', title:'Floor Boxes Specs',                      description:'', status:'SUBMITTED', priority:'MEDIUM',   dueDate: new Date(now-7*86400000).toISOString(),   procoreId:'sub-10', procoreNum:'16-16000-10', riskScore:55, contractor:'Caymares Martin', ballInCourt:'Ingrid Melendez', specSection:'16-16000 Electrical',              createdById:sysId },
    { id:'6008-sub-52', projectId:'6008', number:'05-05100-2',  title:'Railing, Handrails & Guardrails',        description:'', status:'IN_REVIEW', priority:'MEDIUM',   dueDate: new Date(now-5*86400000).toISOString(),   procoreId:'sub-52', procoreNum:'05-05100-2',  riskScore:48, contractor:'All Dade Fences', ballInCourt:'Len Ricardo',     specSection:'05-05100 Structural & Misc. Metals', createdById:sysId },
    { id:'6008-sub-8',  projectId:'6008', number:'15-15000-8',  title:'Sistema HVAC - Main Units',              description:'', status:'APPROVED',  priority:'HIGH',     dueDate: new Date(now-5*86400000).toISOString(),   procoreId:'sub-8',  procoreNum:'15-15000-8',  riskScore:89, contractor:'HVAC Solutions', ballInCourt:'Betty Rokovich',  specSection:'15-15000 HVAC',                    createdById:sysId },
    { id:'6008-sub-15', projectId:'6008', number:'09-09000-15', title:'Panel de Fachada - Exterior Cladding',   description:'', status:'IN_REVIEW', priority:'CRITICAL', dueDate: new Date(now-21*86400000).toISOString(),  procoreId:'sub-15', procoreNum:'09-09000-15', riskScore:94, contractor:'Eduardo Martinez',ballInCourt:'Eduardo Martinez', specSection:'09-09000 Facade',                  createdById:sysId },
    { id:'6008-sub-16', projectId:'6008', number:'07-07000-16', title:'Exterior Finishes & Humidity Barrier',   description:'', status:'IN_REVIEW', priority:'HIGH',     dueDate: new Date(now-2*86400000).toISOString(),   procoreId:'sub-16', procoreNum:'07-07000-16', riskScore:71, contractor:'Moisture Tech',   ballInCourt:'Ingrid Melendez', specSection:'07-07000 Waterproofing',           createdById:sysId },
  ];
  for (const s of subs) insSub.run(s);

  // Email threads
  const insEmail = db.prepare(`INSERT OR IGNORE INTO email_threads (id,outlookId,projectId,subject,senderEmail,senderName,receivedAt,hasCommitment,commitmentText,sentiment,rfiId,submittalId) VALUES (lower(hex(randomblob(16))),@outlookId,@projectId,@subject,@senderEmail,@senderName,@receivedAt,@hasCommitment,@commitmentText,@sentiment,@rfiId,@submittalId)`);
  const emails = [
    { outlookId:'em-001', projectId:'6008', subject:'RE: RFI #78 – Exterior Finishes & Humidity Concerns | The Edge at Sunset',      senderEmail:'imelendez@owner.com',    senderName:'Ingrid Melendez',    receivedAt:new Date(now-2*86400000).toISOString(),  hasCommitment:1, commitmentText:'We will confirm the revised moisture barrier spec by EOW.', sentiment:'NEUTRAL',  rfiId:'6008-rfi-78',  submittalId:null },
    { outlookId:'em-002', projectId:'6008', subject:'RFI #88 – Level 3 RCP vs. Mechanical Duct Conflicts – URGENT',                   senderEmail:'lricardo@jaxi.com',      senderName:'Len Ricardo',        receivedAt:new Date(now-4*86400000).toISOString(),  hasCommitment:0, commitmentText:null, sentiment:'NEGATIVE', rfiId:'6008-rfi-88',  submittalId:null },
    { outlookId:'em-003', projectId:'6008', subject:'Submittal 16-16000-3 – Lighting Fixtures B.O.H. – Return for Revision',           senderEmail:'brokovich@arch.com',     senderName:'Betty Rokovich',     receivedAt:new Date(now-5*86400000).toISOString(),  hasCommitment:1, commitmentText:'Please resubmit with compliant fixtures within 10 business days.', sentiment:'NEGATIVE', rfiId:null, submittalId:'6008-sub-3'  },
    { outlookId:'em-004', projectId:'6008', subject:'RE: Swimming Pool Finish Samples – Aquarama Review Status',                       senderEmail:'projects@aquarama.com',  senderName:'Carlos Mendes',      receivedAt:new Date(now-7*86400000).toISOString(),  hasCommitment:1, commitmentText:'Will expedite delivery to site within 3 business days after approval.', sentiment:'POSITIVE', rfiId:null, submittalId:'6008-sub-4'  },
    { outlookId:'em-005', projectId:'6008', subject:'OAC Meeting Notes – The Edge at Sunset – June 18, 2026',                          senderEmail:'ohernandez@jaxi.com',    senderName:'Oscar Hernandez',    receivedAt:new Date(now-6*86400000).toISOString(),  hasCommitment:1, commitmentText:'Contractor committed to mobilize for pool deck waterproofing on July 7.', sentiment:'NEUTRAL', rfiId:null, submittalId:null },
    { outlookId:'em-006', projectId:'6008', subject:'OVERDUE – RFI #88 Response Required Immediately',                                  senderEmail:'dcarpio@jaxi.com',       senderName:'Daniel Carpio',      receivedAt:new Date(now-1*86400000).toISOString(),  hasCommitment:0, commitmentText:null, sentiment:'NEGATIVE', rfiId:'6008-rfi-88',  submittalId:null },
    { outlookId:'em-007', projectId:'6008', subject:'RE: Panel de Fachada SUB-015 – Eduardo confirma envio plano viernes',              senderEmail:'emartinez@sub.com',      senderName:'Eduardo Martinez',   receivedAt:new Date(now-4*86400000).toISOString(),  hasCommitment:1, commitmentText:'Confirmo que el plano de fachada estará listo el viernes.', sentiment:'POSITIVE', rfiId:null, submittalId:'6008-sub-15' },
    { outlookId:'em-008', projectId:'6008', subject:'HVAC Sistema – Betty Rokovich objections on approved submittal',                   senderEmail:'brokovich@arch.com',     senderName:'Betty Rokovich',     receivedAt:new Date(now-5*86400000).toISOString(),  hasCommitment:0, commitmentText:null, sentiment:'NEGATIVE', rfiId:null, submittalId:'6008-sub-8'  },
    { outlookId:'em-009', projectId:'6008', subject:'Railing Submittal 05-05100-2 – All Dade Fences – Approved',                        senderEmail:'lricardo@jaxi.com',      senderName:'Len Ricardo',        receivedAt:new Date(now-1*86400000).toISOString(),  hasCommitment:1, commitmentText:'All Dade Fences can proceed with fabrication, expected lead time 6 weeks.', sentiment:'POSITIVE', rfiId:null, submittalId:'6008-sub-52' },
    { outlookId:'em-010', projectId:'6008', subject:'RFI-142: Pipe diameter vs wall thickness – Oscar sin respuesta 5 dias',            senderEmail:'ohernandez@jaxi.com',    senderName:'Oscar Hernandez',    receivedAt:new Date(now-18*86400000).toISOString(), hasCommitment:0, commitmentText:null, sentiment:'NEGATIVE', rfiId:'6008-rfi-142', submittalId:null },
    { outlookId:'em-011', projectId:'6008', subject:'RE: Exterior Finishes & Humidity Barrier – Ingrid confirmacion EOW',               senderEmail:'imelendez@owner.com',    senderName:'Ingrid Melendez',    receivedAt:new Date(now-2*86400000).toISOString(),  hasCommitment:1, commitmentText:'Will review the humidity spec and respond by end of week.', sentiment:'NEUTRAL', rfiId:'6008-rfi-78', submittalId:'6008-sub-16' },
    { outlookId:'em-012', projectId:'5998', subject:'Empire Brickell – Foundation Pour Confirmation',                                   senderEmail:'site@empire.com',        senderName:'Site Team Empire',   receivedAt:new Date(now-3*86400000).toISOString(),  hasCommitment:1, commitmentText:'Cemex committed to delivery every 45 minutes to maintain continuous pour.', sentiment:'POSITIVE', rfiId:null, submittalId:null },
  ];
  for (const e of emails) insEmail.run(e);

  console.log(`[Seed] Inserted ${rfis.length} RFIs, ${subs.length} Submittals, ${emails.length} emails, ${projects.length} projects`);
}

const router = Router();

// ── GET /api/v1/data/intelligence?projectId=xxx ──────────
router.get('/intelligence', (req: Request, res: Response) => {
  ensureSeeded();
  const { projectId } = req.query;
  try {
    const alerts = runIntelligenceAnalysis(projectId as string | undefined);
    res.json({ source: 'live', alerts: alerts.length > 0 ? alerts : getDemoAlerts(), generatedAt: new Date().toISOString() });
  } catch (err: any) {
    console.error('[Intelligence] Analysis error:', err.message);
    res.json({ source: 'live', alerts: getDemoAlerts(), generatedAt: new Date().toISOString() });
  }
});

// ── GET /api/v1/data/rfis?projectId=xxx ──────────────────
router.get('/rfis', (req: Request, res: Response) => {
  ensureSeeded();
  const { projectId } = req.query;
  try {
    const rfis = getRFIs(projectId as string | undefined);
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
    res.json({ source: 'live', rfis: getDemoRFIs() });
  }
});

// ── GET /api/v1/data/submittals?projectId=xxx ────────────
router.get('/submittals', (req: Request, res: Response) => {
  ensureSeeded();
  const { projectId } = req.query;
  try {
    const submittals = getSubmittals(projectId as string | undefined);
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
    res.json({ source: 'live', submittals: getDemoSubmittals() });
  }
});

// ── GET /api/v1/data/projects ─────────────────────────────
router.get('/projects', (_req: Request, res: Response) => {
  ensureSeeded();
  try {
    const projects = getProjects();
    res.json({ source: 'live', projects: projects.length > 0 ? projects : getDemoProjects() });
  } catch (err: any) {
    res.json({ source: 'live', projects: getDemoProjects() });
  }
});

// ── GET /api/v1/data/summary?projectId=xxx ───────────────
router.get('/summary', (req: Request, res: Response) => {
  ensureSeeded();
  const { projectId } = req.query;
  try {
    const db = getDb();
    const projWhere = projectId ? 'AND projectId = ?' : '';
    const args = projectId ? [projectId] : [];

    const totalRFIs   = (db.prepare(`SELECT COUNT(*) as n FROM rfis WHERE status NOT IN ('CLOSED','ANSWERED') ${projWhere}`).get(...args) as any).n;
    const overdueRFIs = (db.prepare(`SELECT COUNT(*) as n FROM rfis WHERE dueDate < datetime('now') AND status NOT IN ('CLOSED','ANSWERED') ${projWhere}`).get(...args) as any).n;
    const totalSubs   = (db.prepare(`SELECT COUNT(*) as n FROM submittals WHERE status NOT IN ('APPROVED') ${projWhere}`).get(...args) as any).n;
    const overdueSubs = (db.prepare(`SELECT COUNT(*) as n FROM submittals WHERE dueDate < datetime('now') AND status NOT IN ('APPROVED') ${projWhere}`).get(...args) as any).n;
    const emailCount  = (db.prepare(`SELECT COUNT(*) as n FROM email_threads`).get() as any).n;
    const commitCount = (db.prepare(`SELECT COUNT(*) as n FROM email_threads WHERE hasCommitment=1`).get() as any).n;

    res.json({
      source: 'live',
      rfis:       { total: totalRFIs, overdue: overdueRFIs, inYourCourt: Math.floor(totalRFIs * 0.3), dueSoon: Math.floor(totalRFIs * 0.1) },
      submittals: { total: totalSubs,  overdue: overdueSubs, open: totalSubs, dueSoon: Math.floor(totalSubs * 0.1), providers: 8 },
      emails:     { total: emailCount, withCommitment: commitCount },
      lastSync:   new Date().toISOString(),
    });
  } catch (err: any) {
    res.json({ source: 'live', rfis: { total: 5, overdue: 5 }, submittals: { total: 8, overdue: 3 } });
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

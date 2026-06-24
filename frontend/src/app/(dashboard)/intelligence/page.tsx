'use client';

import { useState, useRef } from 'react';
import { useDashSummary } from '@/hooks/useApiData';
import { useLanguage } from '@/contexts/LanguageContext';


// ─── Dashboard's exact CSS design language ───────────────────────────────────
const CSS = `
  :root {
    --navy:    #322A81;
    --accent:  #9FD340;
    --surface: #3A3392;
    --sur2:    #454099;
    --line:    #4C46A2;
    --txt:     #FFFFFF;
    --muted:   #C2BEE8;
    --faint:   #8E89C4;
    --danger-bg: #4A2740; --danger-tx: #FF8C8C;
    --ok-tx:   #9FD340;
    --warn-tx: #FFC24D;
    --info-bg: #2A2370; --info-tx: #CFCBF0;
    --r:14px; --rsm:9px;
  }
  .int-wrap { max-width: 1080px; margin: 0 auto; padding: 24px 20px 60px; font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif; line-height:1.5; }

  /* ── Header ── */
  .int-top { display:flex; align-items:center; justify-content:space-between; gap:12px; flex-wrap:wrap; margin-bottom:20px; }
  .int-brand { display:flex; align-items:center; gap:10px; }
  .int-logo { width:42px; height:42px; border-radius:10px; background:linear-gradient(135deg,#9FD340,#4ade80); display:flex; align-items:center; justify-content:center; font-weight:800; font-size:18px; color:#1a1760; }
  .int-title { font-size:20px; font-weight:700; color:var(--txt); }
  .int-sub { font-size:12px; color:var(--muted); }

  /* ── KPI chips ── */
  .kpi-row { display:flex; gap:10px; flex-wrap:wrap; margin-bottom:20px; }
  .kpi { display:flex; align-items:center; gap:8px; background:var(--surface); border:1px solid var(--line); border-radius:10px; padding:10px 16px; }
  .kpi-num { font-size:22px; font-weight:700; line-height:1; }
  .kpi-lbl { font-size:11px; color:var(--muted); }

  /* ── 2-col layout ── */
  .int-grid { display:grid; grid-template-columns:1fr 340px; gap:20px; align-items:start; }
  @media(max-width:900px){ .int-grid{grid-template-columns:1fr;} }

  /* ── Alert cards ── */
  .al-card { background:var(--surface); border:1px solid var(--line); border-radius:var(--r); margin-bottom:12px; overflow:hidden; cursor:pointer; transition:border-color .2s, box-shadow .2s; }
  .al-card:hover { border-color:var(--faint); box-shadow:0 4px 20px rgba(0,0,0,.25); }
  .al-top { display:flex; align-items:flex-start; gap:12px; padding:16px 18px; }
  .al-body { flex:1; min-width:0; }
  .al-type-row { display:flex; align-items:center; gap:8px; margin-bottom:6px; flex-wrap:wrap; }
  .al-pill { font-size:11px; font-weight:700; padding:3px 10px; border-radius:7px; white-space:nowrap; }
  .al-pill.crit { background:var(--danger-bg); color:var(--danger-tx); animation:pulseCrit 1.8s ease-in-out infinite; }
  .al-pill.high { background:rgba(255,194,77,.15); color:var(--warn-tx); animation:pulseWarn 2.2s ease-in-out infinite; }
  .al-pill.ok   { background:rgba(159,211,64,.12); color:var(--ok-tx); }
  .al-title { font-size:15px; font-weight:600; color:var(--txt); margin-bottom:5px; }
  .al-desc  { font-size:13px; color:var(--muted); }
  .al-chips { display:flex; gap:8px; margin-top:8px; flex-wrap:wrap; }
  .al-chip  { font-size:11px; color:var(--faint); border:1px dashed var(--line); border-radius:6px; padding:2px 8px; }
  .al-chev  { color:var(--faint); font-size:13px; flex-shrink:0; transition:transform .25s; margin-top:2px; }
  .al-score { font-size:11px; font-weight:800; flex-shrink:0; }

  /* ── Expanded ── */
  .al-expand { background:var(--sur2); border-top:1px solid var(--line); padding:14px 18px; }
  .ev-label { font-size:11px; color:var(--accent); font-weight:700; text-transform:uppercase; letter-spacing:.06em; margin-bottom:5px; }
  .ev-quote { font-size:13px; color:var(--warn-tx); font-style:italic; margin-bottom:12px; }
  .action-box { display:flex; align-items:flex-start; gap:8px; background:rgba(159,211,64,.08); border:1px solid rgba(159,211,64,.2); border-radius:var(--rsm); padding:10px 14px; margin-bottom:12px; }
  .action-txt { font-size:13px; color:var(--ok-tx); }
  .btn-draft { background:var(--accent); color:var(--navy); border:none; font-weight:700; font-size:13px; padding:8px 14px; border-radius:8px; cursor:pointer; transition:filter .15s; }
  .btn-draft:hover { filter:brightness(1.1); }
  .btn-sec   { background:var(--sur2); color:var(--txt); border:1px solid var(--line); font-weight:600; font-size:13px; padding:8px 14px; border-radius:8px; cursor:pointer; margin-left:8px; }
  .draftbox  { background:var(--surface); border:1px solid var(--line); border-radius:var(--rsm); padding:14px; margin-top:12px; }
  .dlbl { display:block; font-size:11px; color:var(--accent); font-weight:600; margin:8px 0 3px; }
  .dinput { width:100%; background:var(--navy); border:1px solid var(--line); color:var(--txt); border-radius:7px; padding:7px 10px; font-size:13px; font-family:inherit; }
  .dbody  { width:100%; min-height:180px; background:var(--navy); border:1px solid var(--line); color:var(--txt); border-radius:7px; padding:9px; font-size:13px; font-family:inherit; resize:vertical; }
  .dact   { display:flex; gap:8px; margin-top:8px; }
  .dact-btn { background:var(--accent); color:var(--navy); border:none; font-weight:700; font-size:12px; padding:7px 14px; border-radius:7px; cursor:pointer; }
  .dact-btn.sec { background:var(--sur2); color:var(--txt); border:1px solid var(--line); font-weight:600; }
  .copy-note { font-size:12px; color:var(--ok-tx); font-weight:600; }

  /* ── Chat ── */
  .chat-card { background:var(--surface); border:1px solid var(--line); border-radius:var(--r); display:flex; flex-direction:column; height:560px; position:sticky; top:24px; }
  .chat-hdr  { padding:14px 16px; border-bottom:1px solid var(--line); display:flex; align-items:center; gap:10px; }
  .chat-msgs { flex:1; overflow-y:auto; padding:14px; display:flex; flex-direction:column; gap:10px; }
  .chat-msg  { font-size:13px; padding:10px 14px; border-radius:14px; max-width:88%; line-height:1.5; }
  .chat-msg.ai   { background:var(--sur2); color:var(--txt); border-radius:14px 14px 14px 4px; }
  .chat-msg.user { background:var(--accent); color:var(--navy); font-weight:600; border-radius:14px 14px 4px 14px; align-self:flex-end; }
  .chat-sugg { display:flex; gap:6px; flex-wrap:wrap; padding:8px 12px; }
  .sugg-btn  { background:var(--sur2); border:1px solid var(--line); color:var(--muted); font-size:11px; border-radius:8px; padding:5px 10px; cursor:pointer; transition:all .15s; }
  .sugg-btn:hover { color:var(--txt); border-color:var(--faint); }
  .chat-input-row { display:flex; gap:8px; padding:12px; border-top:1px solid var(--line); }
  .chat-in { flex:1; background:var(--sur2); border:1px solid var(--line); color:var(--txt); border-radius:10px; padding:9px 12px; font-size:13px; font-family:inherit; }
  .chat-in:focus { outline:none; border-color:var(--accent); }
  .send-btn { width:38px; height:38px; background:var(--accent); border:none; border-radius:10px; cursor:pointer; font-weight:700; font-size:16px; color:var(--navy); flex-shrink:0; }

  /* ── Animations ── */
  @keyframes pulseCrit { 0%,100%{box-shadow:0 0 0 0 rgba(255,140,140,.55)} 50%{box-shadow:0 0 0 5px rgba(255,140,140,0)} }
  @keyframes pulseWarn { 0%,100%{box-shadow:0 0 0 0 rgba(255,194,77,.5)}  50%{box-shadow:0 0 0 5px rgba(255,194,77,0)} }
  @keyframes popIn    { 0%{transform:scale(.6);opacity:0} 70%{transform:scale(1.07)} 100%{transform:scale(1);opacity:1} }
`;

// ─── Alert data (bilingual) ─────────────────────────────────────────────────
function getAlerts(en: boolean) {
  return [
    {
      id:'al-1', pillClass:'crit', riskScore:94, riskColor:'#FF8C8C',
      type:       en ? 'Broken Commitment'       : 'Compromiso Roto',
      title:      en ? 'Eduardo promised to send the drawing on Friday' : 'Eduardo prometió enviar el plano el viernes',
      desc:       en ? 'Today is Tuesday. 4 days with no email reply or action in Procore. The subcontractor was waiting for that doc to proceed.'
                     : 'Hoy es martes. 4 días sin respuesta en email ni acción en Procore. El subcontratista estaba esperando ese doc para proceder.',
      evidence:   en ? '"I\'ll send you the doc on Friday without fail" — Eduardo M., Caymares Electric · Jun 20, 3:14 PM'
                     : '"Te mando el doc el viernes sin falta" — Eduardo M., Caymares Electric · 20 jun 3:14 PM',
      action:     en ? 'Call Eduardo today and log the result in Procore before 5 PM.'
                     : 'Llamar a Eduardo hoy y registrar resultado en Procore antes de las 5 PM.',
      linkedItem: en ? 'SUB-015 · Facade Panel' : 'SUB-015 · Panel de Fachada',
      draftTo:    'eduardo.m@caymares-electric.com',
      draftSubj:  en ? 'URGENT FOLLOW-UP — SUB-015 Facade Panel' : 'SEGUIMIENTO URGENTE — SUB-015 Panel de Fachada',
      draftBody:  en
        ? `Eduardo,\n\nWe are still waiting for the document you promised to send on June 20th.\n\nAs of today (Tuesday ${new Date().toLocaleDateString('en-US',{day:'numeric',month:'long'})}) we have not received anything and submittal SUB-015 is still pending in Procore.\n\nCan you confirm the status today before noon?\n\nBest regards,\nDaniel Carpio · JAXI Builders`
        : `Eduardo,\n\nEsperamos el documento que prometiste enviar el viernes 20 de junio.\n\nAl día de hoy (martes ${new Date().toLocaleDateString('es-US',{day:'numeric',month:'long'})}) no hemos recibido nada y el submittal SUB-015 sigue pendiente en Procore.\n\n¿Puedes confirmarnos el status hoy antes del mediodía?\n\nSaludos,\nDaniel Carpio · JAXI Builders`,
    },
    {
      id:'al-2', pillClass:'crit', riskScore:89, riskColor:'#FF8C8C',
      type:       en ? 'Procore/Email Conflict'   : 'Conflicto Procore/Email',
      title:      en ? 'Procore says APPROVED — architect has doubts in email' : 'Procore dice APROBADO — el arquitecto tiene dudas en email',
      desc:       en ? 'Submittal SUB-008 (HVAC System) was marked "Approved" in Procore on Jun 19. That same day, Betty Rokovich sent an email with objections about the specified material.'
                     : 'El submittal SUB-008 (Sistema HVAC) fue marcado como "Approved" en Procore el 19 jun. Ese mismo día, Betty Rokovich envió un email con objeciones sobre el material especificado.',
      evidence:   en ? '"I have concerns about the material specified in section 3.2. Can we talk?" — Betty Rokovich, Arq. Asociados · Jun 19'
                     : '"Tengo dudas sobre el material especificado en la sección 3.2. ¿Podemos hablar?" — Betty Rokovich, Arq. Asociados · 19 jun',
      action:     en ? 'DO NOT proceed with fabrication until clarified with Betty. If material was already ordered, there is a change cost risk.'
                     : 'NO proceder con fabricación hasta aclarar con Betty. Si ya se ordenó material, hay riesgo de costo de cambio.',
      linkedItem: en ? 'SUB-008 · HVAC System' : 'SUB-008 · Sistema HVAC',
      draftTo:    'b.rokovich@arquitectos-asociados.com',
      draftSubj:  en ? 'CLARIFICATION — SUB-008 HVAC System (Section 3.2)' : 'ACLARACIÓN — SUB-008 Sistema HVAC (Sección 3.2)',
      draftBody:  en
        ? `Betty,\n\nI saw your email from June 19 about SUB-008. You are right to want to clarify section 3.2 before proceeding.\n\nCan we do a quick call tomorrow at 10 AM to resolve this?\n\nI want to make sure the contractor does not proceed until we have your confirmation.\n\nBest regards,\nDaniel Carpio · JAXI Builders`
        : `Betty,\n\nVi tu email del 19 de junio sobre SUB-008. Tienes razón en querer aclarar la sección 3.2 antes de proceder.\n\n¿Puedes hacer una llamada rápida mañana a las 10 AM para resolver esto?\n\nQuiero asegurarme de que el contratista no proceda hasta tener tu confirmación.\n\nSaludos,\nDaniel Carpio · JAXI Builders`,
    },
    {
      id:'al-3', pillClass:'high', riskScore:75, riskColor:'#FFC24D',
      type:       en ? 'Dangerous Silence'        : 'Silencio Peligroso',
      title:      en ? 'RFI-142: 5 days with no email — nobody is following up' : 'RFI-142: 5 días sin ningún email — nadie está dando seguimiento',
      desc:       en ? 'The RFI has been overdue for 18 days. Oscar Hernandez is in charge (JAXI). Outlook review of the last 7 days: zero emails with "RFI 142" or "pipe diameter". The item is being ignored.'
                     : 'El RFI lleva 18 días vencido. Oscar Hernandez está en cancha (JAXI). Revisión en Outlook de los últimos 7 días: cero emails con "RFI 142" o "pipe diameter". El item está siendo ignorado.',
      evidence:   en ? 'Outlook search (last 7 days): 0 results for "RFI 142" or "pipe diameter" or "N3-10".'
                     : 'Búsqueda en Outlook (últimos 7 días): 0 resultados para "RFI 142" o "pipe diameter" o "N3-10".',
      action:     en ? 'Send escalation email to the structural engineer today, CC the PM. Log in Procore.'
                     : 'Enviar email de escalación al ingeniero estructural hoy, copiar al PM. Registrar en Procore.',
      linkedItem: 'RFI-142 · Pipe diameter vs wall thickness N3-10',
      draftTo:    'structural.engineer@firm.com',
      draftSubj:  en ? 'ESCALATION — RFI 142 Pipe diameter vs wall thickness N3-10 (18 days overdue)'
                     : 'ESCALACIÓN — RFI 142 Pipe diameter vs wall thickness N3-10 (18 días vencido)',
      draftBody:  en
        ? `Dear engineer,\n\nRFI-142 (Pipe diameter vs wall thickness, N3-10) has been overdue for 18 days and we need your response urgently.\n\nThis is impacting the rough-in schedule on floor 3. Without your response this week, there will be a schedule impact.\n\nPlease confirm a response date at your earliest convenience.\n\nOscar Hernandez · JAXI Builders`
        : `Estimado,\n\nEl RFI-142 (Pipe diameter vs wall thickness, N3-10) lleva 18 días vencido y necesitamos su respuesta con urgencia.\n\nEsta situación está afectando el cronograma de rough-in del piso 3. Sin su respuesta esta semana, habrá impacto en el schedule.\n\nPor favor confirme fecha de respuesta a la brevedad.\n\nOscar Hernandez · JAXI Builders`,
    },
    {
      id:'al-4', pillClass:'high', riskScore:71, riskColor:'#FFC24D',
      type:       en ? 'Pending Commitment'       : 'Compromiso Pendiente',
      title:      en ? 'Ingrid committed to respond on RFI-78 before the weekend' : 'Ingrid se comprometió a responder sobre RFI-78 antes del fin de semana',
      desc:       en ? 'Email received 2 days ago. Ingrid confirmed she will review the moisture barrier spec "by EOW". The RFI is 119 days overdue. If she doesn\'t respond, we need to escalate on Monday.'
                     : 'Email recibido hace 2 días. Ingrid confirmó que revisará el spec de barrera de humedad "por EOW". El RFI lleva 119 días vencido. Si no responde, habrá que escalar al lunes.',
      evidence:   en ? '"We will confirm the revised moisture barrier spec by end of week" — Ingrid Melendez, Owner Group · Jun 22'
                     : '"Confirmaremos el spec revisado de la barrera de humedad para fin de semana" — Ingrid Melendez, Owner Group · 22 jun',
      action:     en ? 'If it\'s Monday and there\'s no response from Ingrid, escalate to the project owner this morning.'
                     : 'Si es lunes y no hay respuesta de Ingrid, escalar al proyecto owner esta misma mañana.',
      linkedItem: 'RFI-078 · Exterior Finishes & Humidity Concerns',
      draftTo:    'i.melendez@owner-group.com',
      draftSubj:  en ? 'REMINDER — RFI 78 (119 days overdue)' : 'RECORDATORIO — RFI 78 (119 días vencido)',
      draftBody:  en
        ? `Ingrid,\n\nFollowing up on your email from June 22, we are waiting for your confirmation of the moisture barrier spec for RFI-78.\n\nThe original due date for this RFI was 119 days ago and it is still blocking the exterior facade closure.\n\nPlease confirm status at the beginning of this week.\n\nDaniel Carpio · JAXI Builders`
        : `Ingrid,\n\nComo seguimiento a tu email del 22 de junio, esperamos tu confirmación del spec de barrera de humedad para RFI-78.\n\nEl vencimiento original de este RFI fue hace 119 días y sigue bloqueando el cierre de la fachada exterior.\n\nPor favor confírmanos status al inicio de esta semana.\n\nDaniel Carpio · JAXI Builders`,
    },
    {
      id:'al-5', pillClass:'ok', riskScore:0, riskColor:'#9FD340',
      type:       en ? 'Commitment Fulfilled'     : 'Compromiso Cumplido',
      title:      en ? 'All Dade Fences confirmed start of railing fabrication' : 'All Dade Fences confirmó inicio de fabricación de railings',
      desc:       en ? 'The railing submittal was approved yesterday. Len Ricardo received confirmation from All Dade Fences: 6-week fabrication timeline. Item closed with no issues.'
                     : 'El submittal de railings fue aprobado ayer. Len Ricardo recibió confirmación de All Dade Fences: plazo de fabricación 6 semanas. Item cerrado sin problemas.',
      evidence:   en ? '"We will proceed with fabrication immediately. Estimated delivery: 6 weeks" — All Dade Fences · Jun 23'
                     : '"Procederemos con fabricación inmediatamente. Entrega estimada: 6 semanas" — All Dade Fences · 23 jun',
      action:     en ? 'Log estimated delivery date in Procore: ~August 4. Notify site team.'
                     : 'Registrar en Procore la fecha estimada de entrega: ~4 de agosto. Notificar al equipo de site.',
      linkedItem: 'SUB-05100-2 · Railing & Guardrails',
      draftTo:'', draftSubj:'', draftBody:'',
    },
  ];
}

type Alert = ReturnType<typeof getAlerts>[0];

// ── Draft Email subcomponent ───────────────────────────────────────────────────
function DraftEmail({ al }: { al: Alert }) {
  const { lang } = useLanguage();
  const en = lang === 'en';
  const [open, setOpen] = useState(false);
  const [note, setNote] = useState('');
  const toRef   = useRef<HTMLInputElement>(null);
  const subjRef = useRef<HTMLInputElement>(null);
  const bodyRef = useRef<HTMLTextAreaElement>(null);

  const copy = () => {
    const text = `${en ? 'To' : 'Para'}: ${toRef.current?.value}\n${en ? 'Subject' : 'Asunto'}: ${subjRef.current?.value}\n\n${bodyRef.current?.value}`;
    navigator.clipboard.writeText(text).then(() => { setNote(en ? 'Copied ✓' : 'Copiado ✓'); setTimeout(() => setNote(''), 2000); });
  };
  const mailto = () => {
    const to   = encodeURIComponent(toRef.current?.value ?? '');
    const subj = encodeURIComponent(subjRef.current?.value ?? '');
    const body = encodeURIComponent(bodyRef.current?.value ?? '');
    window.location.href = `mailto:${to}?subject=${subj}&body=${body}`;
  };

  if (al.pillClass === 'ok') return null;

  return (
    <>
      <button className="btn-draft" onClick={e => { e.stopPropagation(); setOpen(!open); }}>
        ✉ {en ? 'Draft follow-up' : 'Redactar follow-up'}
      </button>
      {open && (
        <div className="draftbox" onClick={e => e.stopPropagation()}>
          <label className="dlbl">{en ? 'To' : 'Para'}</label>
          <input className="dinput" ref={toRef} defaultValue={al.draftTo} />
          <label className="dlbl">{en ? 'Subject' : 'Asunto'}</label>
          <input className="dinput" ref={subjRef} defaultValue={al.draftSubj} />
          <label className="dlbl">{en ? 'Body' : 'Cuerpo'}</label>
          <textarea className="dbody" ref={bodyRef} defaultValue={al.draftBody} />
          <div className="dact">
            <button className="dact-btn" onClick={copy}>{en ? 'Copy' : 'Copiar'}</button>
            <button className="dact-btn sec" onClick={mailto}>{en ? 'Open in Outlook' : 'Abrir en Outlook'}</button>
            {note && <span className="copy-note">{note}</span>}
          </div>
        </div>
      )}
    </>
  );
}

// ── Alert Card ─────────────────────────────────────────────────────────────
function AlertCard({ al, chatInput }: { al: Alert; chatInput: (s: string) => void }) {
  const { lang } = useLanguage();
  const en = lang === 'en';
  const [open, setOpen] = useState(false);
  return (
    <div className="al-card" id={al.id} onClick={() => setOpen(!open)}>
      <div className="al-top">
        <div className="al-body">
          <div className="al-type-row">
            <span className={`al-pill ${al.pillClass}`}>{al.type}</span>
            {al.riskScore > 0 && (
              <span className="al-score" style={{ color: al.riskColor }}>{en ? 'Risk' : 'Riesgo'} {al.riskScore}</span>
            )}
          </div>
          <div className="al-title">{al.title}</div>
          <div className="al-desc">{al.desc}</div>
          <div className="al-chips">
            <span className="al-chip">🔗 {al.linkedItem}</span>
          </div>
        </div>
        <span className="al-chev" style={{ transform: open ? 'rotate(90deg)' : 'rotate(0deg)' }}>▶</span>
      </div>

      {open && (
        <div className="al-expand" onClick={e => e.stopPropagation()}>
          <div className="ev-label">📌 {en ? 'AI-detected evidence' : 'Evidencia detectada por IA'}</div>
          <div className="ev-quote">"{al.evidence}"</div>
          <div className="action-box">
            <span>💡</span>
            <div className="action-txt">{al.action}</div>
          </div>
          <div style={{ display:'flex', gap:8, flexWrap:'wrap', alignItems:'center' }}>
            <DraftEmail al={al} />
            <button
              className="btn-sec"
              onClick={e => { e.stopPropagation(); chatInput(`${en ? 'I need help with' : 'Necesito ayuda con'}: "${al.title}"`); }}>
              🤖 {en ? 'Ask JAXI' : 'Preguntarle a JAXI'}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

// ── JAXI Chat ───────────────────────────────────────────────────────────────
function JaxiChat({ preload, onPreload }: { preload: string; onPreload: () => void }) {
  const { lang } = useLanguage();
  const en = lang === 'en';
  const initMsg = en
    ? 'Hello Daniel. I analyzed 12 emails from The Edge at Sunset. I detected 2 critical conflicts requiring action today: Eduardo\'s broken commitment (SUB-015) and the Procore/email conflict on SUB-008. Where do we start?'
    : 'Hola Daniel. Analizé 12 emails de The Edge at Sunset. Detecté 2 conflictos críticos que necesitan acción hoy: el compromiso roto de Eduardo (SUB-015) y el conflicto Procore/email en SUB-008. ¿Por dónde empezamos?';
  const [msgs, setMsgs] = useState([{ role:'ai', text: initMsg }]);
  const [input, setInput] = useState('');

  const send = (text?: string) => {
    const q = (text ?? input).trim();
    if (!q) return;
    setInput('');
    onPreload();
    setMsgs(m => [...m, { role:'user', text:q }]);
    setTimeout(() => {
      const lower = q.toLowerCase();
      const reply = en
        ? (lower.includes('eduardo') || lower.includes('sub-015')
            ? 'Eduardo\'s commitment is the most urgent. He promised the doc on Friday, today is Tuesday and there\'s no response. I recommend calling him now (before noon) and logging the result in Procore as a note. If he doesn\'t respond, use the draft email and CC the PM.'
          : lower.includes('betty') || lower.includes('hvac') || lower.includes('sub-008')
            ? 'The conflict in SUB-008 is dangerous. Procore says approved but Betty has active doubts in email. If the contractor already ordered material based on Procore, there\'s a change risk. Immediate action: call Betty before the contractor acts.'
          : lower.includes('142') || lower.includes('silence')
            ? 'RFI-142 is 18 days overdue with 5 days of total silence. Recommendation: 1) Escalation email today to the structural engineer. 2) If no response in 24h, escalate to PM. 3) Log everything in Procore.'
          : lower.includes('priority') || lower.includes('first') || lower.includes('today')
            ? 'Today\'s priorities: #1 Call Eduardo (SUB-015) before noon. #2 Talk to Betty about SUB-008 before material is fabricated. #3 Escalation email for RFI-142. Do you want me to draft any of these?'
          : lower.includes('ingrid') || lower.includes('rfi-78') || lower.includes('78')
            ? 'Ingrid committed to responding on RFI-78 before the weekend. If it\'s Monday and she hasn\'t responded, escalate to the Owner Group this morning. The RFI is 119 days old — every additional week increases the schedule impact risk.'
            : 'Based on my data, there are 4 items requiring action today. The most critical are Eduardo\'s broken commitment (SUB-015) and the Betty/Procore conflict (SUB-008). Do you want a draft follow-up email for any of them?')
        : (lower.includes('eduardo') || lower.includes('sub-015')
            ? 'El compromiso de Eduardo es el más urgente. Le prometió el doc el viernes, hoy es martes y no hay respuesta. Recomiendo llamarlo ahora (antes del mediodía) y registrar el resultado en Procore como nota. Si no responde, usa el email borrador y copia al PM.'
          : lower.includes('betty') || lower.includes('hvac') || lower.includes('sub-008')
            ? 'El conflicto en SUB-008 es peligroso. Procore dice aprobado pero Betty tiene dudas activas en email. Si el contratista ya ordenó material basado en Procore, hay riesgo de cambio. Acción inmediata: llamar a Betty antes de que el contratista actúe.'
          : lower.includes('142') || lower.includes('silencio')
            ? 'RFI-142 tiene 18 días vencido y 5 días de silencio total. Recomiendo: 1) Email de escalación hoy al ingeniero estructural. 2) Si no responde en 24h, escalar al PM. 3) Registrar todo en Procore.'
          : lower.includes('prioridad') || lower.includes('primero') || lower.includes('hoy')
            ? 'Prioridades de hoy: #1 Llama a Eduardo (SUB-015) antes del mediodía. #2 Habla con Betty sobre SUB-008 antes de que se fabrique material. #3 Email de escalación para RFI-142. ¿Quieres que redacte alguno?'
          : lower.includes('ingrid') || lower.includes('rfi-78') || lower.includes('78')
            ? 'Ingrid se comprometió a responder RFI-78 antes del fin de semana. Si ya es lunes y no respondió, escala al Owner Group esta mañana. El RFI lleva 119 días — cada semana adicional aumenta el riesgo de impacto en schedule.'
            : 'Basado en mis datos, hay 4 items con action requerida hoy. Los más críticos son el compromiso roto de Eduardo (SUB-015) y el conflicto Betty/Procore (SUB-008). ¿Quieres el draft de algún email de seguimiento?');
      setMsgs(m => [...m, { role:'ai', text:reply }]);
    }, 600);
  };

  if (preload && input !== preload) setInput(preload);

  const suggestions = en
    ? ['What to prioritize today?', 'Draft for Eduardo', 'SUB-008 conflict', 'RFI-142 silence']
    : ['¿Qué priorizar hoy?', 'Draft para Eduardo', 'Conflicto SUB-008', 'RFI-142 silencio'];

  return (
    <div className="chat-card">
      <div className="chat-hdr">
        <div style={{ width:34,height:34,borderRadius:10,background:'linear-gradient(135deg,#9FD340,#4ade80)',display:'flex',alignItems:'center',justifyContent:'center',fontWeight:800,fontSize:18,color:'#1a1760',flexShrink:0 }}>🤖</div>
        <div>
          <div style={{ fontWeight:700,color:'var(--txt)',fontSize:14 }}>JAXI Chat</div>
          <div style={{ fontSize:10,color:'#9FD340' }}>● {en ? 'Procore + Outlook active' : 'Procore + Outlook activos'}</div>
        </div>
      </div>
      <div className="chat-msgs">
        {msgs.map((m, i) => (
          <div key={i} className={`chat-msg ${m.role}`}>{m.text}</div>
        ))}
      </div>
      <div className="chat-sugg">
        {suggestions.map(s => (
          <button key={s} className="sugg-btn" onClick={() => send(s)}>{s}</button>
        ))}
      </div>
      <div className="chat-input-row">
        <input
          id="chat-input"
          className="chat-in"
          placeholder={en ? 'Ask about commitments, emails...' : 'Pregunta sobre compromisos, emails...'}
          value={input}
          onChange={e => setInput(e.target.value)}
          onKeyDown={e => e.key === 'Enter' && send()}
        />
        <button id="btn-send" className="send-btn" onClick={() => send()}>→</button>
      </div>
    </div>
  );
}

// ─── Page ────────────────────────────────────────────────────────────────────
export default function IntelligencePage() {
  const { data: summary, isDemo } = useDashSummary('6008');
  const { lang } = useLanguage();
  const en = lang === 'en';
  const [chatPreload, setChatPreload] = useState('');
  const alerts = getAlerts(en);

  const kpis = en ? [
    { num:4,  lbl:'Broken Commitments',   color:'#FF8C8C' },
    { num:2,  lbl:'Detected Conflicts',   color:'#FFC24D' },
    { num:2,  lbl:'Dangerous Silences',   color:'#C4B5FD' },
    { num:3,  lbl:'Fulfilled This Week',  color:'#9FD340' },
    { num:12, lbl:'Emails analyzed',      color:'#93C5FD' },
  ] : [
    { num:4,  lbl:'Compromisos Rotos',    color:'#FF8C8C' },
    { num:2,  lbl:'Conflictos Detectados',color:'#FFC24D' },
    { num:2,  lbl:'Silencios Peligrosos', color:'#C4B5FD' },
    { num:3,  lbl:'Cumplidos esta semana',color:'#9FD340' },
    { num:12, lbl:'Emails analizados',    color:'#93C5FD' },
  ];

  return (
    <>
      <style dangerouslySetInnerHTML={{ __html: CSS }} />
      <div className="int-wrap">

        {/* Header */}
        <div className="int-top">
          <div className="int-brand">
            <div className="int-logo">
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#16145a" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
            <path d="M12 2a4 4 0 0 1 4 4c0 1.5-.8 2.8-2 3.5V11h-4V9.5A4 4 0 0 1 8 6a4 4 0 0 1 4-4z"/>
            <path d="M10 11v2a2 2 0 0 0 4 0v-2"/>
            <path d="M8 14s-2 1-2 3h12c0-2-2-3-2-3"/>
            <line x1="12" y1="17" x2="12" y2="20"/><line x1="9" y1="20" x2="15" y2="20"/>
          </svg>
        </div>
            <div>
              <div className="int-title">JAXI Intelligence</div>
              <div className="int-sub">{en ? 'Procore ↔ Outlook Cross Engine' : 'Motor de cruce Procore ↔ Outlook'} · The Edge at Sunset</div>
            </div>
          </div>
          <div style={{ display:'flex', alignItems:'center', gap:12 }}>
            <span style={{
              display:'inline-flex', alignItems:'center', gap:6,
              fontSize:11, fontWeight:700, padding:'4px 10px', borderRadius:20,
              background: isDemo ? 'rgba(255,194,77,.15)' : 'rgba(159,211,64,.15)',
              color: isDemo ? '#FFC24D' : '#9FD340',
              border:`1px solid ${isDemo ? '#FFC24D55' : '#9FD34055'}`,
            }}>
              ● {isDemo ? (en ? '⚡ DEMO — not connected' : '⚡ DEMO — sin conexión') : (en ? 'LIVE DATA' : 'DATOS EN VIVO')}
            </span>
            <a href="/settings" style={{ fontSize:12, color:'var(--muted)', border:'1px solid var(--line)', borderRadius:8, padding:'5px 10px', textDecoration:'none', background:'var(--surface)' }}>
              ⚙ {en ? 'Settings' : 'Configuración'}
            </a>
          </div>
        </div>

        {/* KPI chips */}
        <div className="kpi-row">
          {kpis.map((k, i) => (
            <div className="kpi" key={i}>
              <div className="kpi-num" style={{ color:k.color }}>{k.num}</div>
              <div className="kpi-lbl">{k.lbl}</div>
            </div>
          ))}
        </div>

        {/* 2-col layout */}
        <div className="int-grid">

          {/* Alert cards */}
          <div>
            <div style={{ fontSize:13, color:'var(--muted)', marginBottom:12 }}>
              Haz clic en cada alerta para ver la evidencia y el email de seguimiento generado por IA.
            </div>
            {alerts.map(al => (
              <AlertCard key={al.id} al={al} chatInput={s => { setChatPreload(s); }} />
            ))}
          </div>

          {/* Chat */}
          <JaxiChat preload={chatPreload} onPreload={() => setChatPreload('')} />
        </div>

      </div>
    </>
  );
}

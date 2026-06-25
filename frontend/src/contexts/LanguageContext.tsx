'use client';
import { createContext, useContext, useState, ReactNode } from 'react';

export type Lang = 'es' | 'en';

interface LangCtx { lang: Lang; toggle: () => void; t: (key: string, ...args: string[]) => string; }

const LangContext = createContext<LangCtx>({ lang: 'es', toggle: () => {}, t: k => k });

export const translations: Record<string, Record<Lang, string>> = {
  // ── Nav ────────────────────────────────────────────────────────────────────
  'nav.projects':       { es: 'Proyectos',          en: 'Projects' },
  'nav.rfis':           { es: 'RFIs',               en: 'RFIs' },
  'nav.submittals':     { es: 'Submittals',          en: 'Submittals' },
  'nav.intelligence':   { es: 'JAXI Intelligence',  en: 'JAXI Intelligence' },
  'nav.settings':       { es: 'Configuración',       en: 'Settings' },
  'nav.coordination':   { es: 'Coordinación',        en: 'Coordination' },
  'nav.principal':      { es: 'Principal',           en: 'Main' },
  'nav.ai':             { es: 'Inteligencia IA',     en: 'AI Intelligence' },
  'nav.system':         { es: 'Sistema',             en: 'System' },

  // ── Status ─────────────────────────────────────────────────────────────────
  'status.live':        { es: 'DATOS EN VIVO',       en: 'LIVE DATA' },
  'status.offline':     { es: 'SIN CONEXIÓN',        en: 'NOT CONNECTED' },
  'status.partial':     { es: 'PARCIAL — Conectar',  en: 'PARTIAL — Connect' },
  'status.demo':        { es: 'DEMO',                en: 'DEMO' },

  // ── RFI page ───────────────────────────────────────────────────────────────
  'rfis.title':         { es: 'RFIs',               en: 'RFIs' },
  'rfis.subtitle':      { es: 'abiertos · {0} vencidos · The Edge at Sunset', en: 'open · {0} overdue · The Edge at Sunset' },
  'rfis.newBtn':        { es: '+ Nuevo RFI',         en: '+ New RFI' },
  'rfis.search':        { es: '🔍  Buscar por número o título...', en: '🔍  Search by number or title...' },
  'rfis.sortLabel':     { es: 'Ordenar:',            en: 'Sort:' },
  'rfis.sort.risk':     { es: 'Riesgo (mayor primero)', en: 'Risk (highest first)' },
  'rfis.sort.due':      { es: 'Fecha de vencimiento', en: 'Due date' },
  'rfis.sort.num':      { es: 'Número',              en: 'Number' },
  'rfis.showing':       { es: 'Mostrando {0} de {1} RFIs', en: 'Showing {0} of {1} RFIs' },

  // filters
  'filter.all':         { es: 'Todos',              en: 'All' },
  'filter.open':        { es: 'Abiertos',            en: 'Open' },
  'filter.critical':    { es: 'Críticos',            en: 'Critical' },
  'filter.overdue':     { es: 'Vencidos',            en: 'Overdue' },
  'filter.resolved':    { es: 'Resueltos',           en: 'Resolved' },

  // table headers
  'col.number':         { es: 'Número',              en: 'Number' },
  'col.title':          { es: 'Título',              en: 'Title' },
  'col.discipline':     { es: 'Disciplina',          en: 'Discipline' },
  'col.status':         { es: 'Estado',              en: 'Status' },
  'col.due':            { es: 'Vencimiento',         en: 'Due Date' },
  'col.assigned':       { es: 'Asignado',            en: 'Assigned' },
  'col.source':         { es: 'Fuente',              en: 'Source' },
  'col.risk':           { es: 'Riesgo',              en: 'Risk' },

  // KPI labels
  'kpi.open':           { es: 'Abiertos',            en: 'Open' },
  'kpi.overdue':        { es: 'Vencidos',            en: 'Overdue' },
  'kpi.court':          { es: 'En tu cancha',        en: 'In Your Court' },
  'kpi.soon':           { es: 'Vencen pronto',       en: 'Due Soon' },
  'kpi.open.note':      { es: 'total activos',       en: 'total active' },
  'kpi.overdue.note':   { es: 'requieren acción hoy', en: 'require action today' },
  'kpi.court.note':     { es: 'JAXI en espera',      en: 'JAXI waiting' },
  'kpi.soon.note':      { es: 'próximos 5 días',     en: 'next 5 days' },

  // right panel
  'panel.riskIndex':    { es: 'Índice de Riesgo',    en: 'Risk Index' },
  'panel.byPriority':   { es: 'Distribución por Prioridad', en: 'By Priority' },
  'panel.byDisc':       { es: 'RFIs por Disciplina', en: 'RFIs by Discipline' },
  'panel.summary':      { es: 'Resumen',             en: 'Summary' },
  'panel.withEmail':    { es: 'Con email Outlook',   en: 'With Outlook email' },
  'panel.dueToday':     { es: 'Vencen hoy',          en: 'Due today' },
  'panel.due5':         { es: 'Vencen en 5 días',    en: 'Due in 5 days' },
  'panel.unassigned':   { es: 'Sin asignar',         en: 'Unassigned' },

  // priority labels
  'priority.critical':  { es: 'Crítico',             en: 'Critical' },
  'priority.high':      { es: 'Alto',                en: 'High' },
  'priority.medium':    { es: 'Medio',               en: 'Medium' },
  'priority.low':       { es: 'Bajo',                en: 'Low' },

  // status labels
  'status.open':        { es: 'Abierto',             en: 'Open' },
  'status.pending':     { es: 'En revisión',         en: 'In Review' },
  'status.answered':    { es: 'Respondido',          en: 'Answered' },
  'status.closed':      { es: 'Cerrado',             en: 'Closed' },
  'status.overdue':     { es: 'Vencido',             en: 'Overdue' },

  // ── Intelligence page ──────────────────────────────────────────────────────
  'intel.subtitle':     { es: 'Motor de cruce Procore ↔ Outlook · The Edge at Sunset', en: 'Procore ↔ Outlook Cross Engine · The Edge at Sunset' },
  'intel.demo':         { es: '⚡ DEMO',              en: '⚡ DEMO' },
  'intel.noConn':       { es: 'sin conexión',        en: 'not connected' },
  'intel.settings':     { es: 'Configuración',       en: 'Settings' },
  'intel.pill.broken':  { es: 'Compromisos Rotos',   en: 'Broken Commitments' },
  'intel.pill.conflict':{ es: 'Conflictos Detectados', en: 'Detected Conflicts' },
  'intel.pill.silence': { es: 'Silencios Peligrosos', en: 'Dangerous Silences' },
  'intel.pill.done':    { es: 'Cumplidos esta semana', en: 'Fulfilled This Week' },
  'intel.pill.emails':  { es: 'Emails analizados',   en: 'Emails analyzed' },
  'intel.hint':         { es: 'Haz clic en cada alerta para ver la evidencia y el email de seguimiento generado por IA.', en: 'Click each alert to see the evidence and AI-generated follow-up email.' },
  'intel.chat.title':   { es: 'JAXI Chat',           en: 'JAXI Chat' },
  'intel.chat.sub':     { es: 'Procore + Outlook activos', en: 'Procore + Outlook active' },
  'intel.chat.ph':      { es: 'Pregunta sobre compromisos, emails...', en: 'Ask about commitments, emails...' },
  'intel.tag.broken':   { es: 'Compromiso Roto',     en: 'Broken Commitment' },
  'intel.tag.conflict': { es: 'Conflicto Procore/Email', en: 'Procore/Email Conflict' },
  'intel.tag.silence':  { es: 'Silencio Peligroso',  en: 'Dangerous Silence' },
  'intel.tag.pending':  { es: 'Compromiso Pendiente', en: 'Pending Commitment' },
  'intel.evidence':     { es: 'Evidencia',           en: 'Evidence' },
  'intel.action':       { es: '⚡ Acción sugerida',   en: '⚡ Suggested Action' },
  'intel.draft':        { es: '✉ Generar draft de email', en: '✉ Generate email draft' },
  'intel.suggest1':     { es: '¿Qué priorizar hoy?', en: 'What to prioritize today?' },
  'intel.suggest2':     { es: 'Draft para Eduardo',  en: 'Draft for Eduardo' },
  'intel.suggest3':     { es: 'Conflicto SUB-008',   en: 'SUB-008 Conflict' },
  'intel.suggest4':     { es: 'RFI 142 silencio',    en: 'RFI 142 Silence' },

  // ── Settings page ──────────────────────────────────────────────────────────
  'settings.title':     { es: 'Configuración',       en: 'Settings' },
  'settings.procore':   { es: 'Conectar con Procore', en: 'Connect to Procore' },
  'settings.outlook':   { es: 'Conectar con Outlook', en: 'Connect to Outlook' },
  'settings.connected': { es: 'Conectado',           en: 'Connected' },
  'settings.noconn':    { es: 'Sin conexión',        en: 'Not Connected' },

  // ── Common ─────────────────────────────────────────────────────────────────
  'common.riskAvg':     { es: 'Riesgo Promedio',     en: 'Avg Risk' },
  'common.noData':      { es: 'Sin datos',           en: 'No data' },
  'common.loading':     { es: 'Cargando...',         en: 'Loading...' },
  'common.rfi':         { es: 'RFI',                 en: 'RFI' },
  'common.submittal':   { es: 'Submittal',           en: 'Submittal' },
};

export function LanguageProvider({ children }: { children: ReactNode }) {
  const [lang, setLang] = useState<Lang>('es');
  const toggle = () => setLang(l => l === 'es' ? 'en' : 'es');
  const t = (key: string, ...args: string[]) => {
    let str = translations[key]?.[lang] ?? key;
    args.forEach((a, i) => { str = str.replace(`{${i}}`, a); });
    return str;
  };
  return <LangContext.Provider value={{ lang, toggle, t }}>{children}</LangContext.Provider>;
}

export function useLanguage() {
  return useContext(LangContext);
}

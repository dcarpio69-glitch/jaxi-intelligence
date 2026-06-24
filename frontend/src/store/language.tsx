'use client';

import React, { createContext, useContext, useState, useCallback } from 'react';

export type Lang = 'en' | 'es';

// ─── Translation dictionary ───────────────────────────────
const translations = {
  en: {
    // App
    appName:    'JAXI Intelligence',
    appSub:     'Outlook + Procore · Bilingual',
    // Nav groups
    navMain:        'Main',
    navCoordination:'Coordination',
    navAI:          'AI Engine',
    navConfig:      'Settings',
    // Nav items
    navDashboard:   'Dashboard',
    navProjects:    'Projects',
    navRFIs:        'RFIs',
    navSubmittals:  'Submittals',
    navFollowup:    'Follow-up',
    navIntelligence:'JAXI Intelligence',
    navSettings:    'Settings',
    // Project selector
    projectLabel:   'PROJECT TO ANALYZE',
    projectLoaded:  '— data loaded',
    noProject:      'Select a project...',
    projectStage:   'Stage',
    projectType:    'Type',
    // Tabs
    tabRFIs:        'RFIs',
    tabSubmittals:  'Submittals',
    tabFollowup:    'Follow-up',
    // KPIs
    kpiOpenRFIs:    'Open RFIs',
    kpiOverdue:     'Overdue',
    kpiInYourCourt: 'In your court',
    kpiNext7:       'Next 7 days',
    kpiOpenSubs:    'Open Submittals',
    kpiPendingReview:'Pending review',
    kpiGaps:        'AI Detected Gaps',
    kpiBroken:      'Broken commitments',
    // Alerts/Updates
    updatedOn:      'Updated on',
    overdueWere:    'overdue (were',
    mostCritical:   'The most critical is now',
    inOwnerCourt:   'in Owner\'s court',
    clickForDetail: 'Click any item to view detail.',
    // Sections
    mostCriticalRFI:'Most critical RFI of the project',
    overdueInYourCourt:'Overdue in your court (JAXI)',
    overdueOwner:   'Overdue in Owner\'s court',
    allOpenRFIs:    'All open RFIs',
    criticalGaps:   'Critical Gaps — Cross-Analysis',
    todayPriorities:'Today\'s Priorities — Ordered by Risk',
    // Buttons
    btnNewRFI:      'New RFI',
    btnNewSub:      'New Submittal',
    btnRefresh:     'Refresh',
    btnViewAll:     'View all →',
    btnViewGaps:    'View gaps →',
    btnSend:        'Send',
    btnSave:        'Save',
    btnCancel:      'Cancel',
    btnDisconnect:  'Disconnect',
    btnConnect:     'Connect',
    // Integrations
    outlookStatus:  'Outlook synced',
    procoreStatus:  'Procore synced',
    // Days
    days:           'days',
    today:          'Today',
    tomorrow:       'Tomorrow',
    inDays:         'In {n} days',
    overdueDays:    '{n}d overdue',
    // Status labels
    statusOpen:     'Open',
    statusPending:  'Pending',
    statusAnswered:  'Answered',
    statusClosed:    'Closed',
    statusOverdue:   'Overdue',
    statusApproved:  'Approved',
    statusRejected:  'Rejected',
    statusResubmit:  'Resubmit',
    // Priority
    priorityCritical:'Critical',
    priorityHigh:    'High',
    priorityMedium:  'Medium',
    priorityLow:     'Low',
    // Table headers
    thNumber:       'Number',
    thTitle:        'Title',
    thStatus:       'Status',
    thPriority:     'Priority',
    thDiscipline:   'Discipline',
    thDueDate:      'Due Date',
    thAssigned:     'Assigned To',
    thRisk:         'Risk',
    thSource:       'Source',
    thDays:         'Days',
    // AI Chat
    chatPlaceholder:'What RFIs should I prioritize today?',
    chatName:       'JAXI Intelligence',
    chatContext:    'Context: Procore + Outlook active',
    // Settings
    settingsTitle:  'Settings & Integrations',
    settingsOutlook:'Microsoft Outlook',
    settingsProcore:'Procore',
    settingsLang:   'Language',
    settingsTheme:  'Theme',
    // Gap types
    gapBroken:      'Broken Commitment',
    gapSilence:     'Dangerous Silence',
    gapConflict:    'Approval Conflict',
    gapOverdue:     'Overdue + Active Email',
    gapDesync:      'Platform Desync',
    // Login
    loginTitle:     'Sign in',
    loginSubtitle:  'Your full project. One screen.',
    loginEmail:     'Corporate email',
    loginPassword:  'Password',
    loginRemember:  'Remember me',
    loginForgot:    'Forgot your password?',
    loginBtn:       'Enter JAXI Intelligence →',
    loginNoAccount: "Don't have an account?",
    loginContact:   'Contact your admin',
    // Showing
    showing:        'Showing',
    of:             'of',
    results:        'results',
  },
  es: {
    // App
    appName:    'JAXI Intelligence',
    appSub:     'Outlook + Procore · Bilingüe',
    // Nav groups
    navMain:        'Principal',
    navCoordination:'Coordinación',
    navAI:          'Motor IA',
    navConfig:      'Configuración',
    // Nav items
    navDashboard:   'Dashboard',
    navProjects:    'Proyectos',
    navRFIs:        'RFIs',
    navSubmittals:  'Submittals',
    navFollowup:    'Follow-up',
    navIntelligence:'JAXI Intelligence',
    navSettings:    'Configuración',
    // Project selector
    projectLabel:   'PROYECTO A ANALIZAR',
    projectLoaded:  '— datos cargados',
    noProject:      'Selecciona un proyecto...',
    projectStage:   'Etapa',
    projectType:    'Tipo',
    // Tabs
    tabRFIs:        'RFIs',
    tabSubmittals:  'Submittals',
    tabFollowup:    'Follow-up',
    // KPIs
    kpiOpenRFIs:    'RFIs abiertos',
    kpiOverdue:     'Vencidos',
    kpiInYourCourt: 'En tu cancha',
    kpiNext7:       'Próx. 7 días',
    kpiOpenSubs:    'Submittals abiertos',
    kpiPendingReview:'Pendientes de revisión',
    kpiGaps:        'Gaps detectados IA',
    kpiBroken:      'Compromisos rotos',
    // Alerts/Updates
    updatedOn:      'Actualizado al',
    overdueWere:    'vencidos (eran',
    mostCritical:   'El más grave ahora es',
    inOwnerCourt:   'en cancha del Owner',
    clickForDetail: 'Haz clic en cualquier ítem para ver su detalle.',
    // Sections
    mostCriticalRFI:'RFI más crítico del proyecto',
    overdueInYourCourt:'Vencidos en tu cancha (JAXI)',
    overdueOwner:   'Vencidos en cancha del Owner',
    allOpenRFIs:    'Todos los RFIs abiertos',
    criticalGaps:   'Gaps Críticos — Cross-Analysis',
    todayPriorities:'Prioridades de Hoy — Ordenadas por Riesgo',
    // Buttons
    btnNewRFI:      'Nuevo RFI',
    btnNewSub:      'Nuevo Submittal',
    btnRefresh:     'Actualizar',
    btnViewAll:     'Ver todos →',
    btnViewGaps:    'Ver gaps →',
    btnSend:        'Enviar',
    btnSave:        'Guardar',
    btnCancel:      'Cancelar',
    btnDisconnect:  'Desconectar',
    btnConnect:     'Conectar',
    // Integrations
    outlookStatus:  'Outlook sincronizado',
    procoreStatus:  'Procore sincronizado',
    // Days
    days:           'días',
    today:          'Hoy',
    tomorrow:       'Mañana',
    inDays:         'En {n} días',
    overdueDays:    '{n}d vencido',
    // Status labels
    statusOpen:     'Abierto',
    statusPending:  'Pendiente',
    statusAnswered:  'Respondido',
    statusClosed:    'Cerrado',
    statusOverdue:   'Vencido',
    statusApproved:  'Aprobado',
    statusRejected:  'Rechazado',
    statusResubmit:  'Reenviar',
    // Priority
    priorityCritical:'Crítico',
    priorityHigh:    'Alto',
    priorityMedium:  'Medio',
    priorityLow:     'Bajo',
    // Table headers
    thNumber:       'Número',
    thTitle:        'Título',
    thStatus:       'Estado',
    thPriority:     'Prioridad',
    thDiscipline:   'Disciplina',
    thDueDate:      'Vencimiento',
    thAssigned:     'Asignado a',
    thRisk:         'Riesgo',
    thSource:       'Fuente',
    thDays:         'Días',
    // AI Chat
    chatPlaceholder:'¿Qué RFIs debo priorizar hoy?',
    chatName:       'JAXI Intelligence',
    chatContext:    'Contexto: Procore + Outlook activos',
    // Settings
    settingsTitle:  'Configuración e Integraciones',
    settingsOutlook:'Microsoft Outlook',
    settingsProcore:'Procore',
    settingsLang:   'Idioma',
    settingsTheme:  'Tema',
    // Gap types
    gapBroken:      'Compromiso Roto',
    gapSilence:     'Silencio Peligroso',
    gapConflict:    'Conflicto de Aprobación',
    gapOverdue:     'Vencido + Email Activo',
    gapDesync:      'Desincronización de Plataformas',
    // Login
    loginTitle:     'Iniciar sesión',
    loginSubtitle:  'Todo tu proyecto. Una sola pantalla.',
    loginEmail:     'Email corporativo',
    loginPassword:  'Contraseña',
    loginRemember:  'Recordarme',
    loginForgot:    '¿Olvidaste tu contraseña?',
    loginBtn:       'Entrar a JAXI Intelligence →',
    loginNoAccount: '¿No tienes cuenta?',
    loginContact:   'Contacta a tu administrador',
    // Showing
    showing:        'Mostrando',
    of:             'de',
    results:        'resultados',
  },
} as const;

export type TranslationKey = keyof typeof translations.en;

// ─── Context ──────────────────────────────────────────────
interface LangContextType {
  lang: Lang;
  setLang: (l: Lang) => void;
  t: (key: TranslationKey) => string;
}

const LangContext = createContext<LangContextType>({
  lang: 'es',
  setLang: () => {},
  t: (k) => k,
});

// ─── Provider ─────────────────────────────────────────────
export function LangProvider({ children }: { children: React.ReactNode }) {
  const [lang, setLang] = useState<Lang>('es');

  const t = useCallback(
    (key: TranslationKey): string => translations[lang][key] ?? translations.es[key] ?? key,
    [lang],
  );

  return (
    <LangContext.Provider value={{ lang, setLang, t }}>
      {children}
    </LangContext.Provider>
  );
}

// ─── Hook ─────────────────────────────────────────────────
export function useLang() {
  return useContext(LangContext);
}

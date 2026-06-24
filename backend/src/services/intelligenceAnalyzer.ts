/**
 * JAXI Intelligence — Cross-Platform Analysis Engine
 * Crosses Procore RFIs/Submittals WITH Outlook email threads
 * to detect: Broken Commitments, Platform Conflicts, Dangerous Silences
 */

import { getDb } from '../utils/db';

export type AlertType = 'BROKEN_COMMITMENT' | 'PLATFORM_CONFLICT' | 'DANGEROUS_SILENCE' | 'PENDING_COMMITMENT';
export type AlertSeverity = 'CRITICAL' | 'HIGH' | 'MEDIUM';

export interface IntelligenceAlert {
  id: string;
  type: AlertType;
  severity: AlertSeverity;
  riskScore: number;

  // Context
  itemType: 'RFI' | 'SUBMITTAL';
  itemId: string;
  itemNumber: string;
  itemTitle: string;
  projectId: string;
  projectName: string;

  // Analysis
  headline: string;      // e.g. "Eduardo prometió enviar el plano el viernes"
  evidence: string;      // What JAXI found in the emails
  procoreStatus: string; // Current Procore status
  daysOverdue: number;

  // Email evidence
  emailSubject: string | null;
  emailSender: string | null;
  commitmentText: string | null;
  emailReceivedAt: string | null;

  // Action
  suggestedAction: string;
  draftEmailPrompt: string;
}

export function runIntelligenceAnalysis(projectId?: string): IntelligenceAlert[] {
  const db = getDb();
  const alerts: IntelligenceAlert[] = [];
  const now = Date.now();
  const dayMs = 86400000;

  // ── Load projects ──────────────────────────────────────────────────────────
  const projectFilter = projectId ? 'WHERE p.id = ?' : '';
  const projectArgs   = projectId ? [projectId] : [];

  const projects = db.prepare(`
    SELECT id, name FROM projects ${projectFilter} AND status = 'ACTIVE'
    LIMIT 10
  `.replace('WHERE  AND', 'WHERE')).all(...projectArgs) as any[];

  if (projects.length === 0) return [];

  const projectMap = new Map(projects.map(p => [p.id, p.name]));
  const projectIds = projects.map(p => p.id);
  const placeholders = projectIds.map(() => '?').join(',');

  // ── Load RFIs with linked emails ───────────────────────────────────────────
  const rfis = db.prepare(`
    SELECT r.*, p.name as projectName
    FROM rfis r
    LEFT JOIN projects p ON p.id = r.projectId
    WHERE r.projectId IN (${placeholders})
    AND r.status NOT IN ('CLOSED', 'ANSWERED')
    ORDER BY r.riskScore DESC
    LIMIT 100
  `).all(...projectIds) as any[];

  // ── Load Submittals with linked emails ─────────────────────────────────────
  const submittals = db.prepare(`
    SELECT s.*, p.name as projectName
    FROM submittals s
    LEFT JOIN projects p ON p.id = s.projectId
    WHERE s.projectId IN (${placeholders})
    AND s.status NOT IN ('APPROVED', 'CLOSED')
    ORDER BY s.riskScore DESC
    LIMIT 100
  `).all(...projectIds) as any[];

  // ── Analyze each RFI ───────────────────────────────────────────────────────
  for (const rfi of rfis) {
    const emails = db.prepare(`
      SELECT * FROM email_threads
      WHERE rfiId = ?
      ORDER BY receivedAt DESC
      LIMIT 10
    `).all(rfi.id) as any[];

    const daysOverdue = rfi.dueDate
      ? Math.max(0, Math.floor((now - new Date(rfi.dueDate).getTime()) / dayMs))
      : 0;

    const lastEmailDaysAgo = emails.length > 0
      ? Math.floor((now - new Date(emails[0].receivedAt).getTime()) / dayMs)
      : 999;

    // ── Rule 1: Broken Commitment ──────────────────────────────────────────
    const commitmentEmail = emails.find(e => e.hasCommitment && e.commitmentText);
    if (commitmentEmail && daysOverdue > 2) {
      const hasPositiveFollowup = emails.some(e =>
        e.sentiment === 'POSITIVE' &&
        new Date(e.receivedAt) > new Date(commitmentEmail.receivedAt)
      );

      if (!hasPositiveFollowup) {
        const riskScore = Math.min(100, 60 + daysOverdue * 3);
        alerts.push({
          id: `bc-rfi-${rfi.id}`,
          type: 'BROKEN_COMMITMENT',
          severity: riskScore >= 80 ? 'CRITICAL' : 'HIGH',
          riskScore,
          itemType: 'RFI',
          itemId: rfi.id,
          itemNumber: rfi.number,
          itemTitle: rfi.title,
          projectId: rfi.projectId,
          projectName: rfi.projectName || projectMap.get(rfi.projectId) || '',
          headline: `Compromiso no cumplido en ${rfi.number}`,
          evidence: `${commitmentEmail.senderName} se comprometió a responder. Han pasado ${daysOverdue} días sin seguimiento. RFI lleva ${daysOverdue} días vencido.`,
          procoreStatus: rfi.status,
          daysOverdue,
          emailSubject: commitmentEmail.subject,
          emailSender: commitmentEmail.senderName,
          commitmentText: commitmentEmail.commitmentText,
          emailReceivedAt: commitmentEmail.receivedAt,
          suggestedAction: `Escalar a ${commitmentEmail.senderName} — respuesta requerida hoy`,
          draftEmailPrompt: `Draft a firm follow-up email to ${commitmentEmail.senderName} about ${rfi.title}. They committed: "${commitmentEmail.commitmentText}". It's been ${daysOverdue} days overdue. Be professional but firm.`,
        });
      }
    }

    // ── Rule 2: Dangerous Silence ──────────────────────────────────────────
    if (daysOverdue > 5 && lastEmailDaysAgo > 7 && rfi.riskScore >= 50) {
      alerts.push({
        id: `ds-rfi-${rfi.id}`,
        type: 'DANGEROUS_SILENCE',
        severity: daysOverdue > 14 ? 'CRITICAL' : 'HIGH',
        riskScore: Math.min(100, 50 + daysOverdue * 2),
        itemType: 'RFI',
        itemId: rfi.id,
        itemNumber: rfi.number,
        itemTitle: rfi.title,
        projectId: rfi.projectId,
        projectName: rfi.projectName || projectMap.get(rfi.projectId) || '',
        headline: `${rfi.number}: ${daysOverdue} días sin ningún email — nadie está dando seguimiento`,
        evidence: `El RFI lleva ${daysOverdue} días vencido. Último email hace ${lastEmailDaysAgo > 500 ? 'más de 30' : lastEmailDaysAgo} días. ${rfi.ballInCourt ? `${rfi.ballInCourt} está en cancha (JAXI).` : 'Sin responsable asignado.'}`,
        procoreStatus: rfi.status,
        daysOverdue,
        emailSubject: emails[0]?.subject || null,
        emailSender: emails[0]?.senderName || null,
        commitmentText: null,
        emailReceivedAt: emails[0]?.receivedAt || null,
        suggestedAction: rfi.ballInCourt
          ? `Contactar a ${rfi.ballInCourt} — llevan ${daysOverdue} días en silencio`
          : `Asignar responsable y activar seguimiento inmediato`,
        draftEmailPrompt: `Draft an urgent follow-up email regarding ${rfi.title} (${rfi.number}). This RFI has been overdue for ${daysOverdue} days with no email activity in the last ${lastEmailDaysAgo} days. Request immediate response.`,
      });
    }

    // ── Rule 3: Platform Conflict ──────────────────────────────────────────
    const negativeEmails = emails.filter(e => e.sentiment === 'NEGATIVE' || e.sentiment === 'urgent');
    if (negativeEmails.length > 0 && (rfi.status === 'ANSWERED' || rfi.status === 'CLOSED')) {
      alerts.push({
        id: `pc-rfi-${rfi.id}`,
        type: 'PLATFORM_CONFLICT',
        severity: 'HIGH',
        riskScore: 75,
        itemType: 'RFI',
        itemId: rfi.id,
        itemNumber: rfi.number,
        itemTitle: rfi.title,
        projectId: rfi.projectId,
        projectName: rfi.projectName || projectMap.get(rfi.projectId) || '',
        headline: `Procore dice ${rfi.status} — pero el email muestra preocupaciones`,
        evidence: `${rfi.number} está marcado como ${rfi.status} en Procore. Sin embargo, ${negativeEmails[0].senderName} envió un email con tono negativo/urgente el ${new Date(negativeEmails[0].receivedAt).toLocaleDateString('es-MX')}.`,
        procoreStatus: rfi.status,
        daysOverdue,
        emailSubject: negativeEmails[0].subject,
        emailSender: negativeEmails[0].senderName,
        commitmentText: null,
        emailReceivedAt: negativeEmails[0].receivedAt,
        suggestedAction: 'Verificar si la respuesta de Procore resuelve las preocupaciones del email',
        draftEmailPrompt: `Draft a clarification email about ${rfi.title}. Procore shows it as ${rfi.status}, but ${negativeEmails[0].senderName} sent a concerning email. Politely ask for confirmation that the issue is truly resolved.`,
      });
    }
  }

  // ── Analyze each Submittal ─────────────────────────────────────────────────
  for (const sub of submittals) {
    const emails = db.prepare(`
      SELECT * FROM email_threads
      WHERE submittalId = ?
      ORDER BY receivedAt DESC
      LIMIT 10
    `).all(sub.id) as any[];

    const daysOverdue = sub.dueDate
      ? Math.max(0, Math.floor((now - new Date(sub.dueDate).getTime()) / dayMs))
      : 0;

    const lastEmailDaysAgo = emails.length > 0
      ? Math.floor((now - new Date(emails[0].receivedAt).getTime()) / dayMs)
      : 999;

    // ── Rule 1: Broken Commitment for Submittal ────────────────────────────
    const commitmentEmail = emails.find(e => e.hasCommitment && e.commitmentText);
    if (commitmentEmail && daysOverdue > 3) {
      const hasPositiveFollowup = emails.some(e =>
        e.sentiment === 'POSITIVE' &&
        new Date(e.receivedAt) > new Date(commitmentEmail.receivedAt)
      );
      if (!hasPositiveFollowup) {
        alerts.push({
          id: `bc-sub-${sub.id}`,
          type: 'BROKEN_COMMITMENT',
          severity: daysOverdue > 10 ? 'CRITICAL' : 'HIGH',
          riskScore: Math.min(100, 55 + daysOverdue * 3),
          itemType: 'SUBMITTAL',
          itemId: sub.id,
          itemNumber: sub.number,
          itemTitle: sub.title,
          projectId: sub.projectId,
          projectName: sub.projectName || projectMap.get(sub.projectId) || '',
          headline: `Submittal ${sub.number}: compromiso no cumplido`,
          evidence: `${commitmentEmail.senderName} se comprometió a resubmitir. La fecha límite fue hace ${daysOverdue} días. Submittal: ${sub.status}.`,
          procoreStatus: sub.status,
          daysOverdue,
          emailSubject: commitmentEmail.subject,
          emailSender: commitmentEmail.senderName,
          commitmentText: commitmentEmail.commitmentText,
          emailReceivedAt: commitmentEmail.receivedAt,
          suggestedAction: `Requerir resubmisión inmediata de ${sub.contractor || commitmentEmail.senderName}`,
          draftEmailPrompt: `Draft a follow-up email to ${sub.contractor || commitmentEmail.senderName} about submittal ${sub.number} - ${sub.title}. They committed to resubmit but it's been ${daysOverdue} days past due.`,
        });
      }
    }

    // ── Rule 2: Platform Conflict for Submittal ────────────────────────────
    const negEmail = emails.find(e => e.sentiment === 'NEGATIVE');
    if (negEmail && (sub.status === 'APPROVED' || sub.status === 'APPROVED_AS_NOTED')) {
      alerts.push({
        id: `pc-sub-${sub.id}`,
        type: 'PLATFORM_CONFLICT',
        severity: 'HIGH',
        riskScore: 72,
        itemType: 'SUBMITTAL',
        itemId: sub.id,
        itemNumber: sub.number,
        itemTitle: sub.title,
        projectId: sub.projectId,
        projectName: sub.projectName || projectMap.get(sub.projectId) || '',
        headline: `Procore dice APROBADO — el arquitecto tiene dudas en email`,
        evidence: `El submittal ${sub.number} fue marcado como ${sub.status} en Procore el ${sub.dueDate ? new Date(sub.dueDate).toLocaleDateString('es-MX') : 'N/A'}. ${negEmail.senderName} envió un email con objeciones.`,
        procoreStatus: sub.status,
        daysOverdue,
        emailSubject: negEmail.subject,
        emailSender: negEmail.senderName,
        commitmentText: null,
        emailReceivedAt: negEmail.receivedAt,
        suggestedAction: 'Revisar discrepancia — confirmar si la aprobación de Procore es válida',
        draftEmailPrompt: `Draft a clarification email about submittal ${sub.number} - ${sub.title}. Procore shows it as ${sub.status}, but ${negEmail.senderName} raised concerns via email. Ask for formal confirmation.`,
      });
    }

    // ── Rule 3: Dangerous Silence for Submittal ────────────────────────────
    if (daysOverdue > 7 && lastEmailDaysAgo > 10) {
      alerts.push({
        id: `ds-sub-${sub.id}`,
        type: 'DANGEROUS_SILENCE',
        severity: daysOverdue > 21 ? 'CRITICAL' : 'MEDIUM',
        riskScore: Math.min(100, 45 + daysOverdue * 2),
        itemType: 'SUBMITTAL',
        itemId: sub.id,
        itemNumber: sub.number,
        itemTitle: sub.title,
        projectId: sub.projectId,
        projectName: sub.projectName || projectMap.get(sub.projectId) || '',
        headline: `Submittal ${sub.number}: ${daysOverdue} días sin actividad en email`,
        evidence: `${sub.title} lleva ${daysOverdue} días vencido. Status Procore: ${sub.status}. Sin emails en ${lastEmailDaysAgo > 500 ? '+30' : lastEmailDaysAgo} días.`,
        procoreStatus: sub.status,
        daysOverdue,
        emailSubject: null,
        emailSender: sub.contractor || null,
        commitmentText: null,
        emailReceivedAt: null,
        suggestedAction: `Activar seguimiento con ${sub.contractor || 'el contratista'} inmediatamente`,
        draftEmailPrompt: `Draft an urgent follow-up email about submittal ${sub.number} - ${sub.title}. Status: ${sub.status}. ${daysOverdue} days overdue with no recent email activity.`,
      });
    }
  }

  // ── Sort by risk score descending ──────────────────────────────────────────
  return alerts.sort((a, b) => b.riskScore - a.riskScore).slice(0, 20);
}

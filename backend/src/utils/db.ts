/**
 * JAXI Intelligence — SQLite Database Helper
 * Uses better-sqlite3 directly (no Prisma engine download needed)
 */

import Database from 'better-sqlite3';
import path from 'path';
import crypto from 'crypto';

const DB_PATH = path.join(__dirname, '../../prisma/jaxi.db');

let _db: Database.Database | null = null;

export function getDb(): Database.Database {
  if (!_db) {
    _db = new Database(DB_PATH);
    _db.pragma('journal_mode = WAL');
    _db.pragma('foreign_keys = ON');
  }
  return _db;
}

// ── Typed helpers ────────────────────────────────────────

export function findUserByEmail(email: string): any {
  return getDb().prepare('SELECT * FROM users WHERE email = ?').get(email);
}

export function upsertUser(data: {
  email: string; name: string; microsoftId?: string; procoreId?: string;
}): any {
  const db = getDb();
  const existing = findUserByEmail(data.email);

  if (existing) {
    db.prepare(`
      UPDATE users SET name=?, microsoftId=COALESCE(?,microsoftId), procoreId=COALESCE(?,procoreId), lastLoginAt=CURRENT_TIMESTAMP, updatedAt=CURRENT_TIMESTAMP WHERE id=?
    `).run(data.name, data.microsoftId || null, data.procoreId || null, existing.id);
    return { ...existing, name: data.name };
  }

  const id = crypto.randomUUID();
  db.prepare(`
    INSERT INTO users (id, email, name, role, microsoftId, procoreId) VALUES (?,?,?,'PM',?,?)
  `).run(id, data.email, data.name, data.microsoftId || null, data.procoreId || null);
  return { id, ...data, role: 'PM' };
}

export function upsertOAuthToken(data: {
  userId: string; provider: string; accessToken: string;
  refreshToken?: string; expiresAt: Date; scope?: string;
}): void {
  const db = getDb();
  const existing = db.prepare('SELECT id FROM oauth_tokens WHERE userId=? AND provider=?').get(data.userId, data.provider);

  if (existing) {
    db.prepare(`
      UPDATE oauth_tokens SET accessToken=?, refreshToken=COALESCE(?,refreshToken), expiresAt=?, updatedAt=CURRENT_TIMESTAMP WHERE userId=? AND provider=?
    `).run(data.accessToken, data.refreshToken || null, data.expiresAt.toISOString(), data.userId, data.provider);
  } else {
    db.prepare(`
      INSERT INTO oauth_tokens (id, userId, provider, accessToken, refreshToken, expiresAt, scope) VALUES (?,?,?,?,?,?,?)
    `).run(
      crypto.randomUUID(), data.userId, data.provider,
      data.accessToken, data.refreshToken || null,
      data.expiresAt.toISOString(), data.scope || null
    );
  }
}

export function getOAuthToken(userId: string, provider: string): any {
  return getDb().prepare('SELECT * FROM oauth_tokens WHERE userId=? AND provider=?').get(userId, provider);
}

export function getTokensByUser(userId: string): any[] {
  return getDb().prepare('SELECT * FROM oauth_tokens WHERE userId=?').all(userId) as any[];
}

export function getUserById(id: string): any {
  return getDb().prepare('SELECT * FROM users WHERE id=?').get(id);
}

export function getRFIs(projectId?: string, limit = 200): any[] {
  if (projectId) {
    return getDb().prepare(
      "SELECT * FROM rfis WHERE projectId=? AND status NOT IN ('CLOSED','ANSWERED') ORDER BY riskScore DESC LIMIT ?"
    ).all(projectId, limit) as any[];
  }
  return getDb().prepare(
    "SELECT * FROM rfis WHERE status NOT IN ('CLOSED','ANSWERED') ORDER BY riskScore DESC LIMIT ?"
  ).all(limit) as any[];
}

export function getSubmittals(projectId?: string, limit = 300): any[] {
  if (projectId) {
    return getDb().prepare(
      "SELECT * FROM submittals WHERE projectId=? AND status NOT IN ('APPROVED') ORDER BY riskScore DESC LIMIT ?"
    ).all(projectId, limit) as any[];
  }
  return getDb().prepare(
    "SELECT * FROM submittals WHERE status NOT IN ('APPROVED') ORDER BY riskScore DESC LIMIT ?"
  ).all(limit) as any[];
}

export function getProjects(): any[] {
  return getDb().prepare("SELECT * FROM projects WHERE status='ACTIVE' ORDER BY name").all() as any[];
}

export function upsertRFI(data: Record<string, any>): void {
  const db = getDb();
  const existing = db.prepare('SELECT id FROM rfis WHERE id=?').get(data.id);
  if (existing) {
    db.prepare(`
      UPDATE rfis SET title=?,status=?,dueDate=?,answeredAt=?,riskScore=?,ballInCourt=?,updatedAt=CURRENT_TIMESTAMP WHERE id=?
    `).run(data.title, data.status, data.dueDate || null, data.answeredAt || null, data.riskScore || null, data.ballInCourt || null, data.id);
  } else {
    db.prepare(`
      INSERT INTO rfis (id,projectId,number,title,description,status,priority,dueDate,answeredAt,procoreId,procoreNum,riskScore,ballInCourt,createdById)
      VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?)
    `).run(
      data.id, data.projectId, data.number, data.title, data.description || '',
      data.status, data.priority || 'MEDIUM', data.dueDate || null, data.answeredAt || null,
      data.procoreId || null, data.procoreNum || null, data.riskScore || null,
      data.ballInCourt || null, data.createdById
    );
  }
}

export function upsertSubmittal(data: Record<string, any>): void {
  const db = getDb();
  const existing = db.prepare('SELECT id FROM submittals WHERE id=?').get(data.id);
  if (existing) {
    db.prepare(`
      UPDATE submittals SET title=?,status=?,dueDate=?,ballInCourt=?,riskScore=?,updatedAt=CURRENT_TIMESTAMP WHERE id=?
    `).run(data.title, data.status, data.dueDate || null, data.ballInCourt || null, data.riskScore || null, data.id);
  } else {
    db.prepare(`
      INSERT INTO submittals (id,projectId,number,title,description,status,priority,specSection,packageName,submittalType,contractor,ballInCourt,dueDate,procoreId,procoreNum,riskScore,createdById)
      VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)
    `).run(
      data.id, data.projectId, data.number, data.title, data.description || '',
      data.status, data.priority || 'MEDIUM', data.specSection || null,
      data.packageName || null, data.submittalType || null, data.contractor || null,
      data.ballInCourt || null, data.dueDate || null, data.procoreId || null,
      data.procoreNum || null, data.riskScore || null, data.createdById
    );
  }
}

export function upsertEmailThread(data: Record<string, any>): void {
  const db = getDb();
  const existing = db.prepare('SELECT id FROM email_threads WHERE outlookId=?').get(data.outlookId);
  if (existing) {
    db.prepare(`
      UPDATE email_threads SET rfiId=COALESCE(?,rfiId), submittalId=COALESCE(?,submittalId), hasCommitment=?, commitmentText=?, sentiment=? WHERE outlookId=?
    `).run(data.rfiId || null, data.submittalId || null, data.hasCommitment ? 1 : 0, data.commitmentText || null, data.sentiment || null, data.outlookId);
  } else {
    db.prepare(`
      INSERT INTO email_threads (id,projectId,rfiId,submittalId,outlookId,subject,senderEmail,senderName,receivedAt,hasCommitment,commitmentText,commitmentStatus,sentiment)
      VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?)
    `).run(
      crypto.randomUUID(), data.projectId, data.rfiId || null, data.submittalId || null,
      data.outlookId, data.subject, data.senderEmail, data.senderName || null,
      data.receivedAt, data.hasCommitment ? 1 : 0, data.commitmentText || null,
      data.hasCommitment ? 'DETECTED' : null, data.sentiment || null
    );
  }
}

export function logSync(projectId: string, source: string, status: string, itemsSynced: number, errors?: string): void {
  getDb().prepare(`
    INSERT INTO sync_logs (id,projectId,source,status,itemsSynced,errors) VALUES (?,?,?,?,?,?)
  `).run(crypto.randomUUID(), projectId, source, status, itemsSynced, errors || null);
}

export function getEmailsForRFI(rfiId: string): any[] {
  return getDb().prepare('SELECT * FROM email_threads WHERE rfiId=? ORDER BY receivedAt DESC LIMIT 5').all(rfiId) as any[];
}

export function getEmailsForSubmittal(submittalId: string): any[] {
  return getDb().prepare('SELECT * FROM email_threads WHERE submittalId=? ORDER BY receivedAt DESC LIMIT 3').all(submittalId) as any[];
}

export function getSystemUser(): any {
  return getDb().prepare("SELECT * FROM users WHERE email='system@jaxi.internal'").get();
}

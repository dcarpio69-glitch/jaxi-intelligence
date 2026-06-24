/**
 * JAXI Intelligence — Database Setup Script
 * Creates the SQLite database with all tables directly,
 * bypassing Prisma engine download issues.
 * Run: node setup-db.js
 */

const path = require('path');
const fs   = require('fs');

const DB_PATH = path.join(__dirname, 'prisma', 'jaxi.db');

// Try to use better-sqlite3 if available, otherwise use built-in sqlite
let Database;
try {
  Database = require('better-sqlite3');
  console.log('✓ Using better-sqlite3');
} catch (e) {
  console.log('better-sqlite3 not found, trying to install...');
  const { execSync } = require('child_process');
  try {
    execSync('npm install better-sqlite3 --save-dev', { stdio: 'inherit', cwd: __dirname });
    Database = require('better-sqlite3');
    console.log('✓ Installed and loaded better-sqlite3');
  } catch (e2) {
    console.error('❌ Could not install better-sqlite3:', e2.message);
    process.exit(1);
  }
}

console.log(`\n📦 Creating SQLite database at: ${DB_PATH}\n`);

const db = new Database(DB_PATH);

// Enable WAL mode for better performance
db.pragma('journal_mode = WAL');
db.pragma('foreign_keys = ON');

const schema = `
-- Users
CREATE TABLE IF NOT EXISTS users (
  id           TEXT PRIMARY KEY,
  email        TEXT UNIQUE NOT NULL,
  name         TEXT NOT NULL,
  role         TEXT NOT NULL DEFAULT 'PM',
  passwordHash TEXT,
  avatarUrl    TEXT,
  isActive     INTEGER NOT NULL DEFAULT 1,
  lastLoginAt  DATETIME,
  microsoftId  TEXT UNIQUE,
  procoreId    TEXT UNIQUE,
  createdAt    DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updatedAt    DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- Projects
CREATE TABLE IF NOT EXISTS projects (
  id          TEXT PRIMARY KEY,
  name        TEXT NOT NULL,
  code        TEXT UNIQUE NOT NULL,
  description TEXT,
  address     TEXT,
  city        TEXT,
  state       TEXT,
  status      TEXT NOT NULL DEFAULT 'ACTIVE',
  startDate   DATETIME,
  endDate     DATETIME,
  procoreId   TEXT,
  createdAt   DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updatedAt   DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- Project Members
CREATE TABLE IF NOT EXISTS project_members (
  id        TEXT PRIMARY KEY,
  projectId TEXT NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  userId    TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  role      TEXT NOT NULL,
  joinedAt  DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(projectId, userId)
);

-- RFIs
CREATE TABLE IF NOT EXISTS rfis (
  id                TEXT PRIMARY KEY,
  projectId         TEXT NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  number            TEXT NOT NULL,
  title             TEXT NOT NULL,
  description       TEXT NOT NULL DEFAULT '',
  status            TEXT NOT NULL DEFAULT 'OPEN',
  priority          TEXT NOT NULL DEFAULT 'MEDIUM',
  discipline        TEXT,
  dueDate           DATETIME,
  answeredAt        DATETIME,
  procoreId         TEXT,
  procoreNum        INTEGER,
  riskScore         INTEGER,
  ballInCourt       TEXT,
  ballInCourtCompany TEXT,
  createdById       TEXT NOT NULL REFERENCES users(id),
  assignedToId      TEXT REFERENCES users(id),
  createdAt         DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updatedAt         DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX IF NOT EXISTS idx_rfis_project ON rfis(projectId);
CREATE INDEX IF NOT EXISTS idx_rfis_status  ON rfis(status);

-- Submittals
CREATE TABLE IF NOT EXISTS submittals (
  id               TEXT PRIMARY KEY,
  projectId        TEXT NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  number           TEXT NOT NULL,
  title            TEXT NOT NULL,
  description      TEXT DEFAULT '',
  status           TEXT NOT NULL DEFAULT 'SUBMITTED',
  priority         TEXT NOT NULL DEFAULT 'MEDIUM',
  discipline       TEXT,
  specSection      TEXT,
  packageName      TEXT,
  submittalType    TEXT,
  contractor       TEXT,
  ballInCourt      TEXT,
  ballInCourtCompany TEXT,
  dueDate          DATETIME,
  reviewedAt       DATETIME,
  procoreId        TEXT,
  procoreNum       TEXT,
  riskScore        INTEGER,
  currentVersion   INTEGER NOT NULL DEFAULT 1,
  createdById      TEXT NOT NULL REFERENCES users(id),
  createdAt        DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updatedAt        DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX IF NOT EXISTS idx_submittals_project ON submittals(projectId);
CREATE INDEX IF NOT EXISTS idx_submittals_status  ON submittals(status);

-- Submittal Versions
CREATE TABLE IF NOT EXISTS submittal_versions (
  id          TEXT PRIMARY KEY,
  submittalId TEXT NOT NULL REFERENCES submittals(id) ON DELETE CASCADE,
  version     INTEGER NOT NULL,
  fileUrl     TEXT NOT NULL,
  fileName    TEXT NOT NULL,
  fileSize    INTEGER NOT NULL,
  uploadedAt  DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- Reviews
CREATE TABLE IF NOT EXISTS reviews (
  id          TEXT PRIMARY KEY,
  submittalId TEXT NOT NULL REFERENCES submittals(id) ON DELETE CASCADE,
  reviewerId  TEXT NOT NULL REFERENCES users(id),
  action      TEXT NOT NULL,
  comment     TEXT,
  reviewedAt  DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- Comments
CREATE TABLE IF NOT EXISTS comments (
  id          TEXT PRIMARY KEY,
  content     TEXT NOT NULL,
  authorId    TEXT NOT NULL REFERENCES users(id),
  rfiId       TEXT REFERENCES rfis(id) ON DELETE CASCADE,
  submittalId TEXT REFERENCES submittals(id) ON DELETE CASCADE,
  createdAt   DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updatedAt   DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- Status History
CREATE TABLE IF NOT EXISTS status_history (
  id          TEXT PRIMARY KEY,
  rfiId       TEXT REFERENCES rfis(id) ON DELETE CASCADE,
  submittalId TEXT REFERENCES submittals(id) ON DELETE CASCADE,
  fromStatus  TEXT NOT NULL,
  toStatus    TEXT NOT NULL,
  changedById TEXT,
  note        TEXT,
  changedAt   DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- Email Threads
CREATE TABLE IF NOT EXISTS email_threads (
  id               TEXT PRIMARY KEY,
  projectId        TEXT NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  rfiId            TEXT REFERENCES rfis(id),
  submittalId      TEXT REFERENCES submittals(id),
  outlookId        TEXT UNIQUE NOT NULL,
  subject          TEXT NOT NULL,
  senderEmail      TEXT NOT NULL,
  senderName       TEXT,
  receivedAt       DATETIME NOT NULL,
  hasCommitment    INTEGER NOT NULL DEFAULT 0,
  commitmentDate   DATETIME,
  commitmentText   TEXT,
  commitmentStatus TEXT,
  sentiment        TEXT,
  createdAt        DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX IF NOT EXISTS idx_email_project    ON email_threads(projectId);
CREATE INDEX IF NOT EXISTS idx_email_commitment ON email_threads(hasCommitment);

-- OAuth Tokens
CREATE TABLE IF NOT EXISTS oauth_tokens (
  id           TEXT PRIMARY KEY,
  userId       TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  provider     TEXT NOT NULL,
  accessToken  TEXT NOT NULL,
  refreshToken TEXT,
  expiresAt    DATETIME NOT NULL,
  scope        TEXT,
  createdAt    DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updatedAt    DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(userId, provider)
);

-- Sync Logs
CREATE TABLE IF NOT EXISTS sync_logs (
  id          TEXT PRIMARY KEY,
  projectId   TEXT NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  source      TEXT NOT NULL,
  status      TEXT NOT NULL,
  itemsSynced INTEGER NOT NULL DEFAULT 0,
  errors      TEXT,
  duration    INTEGER,
  syncedAt    DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- Audit Events
CREATE TABLE IF NOT EXISTS audit_events (
  id         TEXT PRIMARY KEY,
  userId     TEXT REFERENCES users(id),
  action     TEXT NOT NULL,
  resource   TEXT NOT NULL,
  resourceId TEXT,
  metadata   TEXT,
  ipAddress  TEXT,
  userAgent  TEXT,
  createdAt  DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);
`;

try {
  db.exec(schema);
  console.log('✅ All tables created successfully!');

  // Seed a system user
  const crypto = require('crypto');
  const sysId = crypto.randomUUID();
  db.prepare(`
    INSERT OR IGNORE INTO users (id, email, name, role)
    VALUES (?, 'system@jaxi.internal', 'JAXI System', 'ADMIN')
  `).run(sysId);

  // Count tables
  const tables = db.prepare(`SELECT name FROM sqlite_master WHERE type='table'`).all();
  console.log(`\n📊 Tables created: ${tables.map(t => t.name).join(', ')}`);
  console.log(`\n🎉 Database ready at: ${DB_PATH}`);
  console.log('\n📌 Next steps:');
  console.log('  1. Fill in your credentials in backend/.env');
  console.log('  2. Start the backend: npm run dev (in the backend folder)');
  console.log('  3. Click "⚙️ Conectar" in the dashboard to link Procore + Outlook\n');
} catch (err) {
  console.error('❌ Error creating tables:', err.message);
  process.exit(1);
} finally {
  db.close();
}

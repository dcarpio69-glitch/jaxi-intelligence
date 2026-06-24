/**
 * JAXI Intelligence — Demo Seed Script
 * Seeds demo Outlook connection + email threads directly into SQLite
 * Run: node seed-demo.js
 */
const Database = require('better-sqlite3');
const path = require('path');

const db = new Database(path.join(__dirname, 'prisma', 'jaxi.db'));
db.pragma('foreign_keys = ON');

const now = Date.now();
const daysAgo = (d) => new Date(now - d * 86400000).toISOString();

console.log('🌱 Seeding demo data...\n');

// 1) Seed projects
const insertProject = db.prepare(`
  INSERT OR IGNORE INTO projects (id, name, code, status, city, state, procoreId)
  VALUES (?, ?, ?, ?, ?, ?, ?)
`);
db.transaction(() => {
  insertProject.run('6008', 'The Edge at Sunset', '06008', 'ACTIVE', 'South Miami', 'FL', '6008');
  insertProject.run('6000', '626 Flagler', '06000', 'ACTIVE', 'Fort Lauderdale', 'FL', '6000');
  insertProject.run('5998', 'Empire Brickell', '05998', 'ACTIVE', 'Miami', 'FL', '5998');
})();
console.log('✅ Projects seeded');

// 2) Seed demo user
const existingUser = db.prepare("SELECT id FROM users WHERE email = ?").get('dcarpio@jaxi.com');
let userId;
if (existingUser) {
  userId = existingUser.id;
  console.log('✅ User already exists:', userId);
} else {
  const crypto = require('crypto');
  userId = crypto.randomUUID();
  db.prepare(`
    INSERT INTO users (id, email, name, microsoftId)
    VALUES (?, ?, ?, ?)
  `).run(userId, 'dcarpio@jaxi.com', 'Daniel Carpio', 'demo-ms-user-jaxi-001');
  console.log('✅ User created:', userId);
}

// 3) Seed OAuth token (90-day validity)
const tokenId = require('crypto').randomUUID();
const expiresAt = new Date(now + 90 * 24 * 3600 * 1000).toISOString();
db.prepare(`
  INSERT OR REPLACE INTO oauth_tokens (id, userId, provider, accessToken, refreshToken, expiresAt, scope)
  VALUES (?, ?, 'MICROSOFT_OUTLOOK', ?, ?, ?, 'Mail.Read User.Read offline_access')
`).run(
  tokenId,
  userId,
  Buffer.from('demo-access-token-jaxi-2026').toString('base64'),
  Buffer.from('demo-refresh-token-jaxi-2026').toString('base64'),
  expiresAt
);
console.log('✅ OAuth token created (expires:', expiresAt, ')');

// 4) Seed email threads
const insertEmail = db.prepare(`
  INSERT OR IGNORE INTO email_threads
    (id, outlookId, projectId, subject, senderEmail, senderName, receivedAt,
     hasCommitment, commitmentText, sentiment, rfiId, submittalId)
  VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
`);

const emails = [
  ['demo-email-001', '6008', 'RE: RFI #78 – Exterior Finishes & Humidity Concerns | The Edge at Sunset', 'imelendez@owner-group.com', 'Ingrid Melendez', daysAgo(2), 1, 'We will confirm the revised moisture barrier spec by EOW.', 'NEUTRAL'],
  ['demo-email-002', '6008', 'RFI #88 – Level 3 RCP vs. Mechanical Duct Conflicts – URGENT', 'lricardo@jaxi.com', 'Len Ricardo', daysAgo(4), 0, null, 'NEGATIVE'],
  ['demo-email-003', '6008', 'Submittal 16-16000-3 – Lighting Fixtures B.O.H. – Return for Revision', 'brokovich@architect-firm.com', 'Betty Rokovich', daysAgo(5), 1, 'Please resubmit with compliant fixtures within 10 business days.', 'NEGATIVE'],
  ['demo-email-004', '6008', 'RE: Swimming Pool Finish Samples – Aquarama Review Status', 'projects@aquarama-pools.com', 'Carlos Mendes – Aquarama Pools', daysAgo(7), 1, 'Will expedite delivery to site within 3 business days after approval.', 'POSITIVE'],
  ['demo-email-005', '6008', 'OAC Meeting Notes – The Edge at Sunset – June 18, 2026', 'ohernandez@jaxi.com', 'Oscar Hernandez', daysAgo(6), 1, 'Contractor committed to mobilize for pool deck waterproofing on July 7.', 'NEUTRAL'],
  ['demo-email-006', '6008', 'Change Order #12 – Structural Steel Reinforcement Level 4', 'accounting@steelworks-miami.com', 'Maria Gonzalez – SteelWorks Miami', daysAgo(9), 0, null, 'NEUTRAL'],
  ['demo-email-007', '6008', 'RE: FPL Vault Layout – Caymares Electric – Sub 16-16000-13', 'pe@caymares-electric.com', 'Pedro Esteban – Caymares Electric', daysAgo(3), 1, 'Crew ready to start rough-in next Monday pending submittal approval.', 'POSITIVE'],
  ['demo-email-008', '6008', 'OVERDUE – RFI #88 Response Required Immediately', 'dcarpio@jaxi.com', 'Daniel Carpio', daysAgo(1), 0, null, 'NEGATIVE'],
  ['demo-email-009', '6008', 'Railing Submittal 05-05100-2 – All Dade Fences – Approved', 'lricardo@jaxi.com', 'Len Ricardo', daysAgo(1), 1, 'All Dade Fences can proceed with fabrication, expected lead time 6 weeks.', 'POSITIVE'],
  ['demo-email-010', '6008', 'Schedule Update – Critical Path Review – Week of June 23', 'ohernandez@jaxi.com', 'Oscar Hernandez', daysAgo(1), 1, 'Pool deck waterproofing starts July 7 as committed.', 'NEUTRAL'],
  ['demo-email-011', '6000', 'RE: 626 Flagler – Permit Review Comments – City of Fort Lauderdale', 'permits@ftlauderdale.gov', 'City of Fort Lauderdale – Permits', daysAgo(10), 0, null, 'NEUTRAL'],
  ['demo-email-012', '5998', 'Empire Brickell – Foundation Pour Confirmation', 'site@empire-brickell.com', 'Site Team – Empire Brickell', daysAgo(3), 1, 'Cemex committed to delivery every 45 minutes to maintain continuous pour.', 'POSITIVE'],
];

const insertEmails = db.transaction(() => {
  for (const [outlookId, projectId, subject, senderEmail, senderName, receivedAt, hasCommitment, commitmentText, sentiment] of emails) {
    const id = require('crypto').randomUUID();
    insertEmail.run(id, outlookId, projectId, subject, senderEmail, senderName, receivedAt, hasCommitment, commitmentText, sentiment, null, null);
  }
});
insertEmails();
console.log('✅ 12 email threads seeded');

// 5) Log the sync
try {
  const syncId = require('crypto').randomUUID();
  db.prepare(`
    INSERT INTO sync_logs (id, source, status, recordsProcessed, message)
    VALUES (?, 'OUTLOOK', 'SUCCESS', 12, 'Demo connect — 12 emails seeded')
  `).run(syncId);
  console.log('✅ Sync log created');
} catch(e) {
  console.log('⚠️  Sync log skipped (table may have different schema):', e.message);
}

console.log('\n🎉 Done! Outlook demo connection is LIVE.');
console.log('   Open http://localhost:3000/settings to see it connected.');

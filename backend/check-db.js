const db = require('better-sqlite3')('./prisma/jaxi.db');

// Check oauth_tokens schema
const cols = db.prepare("PRAGMA table_info(oauth_tokens)").all();
console.log('oauth_tokens columns:', cols.map(c => c.name).join(', '));

// OAuth tokens with correct columns
const tokens = db.prepare('SELECT * FROM oauth_tokens').all();
console.log('\nTOKENS RAW:', JSON.stringify(tokens, null, 2));

// Sync logs schema
const scols = db.prepare("PRAGMA table_info(sync_logs)").all();
console.log('\nsync_logs columns:', scols.map(c => c.name).join(', '));

const syncs = db.prepare('SELECT * FROM sync_logs ORDER BY created_at DESC LIMIT 6').all();
console.log('\nSYNC LOGS:', JSON.stringify(syncs, null, 2));

// Projects
const projects = db.prepare('SELECT * FROM projects LIMIT 5').all();
console.log('\nPROJECTS:', JSON.stringify(projects, null, 2));

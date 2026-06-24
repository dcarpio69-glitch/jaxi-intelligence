const db = require('better-sqlite3')('./prisma/jaxi.db');

// Remove the FAKE demo Outlook token so the UI shows "Not Connected" and forces real login
const del = db.prepare("DELETE FROM oauth_tokens WHERE provider = 'MICROSOFT_OUTLOOK'");
const result = del.run();
console.log(`Deleted ${result.changes} demo Outlook token(s)`);

// Also remove expired Procore token (will force re-auth)
const delP = db.prepare("DELETE FROM oauth_tokens WHERE provider = 'PROCORE'");
const resultP = delP.run();
console.log(`Deleted ${resultP.changes} Procore token(s) (expired, will re-auth)`);

// Confirm
const remaining = db.prepare("SELECT provider, expiresAt FROM oauth_tokens").all();
console.log('Remaining tokens:', remaining);

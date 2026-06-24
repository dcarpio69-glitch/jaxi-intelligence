/**
 * JAXI Intelligence — Database Config
 * Uses better-sqlite3 directly (no Prisma engine required)
 */
import { getDb } from '../utils/db';
import { logger } from '../utils/logger';

// Re-export getDb as the primary DB accessor
export { getDb };

export async function connectDatabase(): Promise<void> {
  try {
    // Verify DB file is accessible by running a simple query
    const db = getDb();
    db.prepare('SELECT 1').get();
    logger.info('✅ SQLite database connected (jaxi.db)');
  } catch (err) {
    logger.error('❌ Database connection failed', err);
    process.exit(1);
  }
}

export async function disconnectDatabase(): Promise<void> {
  logger.info('Database disconnected');
}

// Legacy prisma export — stub to prevent crashes in routes that import it
// These routes should be migrated to use getDb() from utils/db
export const prisma = {
  $connect:    async () => {},
  $disconnect: async () => {},
  $on:         (_event: string, _cb: any) => {},
};

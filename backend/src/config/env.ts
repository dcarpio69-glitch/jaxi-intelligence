import dotenv from 'dotenv';
dotenv.config();

function requireEnv(key: string): string {
  const val = process.env[key];
  if (!val) throw new Error(`Missing required environment variable: ${key}`);
  return val;
}

export const config = {
  // Server
  NODE_ENV: process.env.NODE_ENV || 'development',
  PORT: parseInt(process.env.PORT || '3001', 10),
  ALLOWED_ORIGINS: process.env.ALLOWED_ORIGINS || 'http://localhost:3000',

  // Database (SQLite — path is hardcoded in utils/db.ts)
  DATABASE_URL: process.env.DATABASE_URL || 'file:./prisma/jaxi.db',

  // Redis
  REDIS_URL: process.env.REDIS_URL || 'redis://localhost:6379',

  // JWT
  JWT_SECRET: process.env.JWT_SECRET || 'jaxi-dev-secret-key-min-32-chars-2024',
  JWT_EXPIRES_IN: process.env.JWT_EXPIRES_IN || '15m',
  JWT_REFRESH_EXPIRES_IN: process.env.JWT_REFRESH_EXPIRES_IN || '7d',

  // Microsoft Graph (Outlook)
  MICROSOFT_CLIENT_ID: process.env.MICROSOFT_CLIENT_ID || '',
  MICROSOFT_CLIENT_SECRET: process.env.MICROSOFT_CLIENT_SECRET || '',
  MICROSOFT_TENANT_ID: process.env.MICROSOFT_TENANT_ID || 'common',
  MICROSOFT_REDIRECT_URI: process.env.MICROSOFT_REDIRECT_URI || 'http://localhost:3001/api/v1/integrations/outlook/callback',

  // Procore
  PROCORE_CLIENT_ID: process.env.PROCORE_CLIENT_ID || '',
  PROCORE_CLIENT_SECRET: process.env.PROCORE_CLIENT_SECRET || '',
  PROCORE_REDIRECT_URI: process.env.PROCORE_REDIRECT_URI || 'http://localhost:3001/api/v1/integrations/procore/callback',
  PROCORE_WEBHOOK_SECRET: process.env.PROCORE_WEBHOOK_SECRET || '',

  // AI (Gemini)
  GEMINI_API_KEY: process.env.GEMINI_API_KEY || '',
  GEMINI_MODEL: process.env.GEMINI_MODEL || 'gemini-1.5-pro',

  // Storage (Cloudflare R2 / AWS S3 compatible)
  STORAGE_ENDPOINT: process.env.STORAGE_ENDPOINT || '',
  STORAGE_BUCKET: process.env.STORAGE_BUCKET || 'jaxi-files',
  STORAGE_ACCESS_KEY: process.env.STORAGE_ACCESS_KEY || '',
  STORAGE_SECRET_KEY: process.env.STORAGE_SECRET_KEY || '',

  // Email (SendGrid)
  SENDGRID_API_KEY: process.env.SENDGRID_API_KEY || '',
  EMAIL_FROM: process.env.EMAIL_FROM || 'noreply@jaxibuilders.com',

  // Encryption
  ENCRYPTION_KEY: process.env.ENCRYPTION_KEY || 'jaxi-encrypt-key-32-chars-2024!!',

  // App
  FRONTEND_URL: process.env.FRONTEND_URL || 'http://localhost:3000',
} as const;

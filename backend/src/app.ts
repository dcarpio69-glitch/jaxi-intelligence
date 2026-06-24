// ─────────────────────────────────────────────────────────
// JAXI Intelligence — Backend Entry Point
// BIMVDC CORE · JAXI Builders, Inc.
// ─────────────────────────────────────────────────────────
import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import compression from 'compression';
import rateLimit from 'express-rate-limit';
import { config } from './config/env';
import { logger } from './utils/logger';
import { errorHandler } from './middleware/errorHandler';
import { notFound } from './middleware/notFound';

// Routes
import authRoutes from './routes/auth';
import userRoutes from './routes/users';
import projectRoutes from './routes/projects';
import rfiRoutes from './routes/rfis';
import submittalRoutes from './routes/submittals';
import aiRoutes from './routes/ai';
import integrationRoutes from './routes/integrations';
import reportRoutes from './routes/reports';
import dataRoutes from './routes/data';

const app = express();

// ─── Security Middleware ─────────────────────────────────
app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      styleSrc: ["'self'", "'unsafe-inline'"],
      scriptSrc: ["'self'"],
      imgSrc: ["'self'", 'data:', 'https:'],
    },
  },
  hsts: { maxAge: 31536000, includeSubDomains: true },
}));

app.use(cors({
  origin: config.ALLOWED_ORIGINS.split(','),
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH'],
  allowedHeaders: ['Content-Type', 'Authorization'],
}));

// Global rate limiter
const globalLimiter = rateLimit({
  windowMs: 60 * 1000,        // 1 minute
  max: 100,                    // 100 requests/min/IP
  message: { error: 'Too many requests, please try again later.' },
  standardHeaders: true,
  legacyHeaders: false,
});
app.use(globalLimiter);

// ─── General Middleware ──────────────────────────────────
app.use(compression());
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));
app.use(morgan('combined', {
  stream: { write: (message) => logger.http(message.trim()) },
}));

// ─── Health Check ────────────────────────────────────────
app.get('/health', (_req, res) => {
  res.json({
    status: 'ok',
    service: 'jaxi-intelligence-api',
    timestamp: new Date().toISOString(),
    version: process.env.npm_package_version || '1.0.0',
  });
});

// ─── API Routes ──────────────────────────────────────────
const API_V1 = '/api/v1';

app.use(`${API_V1}/auth`, authRoutes);
app.use(`${API_V1}/users`, userRoutes);
app.use(`${API_V1}/projects`, projectRoutes);
app.use(`${API_V1}/rfis`, rfiRoutes);
app.use(`${API_V1}/submittals`, submittalRoutes);
app.use(`${API_V1}/ai`, aiRoutes);
app.use(`${API_V1}/integrations`, integrationRoutes);
app.use(`${API_V1}/reports`, reportRoutes);
app.use(`${API_V1}/data`, dataRoutes);   // Dashboard data API (live + demo fallback)

// ─── Error Handling ──────────────────────────────────────
app.use(notFound);
app.use(errorHandler);

// ─── Start Server ────────────────────────────────────────
const PORT = config.PORT || 3001;
app.listen(PORT, () => {
  logger.info(`🚀 JAXI Intelligence API running on port ${PORT}`);
  logger.info(`🌍 Environment: ${config.NODE_ENV}`);
  logger.info(`📊 API Base: http://localhost:${PORT}${API_V1}`);

  // ─── Periodic Sync Job (every 30 minutes) ────────────────
  startPeriodicSync();
});

async function startPeriodicSync() {
  const { triggerProcoreSync, triggerOutlookSync } = await import('./routes/integrations');
  const { getDb } = await import('./utils/db');

  const runSync = async () => {
    const db = getDb();

    const procoreToken = db.prepare(
      "SELECT userId FROM oauth_tokens WHERE provider='PROCORE' ORDER BY updatedAt DESC LIMIT 1"
    ).get() as any;

    const outlookToken = db.prepare(
      "SELECT userId FROM oauth_tokens WHERE provider='MICROSOFT_OUTLOOK' ORDER BY updatedAt DESC LIMIT 1"
    ).get() as any;

    if (procoreToken) {
      logger.info('[Sync] Running scheduled Procore sync...');
      await triggerProcoreSync(procoreToken.userId).catch(e =>
        logger.error('[Sync] Procore scheduled sync failed: ' + e.message)
      );
    }

    if (outlookToken && !procoreToken) {
      // If only Outlook is connected (no Procore), still sync emails
      logger.info('[Sync] Running scheduled Outlook-only sync...');
      await triggerOutlookSync(outlookToken.userId).catch(e =>
        logger.error('[Sync] Outlook scheduled sync failed: ' + e.message)
      );
    }

    if (!procoreToken && !outlookToken) {
      logger.info('[Sync] No integrations connected — skipping scheduled sync');
    }
  };

  // Run immediately on startup (5 second delay for DB to be ready)
  setTimeout(runSync, 5000);

  // Then every 30 minutes
  setInterval(runSync, 30 * 60 * 1000);
  logger.info('[Sync] Periodic sync job started — runs every 30 minutes');
}

export default app;

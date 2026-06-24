/**
 * JAXI Intelligence — Users Route (stub)
 * Full implementation pending migration to better-sqlite3
 */
import { Router } from 'express';
const router = Router();
router.get('/', (_req, res) => res.json({ users: [] }));
router.get('/me', (_req, res) => res.json({ user: null }));
export default router;

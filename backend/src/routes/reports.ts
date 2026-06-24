/**
 * JAXI Intelligence — Reports Route (stub)
 */
import { Router } from 'express';
const router = Router();
router.get('/', (_req, res) => res.json({ reports: [] }));
export default router;

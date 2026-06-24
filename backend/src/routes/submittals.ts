/**
 * JAXI Intelligence — Submittals Route (stub)
 * Dashboard uses /api/v1/data/submittals instead.
 */
import { Router } from 'express';
const router = Router();
router.get('/', (_req, res) => res.json({ submittals: [] }));
router.get('/:id', (req, res) => res.json({ submittal: { id: req.params.id } }));
export default router;

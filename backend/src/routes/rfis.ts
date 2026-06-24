/**
 * JAXI Intelligence — RFIs Route (stub)
 * Dashboard uses /api/v1/data/rfis instead.
 */
import { Router } from 'express';
const router = Router();
router.get('/', (_req, res) => res.json({ rfis: [] }));
router.get('/:id', (req, res) => res.json({ rfi: { id: req.params.id } }));
export default router;

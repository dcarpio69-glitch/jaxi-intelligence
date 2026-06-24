/**
 * JAXI Intelligence — Projects Route (stub)
 * Full implementation pending migration to better-sqlite3
 */
import { Router } from 'express';
const router = Router();
router.get('/', (_req, res) => res.json({ projects: [] }));
router.get('/:id', (req, res) => res.json({ project: { id: req.params.id } }));
export default router;

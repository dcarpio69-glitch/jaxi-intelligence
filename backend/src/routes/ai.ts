/**
 * JAXI Intelligence — AI Route (stub)
 */
import { Router } from 'express';
const router = Router();
router.post('/analyze', (_req, res) => res.json({ analysis: 'AI analysis not yet configured. Add GEMINI_API_KEY to .env.' }));
export default router;

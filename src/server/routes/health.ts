import { Router, Request, Response } from 'express';

const router = Router();

/**
 * GET /health
 * Health check endpoint for monitoring and load balancers
 */
router.get('/', (_req: Request, res: Response) => {
  res.json({ ok: true });
});

export default router;

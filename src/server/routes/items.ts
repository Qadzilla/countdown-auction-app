import { Router, Request, Response } from 'express';
import { CreateItemInput } from '../../domain/types.js';
import { createItem, getAllItems, getItemById } from '../../domain/store.js';

const router = Router();

/**
 * POST /api/items
 * Create a new auction item
 */
router.post('/', (req: Request, res: Response) => {
  const input = req.body as CreateItemInput;

  // Basic validation
  if (!input.title || typeof input.title !== 'string') {
    res.status(400).json({ error: 'title is required' });
    return;
  }
  if (!input.endsAt || typeof input.endsAt !== 'string') {
    res.status(400).json({ error: 'endsAt is required' });
    return;
  }
  if (typeof input.startingPrice !== 'number' || input.startingPrice < 0) {
    res.status(400).json({ error: 'startingPrice must be a non-negative number' });
    return;
  }

  // Validate endsAt is a valid future date
  const endsAtDate = new Date(input.endsAt);
  if (isNaN(endsAtDate.getTime())) {
    res.status(400).json({ error: 'endsAt must be a valid ISO date string' });
    return;
  }
  if (endsAtDate <= new Date()) {
    res.status(400).json({ error: 'endsAt must be in the future' });
    return;
  }

  const item = createItem({
    title: input.title,
    description: input.description || '',
    startingPrice: input.startingPrice,
    endsAt: input.endsAt,
  });

  res.status(201).json(item);
});

/**
 * GET /api/items
 * Get all auction items
 */
router.get('/', (_req: Request, res: Response) => {
  const items = getAllItems();
  res.json(items);
});

/**
 * GET /api/items/:id
 * Get a single auction item by ID
 */
router.get('/:id', (req: Request<{ id: string }>, res: Response) => {
  const item = getItemById(req.params.id);

  if (!item) {
    res.status(404).json({ error: 'Item not found' });
    return;
  }

  res.json(item);
});

export default router;

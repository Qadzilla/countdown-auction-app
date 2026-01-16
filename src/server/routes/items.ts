import { Router, Request, Response } from 'express';
import { CreateItemInput, PlaceBidInput, Item } from '../../domain/types.js';
import { createItem, getAllItems, getItemById, updateItemStatus, placeBid } from '../../domain/store.js';
import { isExpired, Clock, realClock } from '../../domain/time.js';

const router = Router();

// Clock instance (can be replaced for testing)
let clock: Clock = realClock;

/**
 * Set the clock instance (for testing)
 */
export function setClock(newClock: Clock): void {
  clock = newClock;
}

/**
 * Reset to real clock
 */
export function resetClock(): void {
  clock = realClock;
}

/**
 * Check and update item expiration status
 */
function checkExpiration(item: Item): Item {
  if (item.status === 'active' && isExpired(item.endsAt, clock)) {
    updateItemStatus(item.id, 'closed');
    item.status = 'closed';
  }
  return item;
}

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
 * Get all auction items (checks expiration on each item)
 */
router.get('/', (_req: Request, res: Response) => {
  const items = getAllItems().map(checkExpiration);
  res.json(items);
});

/**
 * GET /api/items/:id
 * Get a single auction item by ID (checks expiration)
 */
router.get('/:id', (req: Request<{ id: string }>, res: Response) => {
  const item = getItemById(req.params.id);

  if (!item) {
    res.status(404).json({ error: 'Item not found' });
    return;
  }

  res.json(checkExpiration(item));
});

/**
 * POST /api/items/:id/bid
 * Place a bid on an auction item
 */
router.post('/:id/bid', (req: Request<{ id: string }>, res: Response) => {
  const input = req.body as PlaceBidInput;

  // Validate input
  if (typeof input.amount !== 'number' || input.amount <= 0) {
    res.status(400).json({ error: 'amount must be a positive number' });
    return;
  }
  if (!input.bidderId || typeof input.bidderId !== 'string') {
    res.status(400).json({ error: 'bidderId is required' });
    return;
  }

  // Get and check item
  const item = getItemById(req.params.id);
  if (!item) {
    res.status(404).json({ error: 'Item not found' });
    return;
  }

  // Check expiration first
  checkExpiration(item);

  // Reject bid if item is closed
  if (item.status === 'closed') {
    res.status(400).json({ error: 'Auction has ended' });
    return;
  }

  // Validate bid amount
  const minBid = item.currentBid ?? item.startingPrice;
  if (input.amount <= minBid) {
    res.status(400).json({
      error: `Bid must be greater than ${minBid}`,
      minimumBid: minBid
    });
    return;
  }

  // Place the bid
  const updatedItem = placeBid(req.params.id, input.amount);
  if (!updatedItem) {
    res.status(400).json({ error: 'Failed to place bid' });
    return;
  }

  res.json(updatedItem);
});

export default router;

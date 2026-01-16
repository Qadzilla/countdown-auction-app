import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import request from 'supertest';
import app from '../../src/server/app.js';
import { clearItems } from '../../src/domain/store.js';
import { setClock, resetClock } from '../../src/server/routes/items.js';
import { createFakeClock } from '../../src/domain/time.js';

describe('Items API', () => {
  // Clear store and reset clock before each test
  beforeEach(() => {
    clearItems();
    resetClock();
  });

  afterEach(() => {
    resetClock();
  });

  describe('POST /api/items', () => {
    it('creates a new item with valid input', async () => {
      const futureDate = new Date(Date.now() + 3600000).toISOString(); // 1 hour from now

      const response = await request(app)
        .post('/api/items')
        .send({
          title: 'Test Item',
          description: 'A test auction item',
          startingPrice: 100,
          endsAt: futureDate,
        });

      expect(response.status).toBe(201);
      expect(response.body).toMatchObject({
        id: '1',
        title: 'Test Item',
        description: 'A test auction item',
        startingPrice: 100,
        status: 'active',
      });
      expect(response.body.endsAt).toBeDefined();
      expect(response.body.createdAt).toBeDefined();
    });

    it('returns 400 if title is missing', async () => {
      const response = await request(app)
        .post('/api/items')
        .send({
          startingPrice: 100,
          endsAt: new Date(Date.now() + 3600000).toISOString(),
        });

      expect(response.status).toBe(400);
      expect(response.body.error).toBe('title is required');
    });

    it('returns 400 if endsAt is missing', async () => {
      const response = await request(app)
        .post('/api/items')
        .send({
          title: 'Test',
          startingPrice: 100,
        });

      expect(response.status).toBe(400);
      expect(response.body.error).toBe('endsAt is required');
    });

    it('returns 400 if startingPrice is invalid', async () => {
      const response = await request(app)
        .post('/api/items')
        .send({
          title: 'Test',
          startingPrice: -50,
          endsAt: new Date(Date.now() + 3600000).toISOString(),
        });

      expect(response.status).toBe(400);
      expect(response.body.error).toBe('startingPrice must be a non-negative number');
    });

    it('returns 400 if endsAt is in the past', async () => {
      const pastDate = new Date(Date.now() - 3600000).toISOString(); // 1 hour ago

      const response = await request(app)
        .post('/api/items')
        .send({
          title: 'Test',
          startingPrice: 100,
          endsAt: pastDate,
        });

      expect(response.status).toBe(400);
      expect(response.body.error).toBe('endsAt must be in the future');
    });
  });

  describe('GET /api/items', () => {
    it('returns empty array when no items exist', async () => {
      const response = await request(app).get('/api/items');

      expect(response.status).toBe(200);
      expect(response.body).toEqual([]);
    });

    it('returns all items', async () => {
      const futureDate = new Date(Date.now() + 3600000).toISOString();

      // Create two items
      await request(app).post('/api/items').send({
        title: 'Item 1',
        description: 'First item',
        startingPrice: 50,
        endsAt: futureDate,
      });
      await request(app).post('/api/items').send({
        title: 'Item 2',
        description: 'Second item',
        startingPrice: 75,
        endsAt: futureDate,
      });

      const response = await request(app).get('/api/items');

      expect(response.status).toBe(200);
      expect(response.body).toHaveLength(2);
      expect(response.body[0].title).toBe('Item 1');
      expect(response.body[1].title).toBe('Item 2');
    });
  });

  describe('GET /api/items/:id', () => {
    it('returns item by ID', async () => {
      const futureDate = new Date(Date.now() + 3600000).toISOString();

      // Create an item
      const createResponse = await request(app).post('/api/items').send({
        title: 'Test Item',
        description: 'Description',
        startingPrice: 100,
        endsAt: futureDate,
      });

      const itemId = createResponse.body.id;
      const response = await request(app).get(`/api/items/${itemId}`);

      expect(response.status).toBe(200);
      expect(response.body.id).toBe(itemId);
      expect(response.body.title).toBe('Test Item');
    });

    it('returns 404 for non-existent item', async () => {
      const response = await request(app).get('/api/items/999');

      expect(response.status).toBe(404);
      expect(response.body.error).toBe('Item not found');
    });
  });

  describe('Expiration Logic', () => {
    it('marks item as closed when fetched after endsAt', async () => {
      // Create item that ends in 1 hour
      const endsAt = new Date('2026-01-20T12:00:00Z');

      // Set clock to before endsAt
      setClock(createFakeClock(new Date('2026-01-20T11:00:00Z')));

      const createResponse = await request(app).post('/api/items').send({
        title: 'Expiring Item',
        description: 'Will expire',
        startingPrice: 100,
        endsAt: endsAt.toISOString(),
      });

      expect(createResponse.body.status).toBe('active');

      // Move clock past endsAt
      setClock(createFakeClock(new Date('2026-01-20T13:00:00Z')));

      // Fetch item - should now be closed
      const response = await request(app).get(`/api/items/${createResponse.body.id}`);

      expect(response.status).toBe(200);
      expect(response.body.status).toBe('closed');
    });

    it('marks multiple items as closed when fetching all after expiration', async () => {
      const endsAt = new Date('2026-01-20T12:00:00Z');

      // Set clock to before endsAt
      setClock(createFakeClock(new Date('2026-01-20T11:00:00Z')));

      // Create two items
      await request(app).post('/api/items').send({
        title: 'Item 1',
        description: 'First',
        startingPrice: 50,
        endsAt: endsAt.toISOString(),
      });
      await request(app).post('/api/items').send({
        title: 'Item 2',
        description: 'Second',
        startingPrice: 75,
        endsAt: endsAt.toISOString(),
      });

      // Move clock past endsAt
      setClock(createFakeClock(new Date('2026-01-20T13:00:00Z')));

      // Fetch all items - both should be closed
      const response = await request(app).get('/api/items');

      expect(response.status).toBe(200);
      expect(response.body).toHaveLength(2);
      expect(response.body[0].status).toBe('closed');
      expect(response.body[1].status).toBe('closed');
    });

    it('keeps item active if not yet expired', async () => {
      const endsAt = new Date('2026-01-20T12:00:00Z');

      // Set clock to before endsAt
      setClock(createFakeClock(new Date('2026-01-20T11:00:00Z')));

      const createResponse = await request(app).post('/api/items').send({
        title: 'Active Item',
        description: 'Still active',
        startingPrice: 100,
        endsAt: endsAt.toISOString(),
      });

      // Fetch item while still active
      const response = await request(app).get(`/api/items/${createResponse.body.id}`);

      expect(response.status).toBe(200);
      expect(response.body.status).toBe('active');
    });

    it('persists closed status after expiration check', async () => {
      const endsAt = new Date('2026-01-20T12:00:00Z');

      // Set clock to before endsAt
      setClock(createFakeClock(new Date('2026-01-20T11:00:00Z')));

      const createResponse = await request(app).post('/api/items').send({
        title: 'Persist Test',
        description: 'Check persistence',
        startingPrice: 100,
        endsAt: endsAt.toISOString(),
      });

      // Move clock past endsAt and fetch to trigger close
      setClock(createFakeClock(new Date('2026-01-20T13:00:00Z')));
      await request(app).get(`/api/items/${createResponse.body.id}`);

      // Move clock back (simulating a different scenario) - should still be closed
      setClock(createFakeClock(new Date('2026-01-20T11:30:00Z')));
      const response = await request(app).get(`/api/items/${createResponse.body.id}`);

      expect(response.body.status).toBe('closed');
    });
  });

  describe('POST /api/items/:id/bid', () => {
    it('places a valid bid on an active item', async () => {
      const futureDate = new Date(Date.now() + 3600000).toISOString();

      const createResponse = await request(app).post('/api/items').send({
        title: 'Bid Test Item',
        description: 'For bidding',
        startingPrice: 100,
        endsAt: futureDate,
      });

      const response = await request(app)
        .post(`/api/items/${createResponse.body.id}/bid`)
        .send({ amount: 150, bidderId: 'user1' });

      expect(response.status).toBe(200);
      expect(response.body.currentBid).toBe(150);
      expect(response.body.bidCount).toBe(1);
    });

    it('increments bid count with multiple bids', async () => {
      const futureDate = new Date(Date.now() + 3600000).toISOString();

      const createResponse = await request(app).post('/api/items').send({
        title: 'Multi Bid Item',
        description: 'Multiple bids',
        startingPrice: 100,
        endsAt: futureDate,
      });

      await request(app)
        .post(`/api/items/${createResponse.body.id}/bid`)
        .send({ amount: 150, bidderId: 'user1' });

      const response = await request(app)
        .post(`/api/items/${createResponse.body.id}/bid`)
        .send({ amount: 200, bidderId: 'user2' });

      expect(response.status).toBe(200);
      expect(response.body.currentBid).toBe(200);
      expect(response.body.bidCount).toBe(2);
    });

    it('returns 400 if bid is not higher than current bid', async () => {
      const futureDate = new Date(Date.now() + 3600000).toISOString();

      const createResponse = await request(app).post('/api/items').send({
        title: 'Low Bid Item',
        description: 'Test low bid',
        startingPrice: 100,
        endsAt: futureDate,
      });

      // First bid
      await request(app)
        .post(`/api/items/${createResponse.body.id}/bid`)
        .send({ amount: 150, bidderId: 'user1' });

      // Lower bid should fail
      const response = await request(app)
        .post(`/api/items/${createResponse.body.id}/bid`)
        .send({ amount: 140, bidderId: 'user2' });

      expect(response.status).toBe(400);
      expect(response.body.error).toContain('Bid must be greater than');
      expect(response.body.minimumBid).toBe(150);
    });

    it('returns 400 if bid is not higher than starting price', async () => {
      const futureDate = new Date(Date.now() + 3600000).toISOString();

      const createResponse = await request(app).post('/api/items').send({
        title: 'Starting Price Item',
        description: 'Test starting price',
        startingPrice: 100,
        endsAt: futureDate,
      });

      const response = await request(app)
        .post(`/api/items/${createResponse.body.id}/bid`)
        .send({ amount: 50, bidderId: 'user1' });

      expect(response.status).toBe(400);
      expect(response.body.minimumBid).toBe(100);
    });

    it('returns 400 if bidding on expired item', async () => {
      const endsAt = new Date('2026-01-20T12:00:00Z');

      // Set clock to before endsAt
      setClock(createFakeClock(new Date('2026-01-20T11:00:00Z')));

      const createResponse = await request(app).post('/api/items').send({
        title: 'Expired Item',
        description: 'Will expire',
        startingPrice: 100,
        endsAt: endsAt.toISOString(),
      });

      // Move clock past endsAt
      setClock(createFakeClock(new Date('2026-01-20T13:00:00Z')));

      const response = await request(app)
        .post(`/api/items/${createResponse.body.id}/bid`)
        .send({ amount: 150, bidderId: 'user1' });

      expect(response.status).toBe(400);
      expect(response.body.error).toBe('Auction has ended');
    });

    it('returns 404 if item does not exist', async () => {
      const response = await request(app)
        .post('/api/items/999/bid')
        .send({ amount: 150, bidderId: 'user1' });

      expect(response.status).toBe(404);
      expect(response.body.error).toBe('Item not found');
    });

    it('returns 400 if amount is missing', async () => {
      const futureDate = new Date(Date.now() + 3600000).toISOString();

      const createResponse = await request(app).post('/api/items').send({
        title: 'Missing Amount Item',
        description: 'Test missing amount',
        startingPrice: 100,
        endsAt: futureDate,
      });

      const response = await request(app)
        .post(`/api/items/${createResponse.body.id}/bid`)
        .send({ bidderId: 'user1' });

      expect(response.status).toBe(400);
      expect(response.body.error).toBe('amount must be a positive number');
    });

    it('returns 400 if bidderId is missing', async () => {
      const futureDate = new Date(Date.now() + 3600000).toISOString();

      const createResponse = await request(app).post('/api/items').send({
        title: 'Missing Bidder Item',
        description: 'Test missing bidder',
        startingPrice: 100,
        endsAt: futureDate,
      });

      const response = await request(app)
        .post(`/api/items/${createResponse.body.id}/bid`)
        .send({ amount: 150 });

      expect(response.status).toBe(400);
      expect(response.body.error).toBe('bidderId is required');
    });
  });
});

import { describe, it, expect, beforeEach } from 'vitest';
import request from 'supertest';
import app from '../../src/server/app.js';
import { clearItems } from '../../src/domain/store.js';

describe('Items API', () => {
  // Clear store before each test
  beforeEach(() => {
    clearItems();
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
});

import { describe, it, expect } from 'vitest';
import request from 'supertest';
import app from '../../src/server/app.js';

describe('API Integration Tests', () => {
  describe('GET /health', () => {
    it('returns 200 with ok: true', async () => {
      const response = await request(app).get('/health');

      expect(response.status).toBe(200);
      expect(response.body).toEqual({ ok: true });
    });

    it('returns JSON content type', async () => {
      const response = await request(app).get('/health');

      expect(response.headers['content-type']).toMatch(/application\/json/);
    });
  });

  describe('GET /', () => {
    it('returns 200 and serves HTML', async () => {
      const response = await request(app).get('/');

      expect(response.status).toBe(200);
      expect(response.headers['content-type']).toMatch(/text\/html/);
    });

    it('contains expected page content', async () => {
      const response = await request(app).get('/');

      expect(response.text).toContain('Countdown Auction');
      expect(response.text).toContain('Bid Before Time Runs Out');
      expect(response.text).toContain('Live Auctions');
    });
  });
});

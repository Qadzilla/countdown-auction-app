import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import {
  closeExpiredItems,
  startSweeper,
  stopSweeper,
  isSweeperRunning,
  setSweeperClock,
  resetSweeperClock,
} from '../../src/domain/sweeper.js';
import { createItem, clearItems, getItemById } from '../../src/domain/store.js';
import { createFakeClock } from '../../src/domain/time.js';

describe('Sweeper', () => {
  beforeEach(() => {
    clearItems();
    resetSweeperClock();
    stopSweeper();
  });

  afterEach(() => {
    resetSweeperClock();
    stopSweeper();
  });

  describe('closeExpiredItems', () => {
    it('closes expired items', () => {
      // Set clock to a fixed time
      const now = new Date('2026-01-20T12:00:00Z');
      setSweeperClock(createFakeClock(now));

      // Create an item that ended an hour ago
      createItem({
        title: 'Expired Item',
        description: 'Already expired',
        startingPrice: 100,
        endsAt: '2026-01-20T11:00:00Z',
      });

      const closedCount = closeExpiredItems();

      expect(closedCount).toBe(1);
      const item = getItemById('1');
      expect(item?.status).toBe('closed');
    });

    it('does not close active items', () => {
      // Set clock to a fixed time
      const now = new Date('2026-01-20T12:00:00Z');
      setSweeperClock(createFakeClock(now));

      // Create an item that ends in the future
      createItem({
        title: 'Active Item',
        description: 'Still active',
        startingPrice: 100,
        endsAt: '2026-01-20T14:00:00Z',
      });

      const closedCount = closeExpiredItems();

      expect(closedCount).toBe(0);
      const item = getItemById('1');
      expect(item?.status).toBe('active');
    });

    it('closes multiple expired items', () => {
      // Set clock to a fixed time
      const now = new Date('2026-01-20T12:00:00Z');
      setSweeperClock(createFakeClock(now));

      // Create multiple expired items
      createItem({
        title: 'Expired 1',
        description: 'Expired',
        startingPrice: 50,
        endsAt: '2026-01-20T10:00:00Z',
      });
      createItem({
        title: 'Expired 2',
        description: 'Expired',
        startingPrice: 75,
        endsAt: '2026-01-20T11:00:00Z',
      });
      // One active item
      createItem({
        title: 'Active',
        description: 'Still active',
        startingPrice: 100,
        endsAt: '2026-01-20T14:00:00Z',
      });

      const closedCount = closeExpiredItems();

      expect(closedCount).toBe(2);
      expect(getItemById('1')?.status).toBe('closed');
      expect(getItemById('2')?.status).toBe('closed');
      expect(getItemById('3')?.status).toBe('active');
    });

    it('does not double-close already closed items', () => {
      // Set clock to a fixed time
      const now = new Date('2026-01-20T12:00:00Z');
      setSweeperClock(createFakeClock(now));

      // Create an expired item
      createItem({
        title: 'Expired Item',
        description: 'Expired',
        startingPrice: 100,
        endsAt: '2026-01-20T11:00:00Z',
      });

      // First sweep
      const firstCount = closeExpiredItems();
      expect(firstCount).toBe(1);

      // Second sweep - should not close again
      const secondCount = closeExpiredItems();
      expect(secondCount).toBe(0);
    });

    it('returns 0 when no items exist', () => {
      const closedCount = closeExpiredItems();
      expect(closedCount).toBe(0);
    });
  });

  describe('startSweeper / stopSweeper', () => {
    it('starts and stops the sweeper', () => {
      expect(isSweeperRunning()).toBe(false);

      startSweeper(1000);
      expect(isSweeperRunning()).toBe(true);

      stopSweeper();
      expect(isSweeperRunning()).toBe(false);
    });

    it('does not start multiple sweepers', () => {
      startSweeper(1000);
      startSweeper(1000); // Should not start another

      expect(isSweeperRunning()).toBe(true);

      stopSweeper();
      expect(isSweeperRunning()).toBe(false);
    });

    it('runs closeExpiredItems on start', () => {
      // Set clock to a fixed time
      const now = new Date('2026-01-20T12:00:00Z');
      setSweeperClock(createFakeClock(now));

      // Create an expired item
      createItem({
        title: 'Expired Item',
        description: 'Expired',
        startingPrice: 100,
        endsAt: '2026-01-20T11:00:00Z',
      });

      // Start sweeper - should immediately close expired items
      startSweeper(60000);

      const item = getItemById('1');
      expect(item?.status).toBe('closed');

      stopSweeper();
    });
  });
});

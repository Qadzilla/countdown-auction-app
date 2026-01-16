/**
 * Background sweeper for auto-closing expired auctions
 */

import { getAllItems, updateItemStatus } from './store.js';
import { isExpired, Clock, realClock } from './time.js';

// Default sweep interval: 60 seconds
const DEFAULT_INTERVAL_MS = 60 * 1000;

// Sweeper state
let intervalId: ReturnType<typeof setInterval> | null = null;
let clock: Clock = realClock;

/**
 * Set the clock instance (for testing)
 */
export function setSweeperClock(newClock: Clock): void {
  clock = newClock;
}

/**
 * Reset to real clock
 */
export function resetSweeperClock(): void {
  clock = realClock;
}

/**
 * Close all expired items
 * Returns the number of items closed
 */
export function closeExpiredItems(): number {
  const items = getAllItems();
  let closedCount = 0;

  for (const item of items) {
    if (item.status === 'active' && isExpired(item.endsAt, clock)) {
      updateItemStatus(item.id, 'closed');
      closedCount++;
    }
  }

  return closedCount;
}

/**
 * Start the background sweeper
 * @param intervalMs - Interval between sweeps in milliseconds (default: 60000)
 */
export function startSweeper(intervalMs: number = DEFAULT_INTERVAL_MS): void {
  if (intervalId !== null) {
    return; // Already running
  }

  // Run immediately on start
  closeExpiredItems();

  // Then run periodically
  intervalId = setInterval(() => {
    const closed = closeExpiredItems();
    if (closed > 0) {
      console.log(`[Sweeper] Closed ${closed} expired auction(s)`);
    }
  }, intervalMs);

  console.log(`[Sweeper] Started with ${intervalMs}ms interval`);
}

/**
 * Stop the background sweeper
 */
export function stopSweeper(): void {
  if (intervalId !== null) {
    clearInterval(intervalId);
    intervalId = null;
    console.log('[Sweeper] Stopped');
  }
}

/**
 * Check if sweeper is running
 */
export function isSweeperRunning(): boolean {
  return intervalId !== null;
}

/**
 * Time utilities for the Countdown Auction App
 */

// Clock interface for testability (inject real or fake clock)
export interface Clock {
  now(): Date;
}

// Default real clock implementation
export const realClock: Clock = {
  now: () => new Date(),
};

// Create a fake clock for testing
export function createFakeClock(fixedTime: Date): Clock {
  return {
    now: () => fixedTime,
  };
}

// Calculate remaining time in milliseconds
export function getRemainingTime(endsAt: Date, clock: Clock = realClock): number {
  return endsAt.getTime() - clock.now().getTime();
}

// Check if an auction has expired
export function isExpired(endsAt: Date, clock: Clock = realClock): boolean {
  return getRemainingTime(endsAt, clock) <= 0;
}

// Format milliseconds as HH:MM:SS
export function formatCountdown(ms: number): string {
  if (ms <= 0) return '00:00:00';

  const totalSeconds = Math.floor(ms / 1000);
  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;

  return [hours, minutes, seconds]
    .map(n => n.toString().padStart(2, '0'))
    .join(':');
}

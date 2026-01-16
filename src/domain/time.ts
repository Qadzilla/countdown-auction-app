/**
 * Time utilities for the Countdown Auction App
 *
 * TODO: Implement in future slices:
 * - Clock interface for dependency injection (enables fake timers in tests)
 * - getRemainingTime(endsAt): calculate time remaining
 * - isExpired(endsAt): check if auction has ended
 * - formatCountdown(ms): format as HH:MM:SS
 */

// Clock interface for testability (inject real or fake clock)
export interface Clock {
  now(): Date;
}

// Default real clock implementation
export const realClock: Clock = {
  now: () => new Date(),
};

// Placeholder: Create a fake clock for testing
export function createFakeClock(fixedTime: Date): Clock {
  return {
    now: () => fixedTime,
  };
}

// Placeholder: Calculate remaining time in milliseconds
export function getRemainingTime(endsAt: Date, clock: Clock = realClock): number {
  // TODO: Implement actual calculation
  return endsAt.getTime() - clock.now().getTime();
}

// Placeholder: Check if an auction has expired
export function isExpired(endsAt: Date, clock: Clock = realClock): boolean {
  // TODO: Implement actual check
  return getRemainingTime(endsAt, clock) <= 0;
}

// Placeholder: Format milliseconds as HH:MM:SS
export function formatCountdown(ms: number): string {
  // TODO: Implement formatting
  if (ms <= 0) return '00:00:00';

  const totalSeconds = Math.floor(ms / 1000);
  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;

  return [hours, minutes, seconds]
    .map(n => n.toString().padStart(2, '0'))
    .join(':');
}

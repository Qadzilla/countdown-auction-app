import { describe, it, expect } from 'vitest';
import {
  createFakeClock,
  getRemainingTime,
  isExpired,
  formatCountdown,
} from '../../src/domain/time.js';

describe('time utilities', () => {
  describe('createFakeClock', () => {
    it('returns a clock that always returns the fixed time', () => {
      const fixedDate = new Date('2024-01-15T12:00:00Z');
      const clock = createFakeClock(fixedDate);

      expect(clock.now()).toEqual(fixedDate);
      expect(clock.now()).toEqual(fixedDate);
    });
  });

  describe('getRemainingTime', () => {
    it('returns positive ms when end time is in the future', () => {
      const now = new Date('2024-01-15T12:00:00Z');
      const endsAt = new Date('2024-01-15T13:00:00Z'); // 1 hour later
      const clock = createFakeClock(now);

      const remaining = getRemainingTime(endsAt, clock);

      expect(remaining).toBe(3600000); // 1 hour in ms
    });

    it('returns negative ms when end time is in the past', () => {
      const now = new Date('2024-01-15T12:00:00Z');
      const endsAt = new Date('2024-01-15T11:00:00Z'); // 1 hour ago
      const clock = createFakeClock(now);

      const remaining = getRemainingTime(endsAt, clock);

      expect(remaining).toBe(-3600000);
    });
  });

  describe('isExpired', () => {
    it('returns false when end time is in the future', () => {
      const now = new Date('2024-01-15T12:00:00Z');
      const endsAt = new Date('2024-01-15T13:00:00Z');
      const clock = createFakeClock(now);

      expect(isExpired(endsAt, clock)).toBe(false);
    });

    it('returns true when end time is in the past', () => {
      const now = new Date('2024-01-15T12:00:00Z');
      const endsAt = new Date('2024-01-15T11:00:00Z');
      const clock = createFakeClock(now);

      expect(isExpired(endsAt, clock)).toBe(true);
    });

    it('returns true when end time equals current time', () => {
      const now = new Date('2024-01-15T12:00:00Z');
      const endsAt = new Date('2024-01-15T12:00:00Z');
      const clock = createFakeClock(now);

      expect(isExpired(endsAt, clock)).toBe(true);
    });
  });

  describe('formatCountdown', () => {
    it('formats hours, minutes, seconds correctly', () => {
      const ms = (2 * 3600 + 30 * 60 + 45) * 1000; // 2:30:45
      expect(formatCountdown(ms)).toBe('02:30:45');
    });

    it('pads single digits with zeros', () => {
      const ms = (1 * 3600 + 5 * 60 + 9) * 1000; // 1:05:09
      expect(formatCountdown(ms)).toBe('01:05:09');
    });

    it('returns 00:00:00 for zero or negative values', () => {
      expect(formatCountdown(0)).toBe('00:00:00');
      expect(formatCountdown(-1000)).toBe('00:00:00');
    });

    it('handles large hour values', () => {
      const ms = (100 * 3600) * 1000; // 100 hours
      expect(formatCountdown(ms)).toBe('100:00:00');
    });
  });
});

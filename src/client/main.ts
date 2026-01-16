/**
 * Countdown Auction - Client-side TypeScript
 * Handles live countdown timer updates for auction items
 */

/**
 * Format milliseconds as HH:MM:SS
 */
function formatCountdown(ms: number): string {
  if (ms <= 0) return '00:00:00';

  const totalSeconds = Math.floor(ms / 1000);
  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;

  return [hours, minutes, seconds]
    .map(n => n.toString().padStart(2, '0'))
    .join(':');
}

/**
 * Update all countdown timers on the page
 */
function updateCountdowns(): void {
  const now = Date.now();
  const items = document.querySelectorAll<HTMLElement>('.auction-item[data-ends-at]');

  items.forEach(item => {
    const endsAtStr = item.dataset.endsAt;
    if (!endsAtStr) return;

    const endsAt = new Date(endsAtStr).getTime();
    const countdownEl = item.querySelector<HTMLElement>('[data-countdown]');

    if (!countdownEl) return;

    const remaining = endsAt - now;

    if (remaining <= 0) {
      // Auction ended
      countdownEl.textContent = 'ENDED';
      countdownEl.classList.add('countdown--ended');
      countdownEl.classList.remove('countdown--urgent');
      item.classList.add('auction-item--ended');

      // Update label
      const label = item.querySelector<HTMLElement>('.timer-label');
      if (label) label.textContent = 'Status';
    } else {
      // Update countdown display
      countdownEl.textContent = formatCountdown(remaining);

      // Add urgent styling if less than 1 hour
      if (remaining < 3600000) {
        countdownEl.classList.add('countdown--urgent');
      } else {
        countdownEl.classList.remove('countdown--urgent');
      }
    }
  });
}

/**
 * Initialize countdown timers
 */
function init(): void {
  // Update immediately
  updateCountdowns();

  // Update every second
  setInterval(updateCountdowns, 1000);
}

// Start when DOM is ready
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', init);
} else {
  init();
}

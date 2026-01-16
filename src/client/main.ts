/**
 * Countdown Auction - Client-side TypeScript
 * Fetches auction items from API and handles live countdown timers
 */

// Item type matching the API response
interface Item {
  id: string;
  title: string;
  description: string;
  startingPrice: number;
  endsAt: string;
  status: 'active' | 'closed';
  createdAt: string;
}

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
 * Format price as currency
 */
function formatPrice(amount: number): string {
  return `$${amount.toFixed(2)}`;
}

/**
 * Fetch items from the API
 */
async function fetchItems(): Promise<Item[]> {
  const response = await fetch('/api/items');
  if (!response.ok) {
    throw new Error('Failed to fetch items');
  }
  return response.json();
}

/**
 * Render a single auction item
 */
function renderItem(item: Item): string {
  const endsAt = new Date(item.endsAt).getTime();
  const now = Date.now();
  const isEnded = endsAt <= now || item.status === 'closed';

  return `
    <article class="auction-item${isEnded ? ' auction-item--ended' : ''}" data-item-id="${item.id}" data-ends-at="${item.endsAt}">
      <div class="auction-info">
        <h4>${escapeHtml(item.title)}</h4>
        <p class="auction-description">${escapeHtml(item.description)}</p>
        <div class="auction-meta">
          <span class="current-bid">${isEnded ? 'Starting Price' : 'Starting Price'}: ${formatPrice(item.startingPrice)}</span>
        </div>
      </div>
      <div class="auction-timer">
        <span class="timer-label">${isEnded ? 'Status' : 'Time Remaining'}</span>
        <span class="countdown${isEnded ? ' countdown--ended' : ''}" data-countdown>${isEnded ? 'ENDED' : '--:--:--'}</span>
      </div>
    </article>
  `;
}

/**
 * Escape HTML to prevent XSS
 */
function escapeHtml(text: string): string {
  const div = document.createElement('div');
  div.textContent = text;
  return div.innerHTML;
}

/**
 * Render all items to the page
 */
function renderItems(items: Item[]): void {
  const listEl = document.getElementById('auction-list');
  const emptyEl = document.getElementById('empty-state');

  if (!listEl || !emptyEl) return;

  if (items.length === 0) {
    listEl.innerHTML = '';
    emptyEl.hidden = false;
  } else {
    emptyEl.hidden = true;
    listEl.innerHTML = items.map(renderItem).join('');
  }
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
 * Initialize the application
 */
async function init(): Promise<void> {
  try {
    // Fetch and render items
    const items = await fetchItems();
    renderItems(items);

    // Start countdown updates
    updateCountdowns();
    setInterval(updateCountdowns, 1000);
  } catch (error) {
    console.error('Failed to load auctions:', error);
    const listEl = document.getElementById('auction-list');
    if (listEl) {
      listEl.innerHTML = '<p class="error-message">Failed to load auctions. Please try again later.</p>';
    }
  }
}

// Start when DOM is ready
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', init);
} else {
  init();
}

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
  currentBid: number | null;
  bidCount: number;
  endsAt: string;
  status: 'active' | 'closed';
  createdAt: string;
}

// Store items for reference
let itemsCache: Item[] = [];

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
 * Get the current price (current bid or starting price)
 */
function getCurrentPrice(item: Item): number {
  return item.currentBid ?? item.startingPrice;
}

/**
 * Render a single auction item
 */
function renderItem(item: Item): string {
  const endsAt = new Date(item.endsAt).getTime();
  const now = Date.now();
  const isEnded = endsAt <= now || item.status === 'closed';
  const currentPrice = getCurrentPrice(item);
  const hasBids = item.bidCount > 0;

  const bidFormHtml = isEnded ? '' : `
    <form class="bid-form" data-item-id="${item.id}">
      <div class="bid-input-group">
        <span class="currency-prefix">$</span>
        <input
          type="number"
          class="bid-input"
          placeholder="${(currentPrice + 1).toFixed(0)}"
          min="${currentPrice + 1}"
          step="1"
          required
        />
      </div>
      <button type="submit" class="bid-button">Place Bid</button>
      <div class="bid-feedback" hidden></div>
    </form>
  `;

  return `
    <article class="auction-item${isEnded ? ' auction-item--ended' : ''}" data-item-id="${item.id}" data-ends-at="${item.endsAt}">
      <div class="auction-info">
        <h4>${escapeHtml(item.title)}</h4>
        <p class="auction-description">${escapeHtml(item.description)}</p>
        <div class="auction-meta">
          <span class="current-bid">${hasBids ? 'Current Bid' : 'Starting Price'}: ${formatPrice(currentPrice)}</span>
          <span class="bid-count">${item.bidCount} bid${item.bidCount !== 1 ? 's' : ''}</span>
        </div>
        ${bidFormHtml}
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
  itemsCache = items;
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
 * Place a bid on an item
 */
async function placeBid(itemId: string, amount: number): Promise<Item> {
  const response = await fetch(`/api/items/${itemId}/bid`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ amount, bidderId: 'anonymous' }),
  });

  const data = await response.json();

  if (!response.ok) {
    throw new Error(data.error || 'Failed to place bid');
  }

  return data;
}

/**
 * Update a single item in the DOM after a bid
 */
function updateItemInDOM(updatedItem: Item): void {
  // Update cache
  const index = itemsCache.findIndex(i => i.id === updatedItem.id);
  if (index !== -1) {
    itemsCache[index] = updatedItem;
  }

  // Re-render just this item
  const itemEl = document.querySelector(`[data-item-id="${updatedItem.id}"]`);
  if (itemEl) {
    const newHtml = renderItem(updatedItem);
    const template = document.createElement('template');
    template.innerHTML = newHtml.trim();
    const newElement = template.content.firstChild;
    if (newElement) {
      itemEl.replaceWith(newElement);
    }
  }
}

/**
 * Show feedback message on a bid form
 */
function showBidFeedback(form: HTMLFormElement, message: string, isError: boolean): void {
  const feedback = form.querySelector<HTMLElement>('.bid-feedback');
  if (feedback) {
    feedback.textContent = message;
    feedback.hidden = false;
    feedback.className = `bid-feedback ${isError ? 'bid-feedback--error' : 'bid-feedback--success'}`;

    // Hide after 3 seconds
    setTimeout(() => {
      feedback.hidden = true;
    }, 3000);
  }
}

/**
 * Handle bid form submission
 */
async function handleBidSubmit(event: Event): Promise<void> {
  event.preventDefault();

  const form = event.target as HTMLFormElement;
  const itemId = form.dataset.itemId;
  const input = form.querySelector<HTMLInputElement>('.bid-input');
  const button = form.querySelector<HTMLButtonElement>('.bid-button');

  if (!itemId || !input || !button) return;

  const amount = parseFloat(input.value);
  if (isNaN(amount) || amount <= 0) {
    showBidFeedback(form, 'Please enter a valid amount', true);
    return;
  }

  // Disable form while submitting
  input.disabled = true;
  button.disabled = true;
  button.textContent = 'Placing...';

  try {
    const updatedItem = await placeBid(itemId, amount);
    showBidFeedback(form, `Bid of ${formatPrice(amount)} placed!`, false);

    // Update the item display
    setTimeout(() => {
      updateItemInDOM(updatedItem);
    }, 1000);
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Failed to place bid';
    showBidFeedback(form, message, true);

    // Re-enable form on error
    input.disabled = false;
    button.disabled = false;
    button.textContent = 'Place Bid';
    input.value = '';
  }
}

/**
 * Set up event delegation for bid forms
 */
function setupBidFormHandlers(): void {
  const listEl = document.getElementById('auction-list');
  if (!listEl) return;

  listEl.addEventListener('submit', (event) => {
    const target = event.target as HTMLElement;
    if (target.classList.contains('bid-form')) {
      handleBidSubmit(event);
    }
  });
}

// ========== Create Auction Modal ==========

/**
 * Get modal elements
 */
function getModalElements() {
  return {
    modal: document.getElementById('create-modal'),
    form: document.getElementById('create-auction-form') as HTMLFormElement | null,
    openBtn: document.getElementById('create-auction-btn'),
    closeBtn: document.querySelector('.modal-close'),
    cancelBtn: document.querySelector('.modal-cancel'),
    backdrop: document.querySelector('.modal-backdrop'),
    feedback: document.querySelector('.form-feedback') as HTMLElement | null,
  };
}

/**
 * Open the create auction modal
 */
function openModal(): void {
  const { modal, form } = getModalElements();
  if (modal) {
    modal.hidden = false;
    // Set minimum datetime to now
    const endsAtInput = document.getElementById('item-ends') as HTMLInputElement;
    if (endsAtInput) {
      const now = new Date();
      now.setMinutes(now.getMinutes() - now.getTimezoneOffset() + 60); // 1 hour from now minimum
      endsAtInput.min = now.toISOString().slice(0, 16);
    }
  }
  if (form) {
    form.reset();
  }
}

/**
 * Close the create auction modal
 */
function closeModal(): void {
  const { modal, feedback } = getModalElements();
  if (modal) {
    modal.hidden = true;
  }
  if (feedback) {
    feedback.hidden = true;
  }
}

/**
 * Show feedback in the create form
 */
function showCreateFeedback(message: string, isError: boolean): void {
  const { feedback } = getModalElements();
  if (feedback) {
    feedback.textContent = message;
    feedback.hidden = false;
    feedback.className = `form-feedback ${isError ? 'form-feedback--error' : 'form-feedback--success'}`;
  }
}

/**
 * Create a new auction item
 */
async function createItem(data: {
  title: string;
  description: string;
  startingPrice: number;
  endsAt: string;
}): Promise<Item> {
  const response = await fetch('/api/items', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  });

  const result = await response.json();

  if (!response.ok) {
    throw new Error(result.error || 'Failed to create auction');
  }

  return result;
}

/**
 * Handle create auction form submission
 */
async function handleCreateSubmit(event: Event): Promise<void> {
  event.preventDefault();

  const { form, feedback } = getModalElements();
  if (!form) return;

  const titleInput = document.getElementById('item-title') as HTMLInputElement;
  const descInput = document.getElementById('item-description') as HTMLTextAreaElement;
  const priceInput = document.getElementById('item-price') as HTMLInputElement;
  const endsInput = document.getElementById('item-ends') as HTMLInputElement;
  const submitBtn = form.querySelector('button[type="submit"]') as HTMLButtonElement;

  // Validate
  const title = titleInput.value.trim();
  const description = descInput.value.trim();
  const startingPrice = parseFloat(priceInput.value);
  const endsAtLocal = endsInput.value;

  if (!title) {
    showCreateFeedback('Title is required', true);
    return;
  }

  if (isNaN(startingPrice) || startingPrice < 1) {
    showCreateFeedback('Starting price must be at least $1', true);
    return;
  }

  if (!endsAtLocal) {
    showCreateFeedback('End date is required', true);
    return;
  }

  // Convert local datetime to ISO string
  const endsAt = new Date(endsAtLocal).toISOString();

  // Disable form
  submitBtn.disabled = true;
  submitBtn.textContent = 'Creating...';
  if (feedback) feedback.hidden = true;

  try {
    const newItem = await createItem({ title, description, startingPrice, endsAt });

    // Add to cache and re-render
    itemsCache.unshift(newItem);
    renderItems(itemsCache);

    // Show success and close modal
    showCreateFeedback('Auction created!', false);
    setTimeout(() => {
      closeModal();
    }, 1000);
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Failed to create auction';
    showCreateFeedback(message, true);
  } finally {
    submitBtn.disabled = false;
    submitBtn.textContent = 'Create Auction';
  }
}

/**
 * Set up modal event handlers
 */
function setupModalHandlers(): void {
  const { openBtn, closeBtn, cancelBtn, backdrop, form } = getModalElements();

  if (openBtn) {
    openBtn.addEventListener('click', openModal);
  }

  if (closeBtn) {
    closeBtn.addEventListener('click', closeModal);
  }

  if (cancelBtn) {
    cancelBtn.addEventListener('click', closeModal);
  }

  if (backdrop) {
    backdrop.addEventListener('click', closeModal);
  }

  if (form) {
    form.addEventListener('submit', handleCreateSubmit);
  }

  // Close on Escape key
  document.addEventListener('keydown', (event) => {
    if (event.key === 'Escape') {
      closeModal();
    }
  });
}

// ========== Countdown Timer ==========

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
  // Set up event handlers before loading items
  setupBidFormHandlers();
  setupModalHandlers();

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

/**
 * In-memory store for auction items
 */

import { Item, CreateItemInput } from './types.js';

// Simple ID generator
let nextId = 1;
function generateId(): string {
  return String(nextId++);
}

// In-memory storage
const items = new Map<string, Item>();

/**
 * Create a new auction item
 */
export function createItem(input: CreateItemInput): Item {
  const id = generateId();
  const now = new Date();

  const item: Item = {
    id,
    title: input.title,
    description: input.description,
    startingPrice: input.startingPrice,
    endsAt: new Date(input.endsAt),
    status: 'active',
    createdAt: now,
  };

  items.set(id, item);
  return item;
}

/**
 * Get all items
 */
export function getAllItems(): Item[] {
  return Array.from(items.values());
}

/**
 * Get item by ID
 */
export function getItemById(id: string): Item | undefined {
  return items.get(id);
}

/**
 * Clear all items (useful for testing)
 */
export function clearItems(): void {
  items.clear();
  nextId = 1;
}

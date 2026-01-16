/**
 * Domain types for the Countdown Auction App
 *
 * TODO: Implement in future slices:
 * - Item: auction item with id, title, endsAt, status
 * - Bid: bid with id, itemId, amount, bidderId, timestamp
 * - ItemStatus: 'active' | 'closed' | 'locked'
 */

// Placeholder: Auction Item
export interface Item {
  id: string;
  title: string;
  description: string;
  endsAt: Date;
  // TODO: Add status, currentBid, winnerId, etc.
}

// Placeholder: Bid
export interface Bid {
  id: string;
  itemId: string;
  amount: number;
  bidderId: string;
  timestamp: Date;
}

// Placeholder: Item status enum
export type ItemStatus = 'active' | 'closed' | 'locked';

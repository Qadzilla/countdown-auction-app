/**
 * Domain types for the Countdown Auction App
 */

// Item status
export type ItemStatus = 'active' | 'closed';

// Auction Item
export interface Item {
  id: string;
  title: string;
  description: string;
  startingPrice: number;
  endsAt: Date;
  status: ItemStatus;
  createdAt: Date;
}

// Input for creating a new item (without generated fields)
export interface CreateItemInput {
  title: string;
  description: string;
  startingPrice: number;
  endsAt: string; // ISO string from client
}

// Bid (placeholder for future slice)
export interface Bid {
  id: string;
  itemId: string;
  amount: number;
  bidderId: string;
  timestamp: Date;
}

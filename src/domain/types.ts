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
  currentBid: number | null;
  bidCount: number;
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

// Input for placing a bid
export interface PlaceBidInput {
  amount: number;
  bidderId: string;
}

// Bid record
export interface Bid {
  id: string;
  itemId: string;
  amount: number;
  bidderId: string;
  timestamp: Date;
}

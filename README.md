# Countdown Auction App

A real-time auction application where items have countdown timers, auto-close when expired, and support live bidding.

## Features

- Create auction items with title, description, starting price, and end time
- Live countdown display (HH:MM:SS) that updates every second
- Place bids on active auctions (must exceed current bid)
- Server-enforced deadlines - items automatically lock when expired
- Dual expiration enforcement: background sweeper + request-time checks
- Responsive UI with modal forms and instant feedback

## Tech Stack

- **Backend:** Node.js + Express + TypeScript (ESM)
- **Frontend:** HTML + CSS + TypeScript (compiled to JS)
- **Testing:** Vitest + Supertest (43 tests)

## Getting Started

### Install dependencies

```bash
npm install
```

### Development

```bash
npm run dev
```

Server runs at http://localhost:3000

### Production

```bash
npm run build
npm start
```

### Testing

```bash
npm test           # Run tests once
npm run test:watch # Watch mode
```

## API Endpoints

| Method | Path | Description |
|--------|------|-------------|
| GET | `/` | Serves the client HTML |
| GET | `/health` | Health check (`{ ok: true }`) |
| GET | `/api/items` | Get all auction items |
| GET | `/api/items/:id` | Get a single item by ID |
| POST | `/api/items` | Create a new auction item |
| POST | `/api/items/:id/bid` | Place a bid on an item |

### Create Item Request

```json
{
  "title": "Vintage Watch",
  "description": "A beautiful timepiece",
  "startingPrice": 100,
  "endsAt": "2026-01-20T12:00:00Z"
}
```

### Place Bid Request

```json
{
  "amount": 150,
  "bidderId": "user123"
}
```

## Project Structure

```
├── public/                  # Static client files
│   ├── index.html
│   ├── styles.css
│   └── main.js              # Compiled from src/client/main.ts
├── src/
│   ├── client/              # Frontend TypeScript
│   │   └── main.ts          # Client-side logic (countdown, bidding, forms)
│   ├── domain/              # Business logic
│   │   ├── store.ts         # In-memory data store
│   │   ├── sweeper.ts       # Background job for auto-closing auctions
│   │   ├── time.ts          # Clock utilities (real + fake for testing)
│   │   └── types.ts         # TypeScript interfaces
│   └── server/              # Express server
│       ├── routes/
│       │   ├── health.ts    # Health check endpoint
│       │   └── items.ts     # Items API endpoints
│       ├── app.ts           # Express app configuration
│       └── index.ts         # Server entry point
├── tests/
│   ├── api/                 # Integration tests
│   │   ├── health.test.ts
│   │   └── items.test.ts
│   └── unit/                # Unit tests
│       ├── sweeper.test.ts
│       └── time.test.ts
├── tsconfig.json            # Server TypeScript config
├── tsconfig.client.json     # Client TypeScript config
└── vitest.config.ts
```

## Scripts

| Script | Description |
|--------|-------------|
| `npm run dev` | Start dev server with tsx watch |
| `npm run build` | Compile TypeScript (server + client) |
| `npm start` | Run compiled production server |
| `npm test` | Run all tests |
| `npm run test:watch` | Run tests in watch mode |

## Architecture Highlights

- **Clock injection:** `time.ts` exports a `Clock` interface for dependency injection, enabling deterministic time-based tests with fake clocks
- **Dual expiration:** Items are closed both by a background sweeper (runs every 60s) and on-demand when fetched via API
- **In-memory store:** Simple Map-based storage - suitable for demos, easily replaceable with a database

## License

ISC

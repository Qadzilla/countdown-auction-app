# Countdown Auction App

A time-based auction application where items have end times, show time remaining, and auto-close when the timer hits zero.

## Status

**Vertical Slice #1: Setup** - Complete

## Features (Planned)

- Create auction items with `endsAt` deadline
- Live countdown display (HH:MM:SS)
- Server-enforced deadlines (items lock when expired)
- Auto-close via background sweeper + request-time enforcement
- Bidding rules and locked state after expiration

## Tech Stack

- **Backend:** Node.js + Express + TypeScript (ESM)
- **Client:** Plain HTML + CSS
- **Testing:** Vitest + Supertest

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
npm test          # Run tests once
npm run test:watch  # Watch mode
```

## API Endpoints

| Method | Path | Description |
|--------|------|-------------|
| GET | `/` | Serves the client HTML |
| GET | `/health` | Health check (`{ ok: true }`) |

## Project Structure

```
├── public/              # Static client files
│   ├── index.html
│   └── styles.css
├── src/
│   ├── domain/          # Business logic
│   │   ├── time.ts      # Clock/timer utilities
│   │   └── types.ts     # Item, Bid types
│   └── server/          # Express server
│       ├── routes/
│       │   └── health.ts
│       ├── app.ts       # Express app instance
│       └── index.ts     # Server entry point
├── tests/
│   ├── api/             # Integration tests
│   └── unit/            # Unit tests
├── package.json
├── tsconfig.json
└── vitest.config.ts
```

## Scripts

| Script | Description |
|--------|-------------|
| `npm run dev` | Start dev server with tsx watch |
| `npm run build` | Compile TypeScript to `dist/` |
| `npm start` | Run compiled production server |
| `npm test` | Run all tests |
| `npm run test:watch` | Run tests in watch mode |

## Testing Strategy

- **Clock injection:** `time.ts` exports a `Clock` interface for dependency injection, enabling deterministic time-based tests with fake clocks
- **Unit tests:** Test time utilities with controlled clock
- **API tests:** Use Supertest for HTTP endpoint testing

## License

ISC

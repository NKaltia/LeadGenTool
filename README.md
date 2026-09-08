# LeadGenTool

B2B prospecting and technical audit platform for local service businesses.

Helps a small software-services team identify businesses with observable
digital gaps, prioritize them with explainable lead scores, and prepare
personalized outreach drafts for human review.

## Status

**Milestone 0 — Project Foundation** (in progress)

Minimal Express API with a health check endpoint.

## Tech Stack

- Node.js (LTS)
- TypeScript (strict mode)
- Express.js

## Prerequisites

- [Node.js](https://nodejs.org/) v22 or later
- npm (included with Node.js)

## Getting Started

```bash
# Install dependencies
npm install

# Start in development mode (auto-restart on file changes)
npm run dev

# Check TypeScript types without emitting files
npm run typecheck

# Compile TypeScript to JavaScript
npm run build

# Start the compiled production server
npm run start
```

## Verify

Once the server is running, check the health endpoint:

```bash
curl http://localhost:3000/health
```

Expected response:

```json
{
  "status": "ok",
  "timestamp": "2026-09-08T12:00:00.000Z"
}
```

## Project Structure

```
src/
├── index.ts          # Application entry point
└── routes/
    └── health.ts     # GET /health endpoint
```

## License

ISC

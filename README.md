# LeadGenTool

B2B prospecting and technical audit platform for local service businesses.

Helps a small software-services team identify businesses with observable
digital gaps, prioritize them with explainable lead scores, and prepare
personalized outreach drafts for human review.

## Status

**Milestone 2 — Basic Website Availability Audit** (implemented)

The backend currently supports:

- business CRUD with Zod request validation;
- PostgreSQL persistence through Prisma;
- synchronous website availability audits;
- SSRF-aware URL validation and redirect handling;
- persisted audit history for each business;
- unit tests for validation, audit behavior, and URL safety.

The next planned stage is **Milestone 2.5 — Engineering Process Upgrade**:
centralized error handling, CI, and the branch → Pull Request → merge workflow.

## Current Tech Stack

- Node.js 22 LTS
- TypeScript 7 in strict mode
- Express 5
- PostgreSQL 17
- Prisma 7 with the PostgreSQL driver adapter
- Zod 4
- Biome 2
- Vitest 5
- `ipaddr.js` 2

## Prerequisites

- [Node.js](https://nodejs.org/) v22 or later
- npm (included with Node.js)
- Docker with Docker Compose

## Getting Started

```bash
# Install dependencies
npm install

# Create local environment configuration
cp .env.example .env

# Start PostgreSQL
docker compose up -d

# Apply database migrations
npx prisma migrate dev

# Start in development mode (auto-restart on file changes)
npm run dev
```

The API starts at `http://localhost:3000` by default.

## Quality Checks

```bash
# Check TypeScript types without emitting files
npm run typecheck

# Check lint rules, formatting, and imports
npm run lint

# Run unit tests
npm test

# Compile TypeScript to JavaScript
npm run build

# Start the compiled production server
npm run start
```

## API Endpoints

- `GET /health`
- `POST /businesses`
- `GET /businesses`
- `GET /businesses/:id`
- `PATCH /businesses/:id`
- `DELETE /businesses/:id`
- `POST /businesses/:id/audits`
- `GET /businesses/:id/audits`

Example health check:

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
prisma/
├── migrations/       # Versioned PostgreSQL schema changes
└── schema.prisma     # Prisma data model
src/
├── app.ts            # Express application and route registration
├── index.ts          # Process entry point and HTTP listener
├── lib/
│   └── safeUrl.ts    # SSRF-aware URL and resolved-IP validation
├── prisma/
│   └── db.ts         # Prisma client and PostgreSQL adapter
├── routes/           # HTTP route handlers
├── schemas/          # Zod request schemas
└── services/
    └── audit.service.ts
tests/
└── unit/
```

## Current Limitations

- Website audits run synchronously in the API process.
- Audits check availability and HTTP metadata, not page content or quality.
- DNS is validated before each request, but a DNS rebinding race remains
  between validation and connection time (see ADR-0006).
- Authentication, background jobs, lead scoring, AI analysis, and a frontend
  are intentionally deferred to later milestones.

## License

ISC

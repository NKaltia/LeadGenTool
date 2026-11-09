# LeadGenTool

[![CI](https://github.com/NKaltia/LeadGenTool/actions/workflows/ci.yml/badge.svg)](https://github.com/NKaltia/LeadGenTool/actions/workflows/ci.yml)

B2B prospecting and website-audit backend for local service businesses.

It helps a small software studio find businesses with observable digital gaps
(for example, a slow, broken or missing website), keep a history of technical
audits, and — in upcoming milestones — prioritize them with explainable lead
scores and prepare outreach drafts for human review.

**Stack:** TypeScript (strict) · Node.js 22 · Express 5 · PostgreSQL 17 ·
Prisma 7 · Zod · Vitest · Biome · GitHub Actions · Docker Compose

## Status

| Milestone | Scope | State |
|---|---|---|
| 0 — Foundation | Express + TypeScript project, `GET /health` | ✅ Done |
| 1 — Business CRUD | PostgreSQL, Prisma, Zod validation, REST endpoints | ✅ Done |
| 2 — Website audit | SSRF-safe availability checks, audit history | ✅ Done |
| 2.5 — Engineering process | CI, ADRs, centralized error handling | 🔄 In progress (CI and ADRs done) |
| 3 — Lead scoring | Deterministic, explainable scores | ⏭ Next |

Full plan: [`docs/ROADMAP.md`](docs/ROADMAP.md) · Product vision:
[`docs/PROJECT_CONCEPT.md`](docs/PROJECT_CONCEPT.md)

## Highlights

- **SSRF-safe outbound requests.** The audit fetches user-supplied URLs, so
  every target is checked before connecting: only `http`/`https`, DNS is
  resolved up front, and any non-public address is rejected — private and
  loopback ranges, link-local and cloud-metadata endpoints (`169.254.169.254`),
  and IPv4-mapped IPv6 forms of them. Redirects are followed manually and
  every hop is re-validated, so a public site cannot redirect the auditor into
  the internal network. See [ADR-0006](docs/decisions/0006-ssrf-url-validation.md).
- **Bounded, classified audits.** Each request has a 5-second timeout and a
  maximum of 5 redirect hops. Every result is stored with HTTP status, final
  URL, response time and an explicit failure reason: `MISSING_URL`,
  `INVALID_URL`, `UNSUPPORTED_PROTOCOL`, `UNSAFE_TARGET`, `UNREACHABLE`,
  `TIMEOUT` or `TOO_MANY_REDIRECTS`.
- **Validation at the boundary.** Request bodies are validated with Zod and
  invalid input gets a `400` with per-field errors.
- **Tested without the network.** 35 Vitest unit tests cover URL validation,
  IP classification, redirects and timeouts, with DNS and `fetch` mocked.
- **CI on every push and pull request:** lint (Biome), type check and tests.
- **Decisions written down** as Architecture Decision Records in
  [`docs/decisions/`](docs/decisions/).

## API

| Method | Path | Description |
|---|---|---|
| `GET` | `/health` | Liveness check |
| `POST` | `/businesses` | Create a business |
| `GET` | `/businesses` | List businesses (newest first) |
| `GET` | `/businesses/:id` | Get one business |
| `PATCH` | `/businesses/:id` | Partially update a business |
| `DELETE` | `/businesses/:id` | Delete a business and its audits |
| `POST` | `/businesses/:id/audits` | Run a website audit and store the result |
| `GET` | `/businesses/:id/audits` | Audit history for a business |

### Example

```bash
# Create a business
curl -X POST http://localhost:3000/businesses \
  -H "Content-Type: application/json" \
  -d '{"name": "Cafe Example", "city": "Tel Aviv", "websiteUrl": "https://example.com"}'

# Audit its website (use the id returned above)
curl -X POST http://localhost:3000/businesses/<id>/audits
```

Example audit result:

```json
{
  "id": "9b2f…",
  "businessId": "3c1a…",
  "url": "https://example.com",
  "isReachable": true,
  "httpStatus": 200,
  "responseTimeMs": 412,
  "finalUrl": "https://example.com/",
  "errorReason": null,
  "createdAt": "2026-10-15T14:00:00.000Z"
}
```

## Getting Started

**Prerequisites:** Node.js 22+, npm, Docker (for the local database).

```bash
# 1. Install dependencies
npm install

# 2. Configure environment
cp .env.example .env

# 3. Start PostgreSQL
docker compose up -d

# 4. Apply migrations and generate the Prisma client
npx prisma migrate dev

# 5. Start the API in watch mode (http://localhost:3000)
npm run dev
```

### Scripts

| Command | Purpose |
|---|---|
| `npm run dev` | Start with auto-reload (`tsx watch`) |
| `npm run build` / `npm start` | Compile to `dist/` and run it |
| `npm test` | Run unit tests (Vitest) |
| `npm run lint` | Lint and format check (Biome) |
| `npm run format` | Apply formatting |
| `npm run typecheck` | TypeScript check without emitting files |

### Environment variables

| Variable | Description | Default in `.env.example` |
|---|---|---|
| `PORT` | HTTP port | `3000` |
| `DATABASE_URL` | PostgreSQL connection string | Local Docker Compose database |

## Project Structure

```
src/
├── index.ts                 # App entry point
├── routes/
│   ├── health.ts            # GET /health
│   └── businesses.ts        # Business CRUD + audit endpoints
├── services/
│   └── audit.service.ts     # Website availability audit
├── lib/
│   └── safeUrl.ts           # SSRF-safe URL and IP validation
├── schemas/
│   └── business.schema.ts   # Zod request schemas
└── prisma/
    └── db.ts                # Prisma client (pg driver adapter)
prisma/                      # Schema and migrations
tests/unit/                  # Vitest unit tests
docs/                        # Roadmap, concept, ADRs, learning log
```

## License

ISC

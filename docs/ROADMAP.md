# Project Roadmap

## How to Use This Roadmap

- Complete milestones in order.
- Do not start a later milestone because its technology looks interesting.
- A milestone is complete only when its acceptance criteria are met.
- Keep scope small. If a milestone grows too large, split it into smaller tasks.
- After each completed milestone, update the README, make a coherent commit,
  and write down unfamiliar terms in `docs/glossary.md`.

---

# Milestone 0 — Project Foundation

## Goal

Create a minimal backend project that runs locally and is understandable
from end to end.

## Scope

- Create the Git repository.
- Add a short English README with the project vision and current status.
- Initialize Node.js LTS, TypeScript strict mode, and Express.
- Add `GET /health`.
- Add basic project scripts:
  - `dev`
  - `build`
  - `start`
  - `typecheck`
- Add `.gitignore`.
- Add `.env.example` if configuration is introduced.

## Do Not Add Yet

- PostgreSQL
- Prisma
- Docker
- Authentication
- Redis
- BullMQ
- AI
- Frontend
- Scraping or website crawling

## Acceptance Criteria

- The API starts locally.
- `GET /health` returns an expected JSON response.
- TypeScript compilation succeeds.
- README explains how to install dependencies and run the project.
- The work is committed as one or more small coherent commits.

## What I Should Understand

- Node.js runtime
- TypeScript compilation
- Express route
- HTTP request and response
- `package.json` scripts
- Git commit basics

---

# Milestone 1 — Local Database and Business CRUD

## Goal

Persist businesses in PostgreSQL and expose a small, validated REST API.

## Scope

- Add PostgreSQL through Docker Compose.
- Add Prisma.
- Create the initial `Business` model.
- Create and apply the first migration.
- Add validation with Zod.
- Implement:
  - `POST /businesses`
  - `GET /businesses`
  - `GET /businesses/:id`
  - `PATCH /businesses/:id`
  - `DELETE /businesses/:id`
- Add consistent error responses.
- Set up a linter (ESLint or Biome) and add a `lint` script.
- Set up Vitest with a minimal configuration and one trivial test.

## Suggested Initial Business Fields

- `id`
- `name`
- `category`
- `city`
- `phone`
- `websiteUrl`
- `createdAt`
- `updatedAt`

## Do Not Add Yet

- CSV import
- Website audit
- Lead score
- User authentication
- Full repository abstraction
- Dashboard

## Acceptance Criteria

- PostgreSQL runs through Docker Compose.
- A migration creates the `Business` table.
- Invalid payloads receive a clear 400 response.
- A business can be created, listed, fetched by ID, and deleted.
- Data remains after restarting the API container.
- At least one endpoint is manually tested with Bruno, Postman, curl, or Swagger.

## What I Should Understand

- PostgreSQL table, row, column, primary key
- ORM
- Prisma schema
- Migration
- CRUD including partial updates
- REST conventions
- Request validation (full and partial payloads)
- HTTP status codes
- Why linting matters early
- Test runner configuration basics

---

# Milestone 2 — Basic Website Availability Audit

## Goal

Check a business website safely and persist the result.

## Scope

- Add a `WebsiteAudit` model related to `Business`.
- Implement a safe URL validation utility.
- Implement basic HTTP checks:
  - missing URL;
  - allowed protocol;
  - response status;
  - final URL after redirect;
  - response time;
  - reachable/unreachable state;
  - bounded timeout;
  - error reason.
- Add:
  - `POST /businesses/:id/audits`
  - `GET /businesses/:id/audits`
- Persist every audit result.

## Important Learning Note

At this milestone, the audit may initially run synchronously for one business.
The goal is to understand the flow before introducing a queue.

## Do Not Add Yet

- Playwright
- Lighthouse
- Redis
- BullMQ
- Parallel bulk auditing
- AI analysis

## Acceptance Criteria

- The API handles a valid website, redirect, timeout, malformed URL,
  and missing URL predictably.
- Results are saved in PostgreSQL.
- A business can have a visible audit history.
- URL checks have explicit timeouts.
- The implementation does not allow obviously dangerous target URLs.

## What I Should Understand

- `async/await`
- HTTP requests
- timeouts
- redirects
- `try/catch`
- external I/O failures
- database relationships
- why audit results are persisted

---

# Milestone 3 — Deterministic Explainable Lead Scoring

## Goal

Rank businesses using simple, transparent business rules.

## Scope

- Define score rules in a documented place.
- Implement a pure `calculateLeadScore` function.
- Add `LeadScore` persistence or calculate-on-read, after comparing both options.
- Store score reasons, not only the total number.
- Recalculate score after an audit completes.
- Add list sorting and filtering by score.

## Example Rules

- Website URL is missing: `+30`
- Website is unreachable: `+25`
- Website uses HTTP only: `+10`
- Required business details are missing: negative score or review flag
- Website is reachable with HTTPS: lower priority, not necessarily negative

The exact rules should remain configurable and versioned later.

## Do Not Add Yet

- AI-generated score
- Customer-review analysis
- Complex machine learning
- Browser performance audits

## Acceptance Criteria

- The score is reproducible from the same input.
- Every score includes a human-readable reason list.
- Unit tests cover the important score rules and edge cases.
- A user can list businesses sorted by lead score.
- The rules are documented in English.

## What I Should Understand

- Pure functions
- business logic
- deterministic behavior
- unit testing
- edge cases
- separation between business logic and HTTP code

---

# Milestone 4 — CSV Import and Data Quality

## Goal

Import multiple businesses safely and avoid obvious duplicates.

## Scope

- Add CSV import with a documented expected template.
- Validate each row.
- Normalize useful fields:
  - trimmed names;
  - normalized phone;
  - canonical website URL;
  - normalized city/category labels.
- Detect duplicates using practical rules:
  - same normalized website domain;
  - same normalized phone;
  - same normalized name + city.
- Produce an import report:
  - imported;
  - skipped;
  - invalid;
  - possible duplicates.

## Do Not Add Yet

- Automatic Google Maps scraping
- Unbounded crawling
- Mass outreach
- AI analysis for every imported row

## Acceptance Criteria

- A sample CSV can be imported.
- Invalid rows do not break the whole import.
- Duplicate behavior is predictable and documented.
- The user sees an import summary.
- The sample CSV format is documented in the README or docs.

## What I Should Understand

- file parsing
- normalization
- deduplication
- partial failure
- idempotency basics
- batch-processing risks

---

# Milestone 5 — Dashboard MVP

## Goal

Give a non-developer a useful interface for reviewing leads.

## Scope

- Create a minimal React or Next.js frontend.
- Add a lead table with:
  - business name;
  - category;
  - city;
  - website link;
  - latest audit status;
  - lead score;
  - score reasons.
- Add a business detail page.
- Add an action to trigger a website audit.
- Add filtering and sorting.

## Do Not Add Yet

- Fancy design system
- Complex user roles
- Automated outreach
- AI chat interface

## Acceptance Criteria

- A user can inspect, filter, and prioritize leads without Postman.
- A user can open a business and understand its score.
- The frontend handles loading, empty, and error states.
- The API and frontend are documented separately in the README.

## What I Should Understand

- frontend-backend boundary
- REST API consumption
- loading/error state
- UI as a workflow tool, not decoration

---

# Milestone 6 — Background Jobs and Batch Audits

## Goal

Process longer and larger audit tasks without blocking the HTTP API.

## Scope

- Add Redis through Docker Compose.
- Add BullMQ.
- Create a dedicated worker process.
- Move website audits to background jobs.
- Add job status tracking.
- Implement retries with bounded exponential backoff.
- Add concurrency and rate limits.
- Support batch audit execution for selected leads.

## Important Design Questions

- What makes a job idempotent?
- What happens if a worker crashes during an audit?
- What information should be retried and what should be marked failed?
- How should a user see a failed job?

## Acceptance Criteria

- The API accepts an audit request quickly and returns a job status.
- The worker processes the audit separately.
- A failed job is visible and does not crash the API.
- Retries are bounded and observable.
- Batch audit work does not freeze the dashboard.
- Job-related logs make failures diagnosable.

## What I Should Understand

- queue
- worker
- job lifecycle
- retry
- exponential backoff
- idempotency
- asynchronous architecture

---

# Milestone 7 — Richer Technical Audit

## Goal

Detect more valuable, evidence-based digital gaps.

## Scope

- Add safe HTML-level checks:
  - viewport meta tag;
  - contact form presence;
  - WhatsApp/contact links;
  - booking-related links or widgets;
  - basic page title and description presence.
- Add Playwright only if HTTP/HTML checks are insufficient for a specific signal.
- Consider Lighthouse only after measuring its cost and operational complexity.
- Store findings as structured evidence.

## Acceptance Criteria

- Each new signal has a documented detection method.
- Each signal includes evidence or a clear confidence level.
- False-positive limitations are documented.
- New signals can affect the deterministic score transparently.
- The worker remains bounded by timeout, concurrency, and resource limits.

## What I Should Understand

- HTML parsing
- static versus browser-rendered content
- false positives and false negatives
- resource cost of browser automation
- evidence-based automation

---

# Milestone 8 — Structured AI Analysis and Draft Generation

## Goal

Use AI to assist lead review and outreach preparation without turning it into
a black box or autonomous sender.

## Scope

- Add `@google/genai`.
- Define Zod schemas for AI input and output.
- Send only minimized, relevant evidence.
- Request structured output containing:
  - summary;
  - pain-point hypotheses;
  - confidence;
  - evidence references;
  - suggested service;
  - outreach draft.
- Run AI analysis only for selected high-priority leads.
- Persist model name, prompt version, input hash, output, and timestamps.
- Show AI output as a draft/hypothesis in the dashboard.

## Do Not Add Yet

- Automatic sending
- Unreviewed messaging
- LLM-only scoring
- AI analysis for every business by default

## Acceptance Criteria

- AI output is schema-validated before persistence.
- The UI clearly labels AI conclusions as suggestions.
- A user can see the audit evidence used to generate the draft.
- Costs and failures are visible.
- Repeated identical analysis does not unnecessarily repeat the API call.

## What I Should Understand

- LLM input/output contract
- structured output
- schema validation
- prompt versioning
- confidence versus truth
- API cost and rate limits

---

# Milestone 9 — Security, Quality, and Deployment

## Goal

Make the project demonstrably reliable, safe, and portfolio-ready.

## Scope

- Add environment validation.
- Add structured logging.
- Add centralized error handling.
- Add security controls appropriate to public deployment.
- Add rate limiting where relevant.
- Add authentication before multi-user or public access.
- Add CI:
  - install;
  - typecheck;
  - lint;
  - test;
  - build.
- Deploy backend, database, worker, and frontend as appropriate.
- Add health checks and deployment documentation.
- Write a short architecture decision record for major choices.

## Acceptance Criteria

- The project is deployable from documented instructions.
- CI runs on pull requests or pushes.
- Secrets are not committed.
- Tests, typecheck, and build pass.
- README includes architecture, setup, limitations, and a demo workflow.
- The application has a clear error-reporting and logging path.
- A reviewer can understand how to run and evaluate the system.

## What I Should Understand

- environment configuration
- CI/CD basics
- deployment trade-offs
- logs and observability
- secrets management
- production versus local development
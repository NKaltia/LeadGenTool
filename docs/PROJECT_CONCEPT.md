# Project Concept: B2B Prospecting & Technical Audit Platform

## Product Vision

Build a portfolio-quality, production-minded B2B prospecting platform for
local service businesses.

The platform helps a small software-services team identify businesses with
observable digital gaps, prioritize them with explainable lead scores, and
prepare personalized outreach drafts for human review.

Potential services offered to qualified leads may include websites,
mobile-first redesigns, CRM integrations, booking flows, chatbots,
and workflow automation.

The product is not an autonomous mass-outreach system.
Its value comes from reliable data collection, useful technical evidence,
transparent prioritization, and human judgment.

---

## Primary User and Workflow

Primary users are members of a small software-services business who need to
find and evaluate potential local-business clients.

Typical workflow:

1. A user creates a campaign for a target city, niche, and service offer.
2. The user imports businesses manually or from a permitted source.
3. The system validates, normalizes, and deduplicates the records.
4. The system audits a business website using safe, bounded checks.
5. The application calculates an explainable deterministic lead score.
6. For selected high-priority leads, AI produces structured hypotheses and
   a draft outreach message based on the available evidence.
7. A human reviews, edits, approves, and sends outreach outside the system
   or through a future explicitly approved integration.

---

## Product Goals

- Reduce the manual time needed to identify promising local-business leads.
- Surface concrete, observable digital gaps rather than vague assumptions.
- Make lead prioritization explainable, reviewable, and adjustable.
- Help create relevant outreach without automating spam.
- Serve as a real-world learning and portfolio project for backend engineering.

---

## Non-Goals

The first versions will not:

- Automatically send bulk outreach messages.
- Depend on unauthorized scraping or ignore third-party platform terms.
- Use LLM output as the sole source of truth for lead quality.
- Build microservices, Kubernetes, Kafka, or distributed infrastructure
  without a concrete need.
- Attempt to solve every vertical, country, language, or sales workflow.
- Build a full CRM replacement.

Note: The workflow above mentions campaigns (city, niche, service offer).
The `Campaign` entity is intentionally deferred to a future milestone.
Early milestones work with businesses directly, without campaign grouping.

---

## Architecture Principles

### 1. Start as a Modular Monolith

The system starts as one TypeScript application with clear internal modules
and a single deployable backend.

We prefer simple boundaries and explicit data flow over premature distributed
architecture. Ports and adapters may be introduced around external
integrations when they improve testability, replaceability, or clarity.

### 2. Build Incrementally

Each milestone must produce a small, demonstrably working improvement.

We begin with manual business entry and safe basic website checks.
Advanced components such as queues, browser automation, AI analysis,
and a frontend dashboard are introduced only when the preceding workflow
works and the new complexity solves a real problem.

### 3. Keep Lead Scoring Explainable

Lead scores are calculated by deterministic application logic from observable
signals.

Each score must include a machine-readable and human-readable explanation,
for example:

- `website_missing: +30`
- `website_unreachable: +25`
- `no_mobile_viewport: +15`
- `booking_flow_not_detected: +10`

LLM analysis may contribute evidence or hypotheses, but must not silently
become a black-box final scoring authority.

### 4. Use AI as a Structured Assistant

AI is used only after useful audit and business data exists.

The LLM receives a minimized, structured input and returns a schema-constrained
response. Application code validates the response before use.

Schema-valid output is not automatically factually correct.
AI-derived findings must be labelled as hypotheses or recommendations when
they are not directly supported by evidence.

### 5. Keep Humans in Control

The system may create outreach drafts, but it does not autonomously send
messages or make irreversible commercial decisions.

Every draft requires human review and approval.
The product must make the supporting evidence visible next to the draft.

### 6. Design for Safe External I/O

Website audits and external API integrations must be bounded, observable,
and defensive.

Future URL-auditing safeguards include:

- Accept only `http` and `https` URLs.
- Reject loopback, private, link-local, and cloud metadata IP ranges.
- Resolve and validate target hosts before requests.
- Re-validate redirect destinations.
- Apply connection, response, and total execution timeouts.
- Limit redirect count and response size.
- Use an identifiable User-Agent and respect applicable access policies.
- Run browser-based audits in an isolated worker/container when introduced.
- Record failure reasons without exposing secrets.

### 7. Move Long-Running Work to Background Jobs

Small initial checks may run synchronously while the project is local and
limited in scope.

Once the system performs batch imports, repeated audits, browser automation,
or LLM calls, these tasks must run in background workers.
Redis and BullMQ are the planned queue solution, with retries, idempotency,
rate limits, and failure visibility.

---

## Core Data Pipeline

Initial MVP pipeline:

Manual business entry
→ validate input
→ persist business record
→ run basic website audit
→ calculate deterministic lead score
→ show results for human review

Evolved pipeline:

Manual import or permitted source
→ normalize and deduplicate
→ enqueue safe HTTP/website audit
→ persist audit evidence
→ calculate deterministic score with score reasons
→ select high-priority leads
→ enqueue structured AI analysis
→ create outreach draft
→ dashboard-based human review

---

## Planned Technology Stack

Technologies are introduced only when justified by the active milestone.

| Area | Initial Choice | Purpose |
|---|---|---|
| Runtime | Node.js LTS | Backend runtime |
| Language | TypeScript with strict mode | Type safety and maintainability |
| HTTP API | Express.js | Clear, widely understood REST API foundation |
| Database | PostgreSQL | Reliable relational persistence |
| ORM | Prisma | Type-safe data access and migrations |
| Validation | Zod | Validate API input, environment configuration, and AI output |
| Testing | Vitest | Unit and integration testing |
| Local infrastructure | Docker Compose | Reproducible PostgreSQL and later Redis setup |
| Background jobs | Redis + BullMQ | Added when asynchronous batch work is required |
| Website auditing | Safe HTTP checks first; Playwright later | Collect bounded technical signals |
| AI integration | `@google/genai` with structured output | Added after deterministic scoring exists |
| Observability | Structured logs, then error tracking/metrics | Debugging and operational visibility |
| Frontend | React / Next.js | Added once backend workflow is useful |

---

## Initial Success Criteria

The first useful version is successful when a user can:

1. Add or import a business.
2. Store it reliably in PostgreSQL.
3. Run a basic website availability audit.
4. See a deterministic lead score and its reasons.
5. View and sort a list of leads by priority.
6. Understand why a business was flagged.

AI analysis, automated discovery, browser audits, and outreach generation are
valuable later milestones, not requirements for the first usable version.

---

## Engineering Quality Goals

- Clear TypeScript types and no uncontrolled `any`.
- Input validation at all external boundaries.
- Explicit error handling for expected failures.
- Small, coherent Git commits.
- Automated tests for scoring and other pure business logic.
- Reproducible local setup.
- English documentation.
- A README that explains the project, architecture, setup, limitations,
  and real technical decisions.
# ADR-0001: Start as a modular monolith, not microservices

- **Status**: Accepted
- **Date**: 2026-09-13 (retroactive — decision made at project start)
- **Milestone**: M0

## Context

LeadGenTool is a solo-developer, portfolio-quality project with an evolving
scope (CRUD → audits → scoring → AI analysis → dashboard → background jobs).
The team is one junior developer with no prior production experience running
distributed systems. There is no existing traffic, no proven scaling need,
and no organizational reason (multiple independent teams owning separate
services) to split the system up front.

## Decision

Build one deployable TypeScript/Express application with clear internal
module boundaries (routes / domain logic / external integrations kept
separate), instead of splitting into services from day one. Ports-and-adapters
style boundaries are allowed around external integrations (website audits,
AI calls) specifically to keep them swappable and testable in isolation.

## Alternatives Considered

- **Microservices from the start** — rejected. Adds network calls, service
  discovery, distributed transactions, and multiple deployables to reason
  about, with zero current need (no scaling problem, no team ownership
  problem). For a solo learner this multiplies operational complexity without
  a matching lesson — the goal is architectural thinking, not infra trivia.
- **Serverless functions per endpoint** — rejected. Fragments a project that's
  meant to be read end-to-end as one coherent codebase; complicates local
  development with Postgres and background jobs planned later (Milestone 6).

## Consequences

- Easier: one codebase to run, debug, and reason about locally; one CI
  pipeline; refactoring across "module" boundaries is a normal code change,
  not a cross-service migration.
- Harder: nothing currently — no coordination cost was traded away, because
  there was never more than one team.
- Revisit if: a real deployment needs independent scaling of the audit
  worker vs. the API (Milestone 6+ background jobs is the first place this
  could matter), or if the AI-analysis pipeline (Milestone 8) grows expensive
  enough to need isolated deployment and rate limiting from the rest of the app.

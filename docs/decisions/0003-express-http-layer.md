# ADR-0003: Express as the HTTP framework

- **Status**: Accepted
- **Date**: 2026-09-13 (retroactive — decided in Milestone 0)
- **Milestone**: M0

## Context

The project needs a REST HTTP API layer. The developer is learning backend
fundamentals for the second time in a professional sense, and the framework
choice should optimize for transferable, widely-recognized knowledge rather
than for the newest or most opinionated tool.

## Decision

Use Express (stable v5) as the HTTP framework for the initial API.

## Alternatives Considered

- **Fastify** — rejected for now. Faster and has built-in schema validation,
  but Express's ubiquity means the request/response/middleware mental model
  transfers directly to almost any Node.js job posting or codebase, which
  matters more at this stage than raw throughput this project will never
  approach.
- **NestJS** — rejected. Its decorator-based, dependency-injection-heavy
  structure hides a lot of what's happening under an opinionated framework
  layer. Learning what a router, middleware chain, and request lifecycle
  actually do by hand (with Express) first is more valuable before adopting a
  framework that abstracts those concepts away.

## Consequences

- Easier: minimal abstraction between "HTTP request comes in" and "your code
  runs" — the request/response/middleware pipeline is fully visible and
  understood, not hidden behind framework magic.
- Harder: nothing added by hand in Express later (e.g. structured validation
  wiring, DI) has to be built or chosen deliberately, since Express doesn't
  provide it — this is a feature for learning, not a limitation for the
  project's actual scope.
- Revisit if: the project ever needs to scale a team around strict
  conventions and DI (NestJS's strength) — not expected for this project.

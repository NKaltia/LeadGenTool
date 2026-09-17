# ADR-0002: PostgreSQL + Prisma (with driver adapter) for persistence

- **Status**: Accepted
- **Date**: 2026-09-13 (retroactive — decided in Milestone 1)
- **Milestone**: M1

## Context

The domain data is relational by nature: businesses have many website audits,
and later, scores and outreach drafts will reference both. We need reliable
persistence, migrations that are reviewable in Git, and generated TypeScript
types so the application layer doesn't hand-write SQL result shapes.

## Decision

Use PostgreSQL as the database and Prisma ORM (stable v7) as the data access
layer, with `@prisma/adapter-pg` + `pg` for the actual connection, since
Prisma 7 removed its Rust query engine binary and requires an explicit driver
adapter for direct PostgreSQL connections.

## Alternatives Considered

- **MongoDB / a document store** — rejected. The data is inherently relational
  (Business 1—N WebsiteAudit, later scores and outreach tied to both); modeling
  this in a document store would mean simulating joins in application code for
  no benefit.
- **Drizzle ORM** — rejected for now, not because it's worse, but because
  Prisma's migration workflow (`prisma migrate dev`) and generated client are
  better documented for a second-time ORM user, which matters more at this
  learning stage than Drizzle's lighter runtime footprint.
- **Raw SQL with a query builder (Knex)** — rejected. Would teach SQL more
  directly, but at the cost of manually maintaining TypeScript types for every
  query result — a bad trade this early, when the goal is to learn CRUD and
  migrations, not become a query-tuning expert yet.

## Consequences

- Easier: schema changes are tracked as reviewable migration files; the
  Prisma Client gives compile-time-checked query results with no manual type
  duplication.
- Harder: Prisma 7's adapter requirement is a real footgun for anyone
  following outdated tutorials (see the RC-version lesson already logged in
  `docs/learning-log.md`) — must always confirm current stable docs, not
  memorized patterns from older Prisma versions.
- Revisit if: query patterns become complex enough that Prisma's generated
  queries are inefficient and raw SQL / a query builder becomes justified —
  not expected before Milestone 6 or later, if ever.

# ADR-0004: Zod for runtime validation at external boundaries

- **Status**: Accepted
- **Date**: 2026-09-13 (retroactive — decided in Milestone 1)
- **Milestone**: M1

## Context

TypeScript types disappear at runtime — they only guarantee shape at compile
time, based on what the developer *claims* the data looks like. Anything
crossing an external boundary (HTTP request bodies, environment variables,
later: AI model output) is untrusted `unknown` data until it is actually
checked. Milestone 8 also requires validating LLM output against a schema
before persisting it, so the same validation approach needs to work for both.

## Decision

Use Zod to define schemas once and validate all external input (request
bodies now; environment variables and AI output later) against them at
runtime, deriving TypeScript types from the schemas rather than writing
duplicate interfaces by hand.

## Alternatives Considered

- **Hand-written type guards / manual `if` checks** — rejected. Does not
  scale past a couple of fields, easy to forget a case, and duplicates the
  shape already expressed in the TypeScript interface.
- **Joi** — rejected. Older, not TypeScript-first; doesn't infer static types
  from schemas the way Zod does, so you'd still hand-maintain a parallel
  interface.
- **class-validator (decorator-based)** — rejected. Tied to a
  class-instance-based style that fits DI-heavy frameworks (NestJS) more
  naturally than a plain Express setup (see ADR-0003).

## Consequences

- Easier: one schema is both the runtime check and the source of the
  TypeScript type (`z.infer<typeof schema>`) — no drift between the two.
  The same pattern will validate AI output in Milestone 8 without introducing
  a second validation library.
- Harder: nothing significant; Zod adds a small dependency and a bit of
  syntax to learn, which is the intended trade for eliminating a whole class
  of "trusted untrusted data" bugs.
- Revisit if: never expected for this project's scale.

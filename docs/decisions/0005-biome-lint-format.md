# ADR-0005: Biome instead of ESLint + Prettier

- **Status**: Accepted
- **Date**: 2026-09-13 (retroactive — decided in Milestone 1)
- **Milestone**: M1

## Context

The project needs linting (catch likely bugs, enforce consistency) and
formatting (consistent style, no bikeshedding over spacing) from early on,
ideally wired into CI later without a slow or fragile setup.

## Decision

Use Biome (stable v2) as a single Rust-based tool for both linting and
formatting, instead of the traditional ESLint + Prettier combination.

## Alternatives Considered

- **ESLint + Prettier** — rejected for now. Still the more common combo in
  existing production codebases (worth knowing it exists and roughly how its
  config works, since new jobs will likely use it), but requires maintaining
  two tools, two configs, and a plugin to make them not fight each other over
  formatting rules.

## Consequences

- Easier: one fast tool, one config file, no ESLint/Prettier conflict
  resolution to debug.
- Harder: Biome's plugin/rule ecosystem is smaller than ESLint's — if a very
  specific lint rule is ever needed that only exists as an ESLint plugin,
  this would force a re-evaluation.
- Note: since ESLint + Prettier remains the more common combination in
  industry codebases, it's still worth reading a couple of typical
  `.eslintrc` configs at some point purely for pattern-recognition when
  joining an existing codebase — this is a 🟢 reference-level gap, not a
  blocker.
- Revisit if: a specific lint rule only available via an ESLint plugin
  becomes necessary.

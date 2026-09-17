# ADR-0006: SSRF-safe URL validation and redirect handling

- **Status**: Accepted
- **Date**: 2026-09-17
- **Milestone**: M2

## Context

The website audit feature makes outgoing HTTP requests to target URLs provided
by external users. Without validation, this creates a critical Server-Side
Request Forgery (SSRF) vulnerability: an attacker could target internal services
(PostgreSQL on port 5432, local Docker network), loopback (`localhost`,
`127.0.0.1`), or cloud provider instance metadata endpoints (`169.254.169.254`),
either directly or via HTTP redirects (`301`/`302`).

## Decision

Extract URL safety validation into a dedicated module (`src/lib/safeUrl.ts`) that
pre-resolves hostnames with `dns.promises.lookup`, verifies that every resolved IP
is a public unicast address using `ipaddr.js`, and handles redirects manually
(`redirect: "manual"`) in `checkWebsiteAvailability`, re-validating the target URL
at every hop (up to a 5-hop limit).

## Alternatives Considered

- **Hand-written CIDR list / regexes** — rejected. Hand-crafting IP range
  checks is notoriously error-prone (easy to miss IPv4-mapped IPv6 bypasses like
  `::ffff:127.0.0.1`, link-local ranges, or carrier-grade NAT). Using the
  zero-dependency, battle-tested `ipaddr.js` package guarantees accurate RFC range
  categorization.
- **Custom Undici Agent / Socket-level IP pinning** — deferred. Connecting
  directly to the pinned IP rather than allowing `fetch` to resolve the hostname
  again completely eliminates the DNS rebinding race condition. However, it
  requires custom socket/TLS dispatchers that add significant complexity before
  production deployment demands it.

## Consequences

- Easier: Strong, automated protection against internal network access, cloud
  metadata scraping, and redirect-based SSRF. The `validateSafeUrl` utility is
  isolated and reusable for future web scraping or asset fetching features.
- Known Limitation & Residual Risk: A narrow time-of-check to time-of-use
  (TOCTOU) DNS rebinding window remains between the DNS pre-check and the `fetch`
  request. If an attacker controls the authoritative DNS server and sets a 0-second
  TTL, the IP could theoretically shift to a private address between validation
  and connection.
- Revisit if: The platform is deployed in a public multi-tenant cloud environment
  where DNS rebinding poses a direct threat, justifying socket-level IP pinning.

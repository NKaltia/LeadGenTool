import type { LookupAddress } from "node:dns";
import dns from "node:dns/promises";
import net from "node:net";
import ipaddr from "ipaddr.js";

export type SafeUrlErrorReason =
  | "MISSING_URL"
  | "INVALID_URL"
  | "UNSUPPORTED_PROTOCOL"
  | "UNSAFE_TARGET"
  | "UNREACHABLE";

export interface SafeUrlSuccess {
  safe: true;
  parsedUrl: URL;
  resolvedIps: string[];
}

export interface SafeUrlFailure {
  safe: false;
  errorReason: SafeUrlErrorReason;
  parsedUrl?: URL;
}

export type SafeUrlResult = SafeUrlSuccess | SafeUrlFailure;

export type DnsLookupFn = (
  hostname: string,
  options: { all: true },
) => Promise<LookupAddress[]>;

/**
 * Checks if a single IP address string is a safe public IP (unicast).
 * Blocks loopback, private networks, link-local / cloud metadata (169.254.0.0/16),
 * carrier-grade NAT, multicast, broadcast, and unspecified ranges.
 */
export function isPublicIp(ipString: string): boolean {
  try {
    const cleanIp = ipString.replace(/^\[|\]$/g, "");
    const parsed = ipaddr.parse(cleanIp);
    const normalized =
      parsed.kind() === "ipv6" && (parsed as ipaddr.IPv6).isIPv4MappedAddress()
        ? (parsed as ipaddr.IPv6).toIPv4Address()
        : parsed;

    return normalized.range() === "unicast";
  } catch {
    return false;
  }
}

/**
 * Validates whether a URL is safe to fetch:
 * 1. Non-empty string
 * 2. Valid URL syntax
 * 3. HTTP or HTTPS protocol only
 * 4. Resolves all hostname IPs and verifies that EVERY IP is a public unicast IP
 */
export async function validateSafeUrl(
  rawUrl: string | null | undefined,
  lookupFn: DnsLookupFn = (hostname, options) => dns.lookup(hostname, options),
): Promise<SafeUrlResult> {
  if (!rawUrl || rawUrl.trim() === "") {
    return { safe: false, errorReason: "MISSING_URL" };
  }

  const trimmed = rawUrl.trim();

  let parsed: URL;
  try {
    parsed = new URL(trimmed);
  } catch {
    return { safe: false, errorReason: "INVALID_URL" };
  }

  if (parsed.protocol !== "http:" && parsed.protocol !== "https:") {
    return {
      safe: false,
      errorReason: "UNSUPPORTED_PROTOCOL",
      parsedUrl: parsed,
    };
  }

  const rawHostname = parsed.hostname.toLowerCase();
  const cleanHostname = rawHostname.replace(/^\[|\]$/g, "");

  // If the hostname is already an IP literal
  if (net.isIP(cleanHostname)) {
    if (!isPublicIp(cleanHostname)) {
      return { safe: false, errorReason: "UNSAFE_TARGET", parsedUrl: parsed };
    }
    return { safe: true, parsedUrl: parsed, resolvedIps: [cleanHostname] };
  }

  // Resolve DNS to verify all associated IP addresses
  let addresses: LookupAddress[];
  try {
    addresses = await lookupFn(cleanHostname, { all: true });
  } catch {
    return { safe: false, errorReason: "UNREACHABLE", parsedUrl: parsed };
  }

  if (!addresses || addresses.length === 0) {
    return { safe: false, errorReason: "UNREACHABLE", parsedUrl: parsed };
  }

  const resolvedIps = addresses.map((a) => a.address);

  // All resolved IPs must be public unicast
  const allSafe = resolvedIps.every((ip) => isPublicIp(ip));
  if (!allSafe) {
    return { safe: false, errorReason: "UNSAFE_TARGET", parsedUrl: parsed };
  }

  return { safe: true, parsedUrl: parsed, resolvedIps };
}

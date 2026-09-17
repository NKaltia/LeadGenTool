import { describe, expect, it } from "vitest";
import {
  type DnsLookupFn,
  isPublicIp,
  validateSafeUrl,
} from "../../src/lib/safeUrl.js";

describe("safeUrl", () => {
  describe("isPublicIp", () => {
    it("should reject IPv4 loopback addresses", () => {
      expect(isPublicIp("127.0.0.1")).toBe(false);
      expect(isPublicIp("127.0.1.1")).toBe(false);
    });

    it("should reject IPv6 loopback address", () => {
      expect(isPublicIp("::1")).toBe(false);
    });

    it("should reject RFC 1918 private IPv4 addresses", () => {
      expect(isPublicIp("10.0.0.1")).toBe(false);
      expect(isPublicIp("172.16.0.1")).toBe(false);
      expect(isPublicIp("172.31.255.255")).toBe(false);
      expect(isPublicIp("192.168.1.1")).toBe(false);
      expect(isPublicIp("192.168.0.254")).toBe(false);
    });

    it("should reject link-local and cloud metadata addresses (169.254.0.0/16)", () => {
      expect(isPublicIp("169.254.169.254")).toBe(false);
      expect(isPublicIp("169.254.1.1")).toBe(false);
      expect(isPublicIp("fe80::1")).toBe(false);
    });

    it("should reject IPv4-mapped IPv6 bypass attempts", () => {
      expect(isPublicIp("::ffff:127.0.0.1")).toBe(false);
      expect(isPublicIp("::ffff:169.254.169.254")).toBe(false);
      expect(isPublicIp("::ffff:192.168.1.1")).toBe(false);
    });

    it("should reject 0.0.0.0 and broadcast addresses", () => {
      expect(isPublicIp("0.0.0.0")).toBe(false);
      expect(isPublicIp("255.255.255.255")).toBe(false);
    });

    it("should accept valid public unicast IPv4 addresses", () => {
      expect(isPublicIp("8.8.8.8")).toBe(true);
      expect(isPublicIp("1.1.1.1")).toBe(true);
      expect(isPublicIp("93.184.216.34")).toBe(true);
    });

    it("should accept valid public unicast IPv6 addresses", () => {
      expect(isPublicIp("2606:4700:4700::1111")).toBe(true);
    });
  });

  describe("validateSafeUrl", () => {
    it("should return MISSING_URL for null, undefined, or empty strings", async () => {
      expect(await validateSafeUrl(null)).toEqual({
        safe: false,
        errorReason: "MISSING_URL",
      });
      expect(await validateSafeUrl("")).toEqual({
        safe: false,
        errorReason: "MISSING_URL",
      });
      expect(await validateSafeUrl("   ")).toEqual({
        safe: false,
        errorReason: "MISSING_URL",
      });
    });

    it("should return INVALID_URL for unparseable strings", async () => {
      expect(await validateSafeUrl("not-a-url")).toEqual({
        safe: false,
        errorReason: "INVALID_URL",
      });
    });

    it("should return UNSUPPORTED_PROTOCOL for non-http(s) protocols", async () => {
      const ftp = await validateSafeUrl("ftp://files.example.com");
      expect(ftp.safe).toBe(false);
      expect(ftp.errorReason).toBe("UNSUPPORTED_PROTOCOL");

      const file = await validateSafeUrl("file:///etc/passwd");
      expect(file.safe).toBe(false);
      expect(file.errorReason).toBe("UNSUPPORTED_PROTOCOL");
    });

    it("should return UNSAFE_TARGET for IP literals that are private or loopback", async () => {
      const localhost = await validateSafeUrl("http://127.0.0.1:8080");
      expect(localhost).toMatchObject({
        safe: false,
        errorReason: "UNSAFE_TARGET",
      });

      const metadata = await validateSafeUrl(
        "http://169.254.169.254/latest/meta-data/",
      );
      expect(metadata).toMatchObject({
        safe: false,
        errorReason: "UNSAFE_TARGET",
      });

      const privateIp = await validateSafeUrl("http://192.168.1.1/admin");
      expect(privateIp).toMatchObject({
        safe: false,
        errorReason: "UNSAFE_TARGET",
      });
    });

    it("should reject hostname resolving to private IP address via DNS", async () => {
      const mockLookup: DnsLookupFn = async () => [
        { address: "192.168.1.50", family: 4 },
      ];

      const result = await validateSafeUrl("http://internal.corp", mockLookup);
      expect(result).toMatchObject({
        safe: false,
        errorReason: "UNSAFE_TARGET",
      });
    });

    it("should reject hostname if any resolved IP is non-public", async () => {
      const mockLookup: DnsLookupFn = async () => [
        { address: "93.184.216.34", family: 4 }, // public
        { address: "10.0.0.5", family: 4 }, // private
      ];

      const result = await validateSafeUrl("http://mixed-dns.com", mockLookup);
      expect(result).toMatchObject({
        safe: false,
        errorReason: "UNSAFE_TARGET",
      });
    });

    it("should return UNREACHABLE if DNS resolution fails", async () => {
      const mockLookup: DnsLookupFn = async () => {
        throw new Error("getaddrinfo ENOTFOUND non-existent.xyz");
      };

      const result = await validateSafeUrl(
        "http://non-existent.xyz",
        mockLookup,
      );
      expect(result).toMatchObject({
        safe: false,
        errorReason: "UNREACHABLE",
      });
    });

    it("should accept hostname when all resolved IPs are public unicast", async () => {
      const mockLookup: DnsLookupFn = async () => [
        { address: "93.184.216.34", family: 4 },
      ];

      const result = await validateSafeUrl("https://example.com", mockLookup);
      expect(result.safe).toBe(true);
      if (result.safe) {
        expect(result.resolvedIps).toEqual(["93.184.216.34"]);
      }
    });
  });
});

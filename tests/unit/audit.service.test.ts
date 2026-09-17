import { afterEach, describe, expect, it, vi } from "vitest";
import { checkWebsiteAvailability } from "../../src/services/audit.service.js";

// Mock DNS lookup so unit tests are 100% deterministic and offline-safe
vi.mock("node:dns/promises", () => ({
  default: {
    lookup: vi.fn().mockImplementation(async (hostname: string) => {
      if (hostname === "localhost") {
        return [
          { address: "127.0.0.1", family: 4 },
          { address: "::1", family: 6 },
        ];
      }
      if (hostname === "internal.corp") {
        return [{ address: "192.168.1.50", family: 4 }];
      }
      if (hostname === "dead-domain.xyz") {
        throw new Error("getaddrinfo ENOTFOUND dead-domain.xyz");
      }
      // Public IP for all other valid simulated domains
      return [{ address: "93.184.216.34", family: 4 }];
    }),
  },
}));

describe("audit.service", () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe("checkWebsiteAvailability - Input Validation & SSRF targets", () => {
    it("should return MISSING_URL when URL is null or undefined", async () => {
      const nullResult = await checkWebsiteAvailability(null);
      expect(nullResult.isReachable).toBe(false);
      expect(nullResult.errorReason).toBe("MISSING_URL");

      const undefinedResult = await checkWebsiteAvailability(undefined);
      expect(undefinedResult.isReachable).toBe(false);
      expect(undefinedResult.errorReason).toBe("MISSING_URL");
    });

    it("should return MISSING_URL when URL is empty or whitespace", async () => {
      const emptyResult = await checkWebsiteAvailability("");
      expect(emptyResult.isReachable).toBe(false);
      expect(emptyResult.errorReason).toBe("MISSING_URL");

      const spacesResult = await checkWebsiteAvailability("   ");
      expect(spacesResult.isReachable).toBe(false);
      expect(spacesResult.errorReason).toBe("MISSING_URL");
    });

    it("should return INVALID_URL when URL cannot be parsed", async () => {
      const result = await checkWebsiteAvailability("not a valid url");
      expect(result.isReachable).toBe(false);
      expect(result.errorReason).toBe("INVALID_URL");
    });

    it("should return UNSUPPORTED_PROTOCOL for non-http(s) protocols", async () => {
      const ftpResult = await checkWebsiteAvailability("ftp://ftp.example.com");
      expect(ftpResult.isReachable).toBe(false);
      expect(ftpResult.errorReason).toBe("UNSUPPORTED_PROTOCOL");

      const fileResult = await checkWebsiteAvailability("file:///etc/passwd");
      expect(fileResult.isReachable).toBe(false);
      expect(fileResult.errorReason).toBe("UNSUPPORTED_PROTOCOL");
    });

    it("should return UNSAFE_TARGET for private IP literals, loopback and cloud metadata", async () => {
      const localhost = await checkWebsiteAvailability("http://127.0.0.1:8080");
      expect(localhost.isReachable).toBe(false);
      expect(localhost.errorReason).toBe("UNSAFE_TARGET");

      const metadata = await checkWebsiteAvailability(
        "http://169.254.169.254/latest/meta-data/",
      );
      expect(metadata.isReachable).toBe(false);
      expect(metadata.errorReason).toBe("UNSAFE_TARGET");

      const privateIp = await checkWebsiteAvailability("http://192.168.1.1");
      expect(privateIp.isReachable).toBe(false);
      expect(privateIp.errorReason).toBe("UNSAFE_TARGET");
    });

    it("should return UNSAFE_TARGET when hostname resolves to private IP", async () => {
      const result = await checkWebsiteAvailability("http://internal.corp");
      expect(result.isReachable).toBe(false);
      expect(result.errorReason).toBe("UNSAFE_TARGET");
    });
  });

  describe("checkWebsiteAvailability - Network Simulation (Mocked Fetch)", () => {
    it("should return reachable with status 200 on successful response", async () => {
      vi.stubGlobal(
        "fetch",
        vi.fn().mockResolvedValue({
          status: 200,
          headers: new Headers(),
          url: "https://example.com/",
        }),
      );

      const result = await checkWebsiteAvailability("https://example.com");

      expect(result.isReachable).toBe(true);
      expect(result.httpStatus).toBe(200);
      expect(result.finalUrl).toBe("https://example.com/");
      expect(result.errorReason).toBeNull();
      expect(typeof result.responseTimeMs).toBe("number");
    });

    it("should consider 404 or 500 as reachable because the server responded", async () => {
      vi.stubGlobal(
        "fetch",
        vi.fn().mockResolvedValue({
          status: 500,
          headers: new Headers(),
          url: "https://broken-server.com/",
        }),
      );

      const result = await checkWebsiteAvailability(
        "https://broken-server.com",
      );

      expect(result.isReachable).toBe(true);
      expect(result.httpStatus).toBe(500);
      expect(result.errorReason).toBeNull();
    });

    it("should follow safe redirects to final URL", async () => {
      const fetchMock = vi
        .fn()
        .mockResolvedValueOnce({
          status: 301,
          headers: new Headers({ location: "https://example.com/welcome" }),
          url: "http://example.com",
        })
        .mockResolvedValueOnce({
          status: 200,
          headers: new Headers(),
          url: "https://example.com/welcome",
        });

      vi.stubGlobal("fetch", fetchMock);

      const result = await checkWebsiteAvailability("http://example.com");

      expect(result.isReachable).toBe(true);
      expect(result.httpStatus).toBe(200);
      expect(result.finalUrl).toBe("https://example.com/welcome");
      expect(result.errorReason).toBeNull();
      expect(fetchMock).toHaveBeenCalledTimes(2);
    });

    it("should reject redirect to private or metadata IP with UNSAFE_TARGET", async () => {
      const fetchMock = vi.fn().mockResolvedValueOnce({
        status: 302,
        headers: new Headers({
          location: "http://169.254.169.254/latest/meta-data/",
        }),
        url: "https://evil.com",
      });

      vi.stubGlobal("fetch", fetchMock);

      const result = await checkWebsiteAvailability("https://evil.com");

      expect(result.isReachable).toBe(false);
      expect(result.errorReason).toBe("UNSAFE_TARGET");
      expect(result.finalUrl).toBe("http://169.254.169.254/latest/meta-data/");
      // Should not follow the unsafe redirect
      expect(fetchMock).toHaveBeenCalledTimes(1);
    });

    it("should reject redirect loop (> 5 hops) with TOO_MANY_REDIRECTS", async () => {
      const fetchMock = vi.fn().mockImplementation((url: string) => {
        return Promise.resolve({
          status: 302,
          headers: new Headers({ location: "https://example.com/loop" }),
          url,
        });
      });

      vi.stubGlobal("fetch", fetchMock);

      const result = await checkWebsiteAvailability("https://example.com/loop");

      expect(result.isReachable).toBe(false);
      expect(result.errorReason).toBe("TOO_MANY_REDIRECTS");
      // 1 initial + 5 redirects = 6 attempts
      expect(fetchMock).toHaveBeenCalledTimes(6);
    });

    it("should return TIMEOUT when fetch throws TimeoutError", async () => {
      const timeoutError = new Error(
        "The operation was aborted due to timeout",
      );
      timeoutError.name = "TimeoutError";

      vi.stubGlobal("fetch", vi.fn().mockRejectedValue(timeoutError));

      const result = await checkWebsiteAvailability("https://slow-site.com");

      expect(result.isReachable).toBe(false);
      expect(result.httpStatus).toBeNull();
      expect(result.errorReason).toBe("TIMEOUT");
    });

    it("should return UNREACHABLE on generic network failure", async () => {
      vi.stubGlobal(
        "fetch",
        vi.fn().mockRejectedValue(new TypeError("fetch failed")),
      );

      const result = await checkWebsiteAvailability("https://dead-domain.xyz");

      expect(result.isReachable).toBe(false);
      expect(result.httpStatus).toBeNull();
      expect(result.errorReason).toBe("UNREACHABLE");
    });
  });
});

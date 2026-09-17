import { validateSafeUrl } from "../lib/safeUrl.js";

export interface AuditResult {
  url: string;
  isReachable: boolean;
  httpStatus: number | null;
  responseTimeMs: number | null;
  finalUrl: string | null;
  errorReason: string | null;
}

const DEFAULT_TIMEOUT_MS = 5000;
const MAX_REDIRECT_HOPS = 5;

/**
 * Safely checks if a website is reachable, measures response time,
 * handles redirects with re-validation against SSRF, and classifies network failures.
 */
export async function checkWebsiteAvailability(
  rawUrl: string | null | undefined,
  timeoutMs: number = DEFAULT_TIMEOUT_MS,
): Promise<AuditResult> {
  const initialTrimmed = (rawUrl ?? "").trim();

  // 1. Initial URL validation (syntax, protocol, DNS, private IP / cloud metadata)
  const initialValidation = await validateSafeUrl(rawUrl);
  if (!initialValidation.safe) {
    return {
      url: initialTrimmed,
      isReachable: false,
      httpStatus: null,
      responseTimeMs: null,
      finalUrl: null,
      errorReason: initialValidation.errorReason,
    };
  }

  let currentUrl = initialValidation.parsedUrl.toString();
  let redirectCount = 0;
  const startTime = performance.now();

  try {
    while (true) {
      const response = await fetch(currentUrl, {
        method: "GET",
        signal: AbortSignal.timeout(timeoutMs),
        redirect: "manual",
        headers: {
          "User-Agent": "LeadGenTool-AuditBot/1.0",
        },
      });

      const isRedirect =
        response.status >= 300 &&
        response.status < 400 &&
        response.headers.has("location");

      if (isRedirect) {
        redirectCount++;
        if (redirectCount > MAX_REDIRECT_HOPS) {
          const responseTimeMs = Math.round(performance.now() - startTime);
          return {
            url: initialTrimmed,
            isReachable: false,
            httpStatus: response.status,
            responseTimeMs,
            finalUrl: currentUrl,
            errorReason: "TOO_MANY_REDIRECTS",
          };
        }

        const locationHeader = response.headers.get("location");
        if (!locationHeader) {
          const responseTimeMs = Math.round(performance.now() - startTime);
          return {
            url: initialTrimmed,
            isReachable: false,
            httpStatus: response.status,
            responseTimeMs,
            finalUrl: currentUrl,
            errorReason: "INVALID_URL",
          };
        }

        let nextUrl: URL;
        try {
          nextUrl = new URL(locationHeader, currentUrl);
        } catch {
          const responseTimeMs = Math.round(performance.now() - startTime);
          return {
            url: initialTrimmed,
            isReachable: false,
            httpStatus: response.status,
            responseTimeMs,
            finalUrl: currentUrl,
            errorReason: "INVALID_URL",
          };
        }

        // Validate redirected URL before hopping
        const nextValidation = await validateSafeUrl(nextUrl.toString());
        if (!nextValidation.safe) {
          const responseTimeMs = Math.round(performance.now() - startTime);
          return {
            url: initialTrimmed,
            isReachable: false,
            httpStatus: null,
            responseTimeMs,
            finalUrl: nextUrl.toString(),
            errorReason: nextValidation.errorReason,
          };
        }

        currentUrl = nextValidation.parsedUrl.toString();
        continue;
      }

      // Terminal response (2xx, 4xx, 5xx)
      const responseTimeMs = Math.round(performance.now() - startTime);
      return {
        url: initialTrimmed,
        isReachable: true,
        httpStatus: response.status,
        responseTimeMs,
        finalUrl: currentUrl,
        errorReason: null,
      };
    }
  } catch (error: unknown) {
    const responseTimeMs = Math.round(performance.now() - startTime);

    if (
      error instanceof Error &&
      (error.name === "TimeoutError" || error.name === "AbortError")
    ) {
      return {
        url: initialTrimmed,
        isReachable: false,
        httpStatus: null,
        responseTimeMs,
        finalUrl: currentUrl,
        errorReason: "TIMEOUT",
      };
    }

    return {
      url: initialTrimmed,
      isReachable: false,
      httpStatus: null,
      responseTimeMs,
      finalUrl: currentUrl,
      errorReason: "UNREACHABLE",
    };
  }
}

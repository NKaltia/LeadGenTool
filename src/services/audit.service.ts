import { type SafeUrlErrorReason, validateSafeUrl } from "../lib/safeUrl.js";

export type AuditErrorReason =
  | SafeUrlErrorReason
  | "TIMEOUT"
  | "TOO_MANY_REDIRECTS";

export interface AuditResult {
  url: string;
  isReachable: boolean;
  httpStatus: number | null;
  responseTimeMs: number | null;
  finalUrl: string | null;
  errorReason: AuditErrorReason | null;
}

const DEFAULT_HOP_TIMEOUT_MS = 5000;
const DEFAULT_TOTAL_TIMEOUT_MS = 10_000;
const MAX_REDIRECT_HOPS = 5;

function isTimeoutError(error: unknown): boolean {
  return (
    error instanceof Error &&
    (error.name === "TimeoutError" || error.name === "AbortError")
  );
}

// dns.lookup cannot be cancelled, so it is raced against the audit deadline.
function withDeadline<T>(promise: Promise<T>, signal: AbortSignal): Promise<T> {
  return new Promise<T>((resolve, reject) => {
    if (signal.aborted) {
      reject(signal.reason);
      return;
    }
    signal.addEventListener("abort", () => reject(signal.reason), {
      once: true,
    });
    promise.then(resolve, reject);
  });
}

/**
 * Safely checks if a website is reachable, measures response time,
 * follows redirects manually with SSRF re-validation at every hop, and
 * classifies failures. The whole audit is bounded by one total deadline
 * in addition to a per-request timeout.
 */
export async function checkWebsiteAvailability(
  rawUrl: string | null | undefined,
  hopTimeoutMs: number = DEFAULT_HOP_TIMEOUT_MS,
  totalTimeoutMs: number = DEFAULT_TOTAL_TIMEOUT_MS,
): Promise<AuditResult> {
  const initialUrl = (rawUrl ?? "").trim();
  const startTime = performance.now();
  const deadline = AbortSignal.timeout(totalTimeoutMs);
  let currentUrl: string | null = null;

  const finish = (fields: Partial<Omit<AuditResult, "url">>): AuditResult => ({
    url: initialUrl,
    isReachable: false,
    httpStatus: null,
    responseTimeMs: Math.round(performance.now() - startTime),
    finalUrl: null,
    errorReason: null,
    ...fields,
  });

  try {
    const initialValidation = await withDeadline(
      validateSafeUrl(rawUrl),
      deadline,
    );
    if (!initialValidation.safe) {
      return finish({
        responseTimeMs: null,
        errorReason: initialValidation.errorReason,
      });
    }

    currentUrl = initialValidation.parsedUrl.toString();

    for (let hop = 0; ; hop++) {
      const response = await fetch(currentUrl, {
        method: "GET",
        redirect: "manual",
        signal: AbortSignal.any([deadline, AbortSignal.timeout(hopTimeoutMs)]),
        headers: { "User-Agent": "LeadGenTool-AuditBot/1.0" },
      });

      // Only the status and headers matter; release the connection right away.
      await response.body?.cancel().catch(() => undefined);

      const location = response.headers.get("location");
      const isRedirect =
        response.status >= 300 && response.status < 400 && location !== null;

      if (!isRedirect) {
        return finish({
          isReachable: true,
          httpStatus: response.status,
          finalUrl: currentUrl,
        });
      }

      if (hop >= MAX_REDIRECT_HOPS) {
        return finish({
          httpStatus: response.status,
          finalUrl: currentUrl,
          errorReason: "TOO_MANY_REDIRECTS",
        });
      }

      let nextUrl: URL;
      try {
        nextUrl = new URL(location, currentUrl);
      } catch {
        return finish({
          httpStatus: response.status,
          finalUrl: currentUrl,
          errorReason: "INVALID_URL",
        });
      }

      const nextValidation = await withDeadline(
        validateSafeUrl(nextUrl.toString()),
        deadline,
      );
      if (!nextValidation.safe) {
        return finish({
          finalUrl: nextUrl.toString(),
          errorReason: nextValidation.errorReason,
        });
      }

      currentUrl = nextValidation.parsedUrl.toString();
    }
  } catch (error: unknown) {
    return finish({
      finalUrl: currentUrl,
      errorReason: isTimeoutError(error) ? "TIMEOUT" : "UNREACHABLE",
    });
  }
}

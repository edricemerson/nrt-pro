import "server-only";

/**
 * Fixed-window rate limiter for authentication endpoints.
 *
 * Without this, nothing stops someone posting passwords at the login routes
 * until one works - bcrypt makes each guess slow, but not slow enough to
 * matter across millions of attempts.
 *
 * LIMITATION: state lives in this process's memory. On a single server (or
 * `next start` on one box) that is exactly right. On Vercel/serverless or any
 * multi-instance deploy, each instance keeps its own counter, so the
 * effective limit multiplies by the instance count and resets on cold start.
 * If you deploy across instances, move this to Postgres or Upstash Redis -
 * only this file needs to change.
 */

interface Window {
  count: number;
  /** Epoch ms when this window resets. */
  resetAt: number;
}

const buckets = new Map<string, Window>();

/** Stops the Map growing without bound on a long-lived server. */
function sweep(now: number) {
  if (buckets.size < 5_000) return;
  for (const [key, w] of buckets) {
    if (w.resetAt <= now) buckets.delete(key);
  }
}

export interface RateLimitResult {
  ok: boolean;
  /** Attempts left in the current window. */
  remaining: number;
  /** Seconds until the window resets - sent as Retry-After. */
  retryAfter: number;
}

export function rateLimit(
  key: string,
  { limit, windowMs }: { limit: number; windowMs: number },
): RateLimitResult {
  const now = Date.now();
  sweep(now);

  const existing = buckets.get(key);
  if (!existing || existing.resetAt <= now) {
    buckets.set(key, { count: 1, resetAt: now + windowMs });
    return { ok: true, remaining: limit - 1, retryAfter: 0 };
  }

  existing.count += 1;
  const retryAfter = Math.max(1, Math.ceil((existing.resetAt - now) / 1000));
  if (existing.count > limit) {
    return { ok: false, remaining: 0, retryAfter };
  }
  return { ok: true, remaining: limit - existing.count, retryAfter };
}

/** Clears a key's window - call after a success so one good login resets the count. */
export function resetRateLimit(key: string): void {
  buckets.delete(key);
}

/**
 * Best-effort client IP. Behind a proxy the socket address is the proxy, so
 * the forwarded headers are used first. These headers are spoofable unless
 * your host overwrites them (Vercel and most CDNs do), which is why the
 * login routes also rate-limit per email address.
 */
export function clientIp(req: Request): string {
  const forwarded = req.headers.get("x-forwarded-for");
  if (forwarded) return forwarded.split(",")[0]!.trim();
  return req.headers.get("x-real-ip") ?? "unknown";
}

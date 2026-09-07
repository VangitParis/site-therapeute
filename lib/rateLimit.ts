// lib/rateLimit.ts
//
// Lightweight in-memory rate limiter for API routes. It blunts casual abuse
// and brute-force attempts within a single warm serverless instance, but it
// is NOT shared across concurrent instances/regions — a determined attacker
// spreading requests across many cold starts isn't fully stopped by this.
// For that, swap this module for one backed by a shared store (e.g. Upstash
// Redis) — callers only use `checkRateLimit(key, limit, windowMs)`, so
// nothing else needs to change.
//
// Good enough today for: admin login brute force, contact/sendmail spam,
// and OpenAI cost abuse on a low/medium-traffic site.

const buckets = new Map<string, { count: number; resetAt: number }>();

/** Returns true if the call is allowed, false if `key` is over `limit` calls per `windowMs`. */
export function checkRateLimit(key: string, limit: number, windowMs: number): boolean {
  const now = Date.now();
  const bucket = buckets.get(key);

  if (!bucket || now > bucket.resetAt) {
    buckets.set(key, { count: 1, resetAt: now + windowMs });
    // Piggyback a cheap opportunistic cleanup so the map doesn't grow forever.
    if (buckets.size > 5000) {
      for (const [k, v] of buckets) {
        if (now > v.resetAt) buckets.delete(k);
      }
    }
    return true;
  }

  if (bucket.count >= limit) return false;
  bucket.count += 1;
  return true;
}

/** Best-effort client IP from standard proxy headers (Vercel sets x-forwarded-for). */
export function getClientIp(req: { headers: Record<string, string | string[] | undefined> }): string {
  const fwd = req.headers['x-forwarded-for'];
  if (typeof fwd === 'string' && fwd.length > 0) return fwd.split(',')[0].trim();
  if (Array.isArray(fwd) && fwd.length > 0) return fwd[0];
  return 'unknown';
}

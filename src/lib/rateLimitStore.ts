import { db } from "@/db";
import { rateLimitBuckets } from "@/db/schema";
import { eq } from "drizzle-orm";
import {
  computeTokenBucket,
  type TokenBucketCheckResult,
  type TokenBucketConfig,
} from "@/lib/rateLimit";

function toPositiveInt(value: number, fallback: number): number {
  if (!Number.isFinite(value)) return fallback;
  const n = Math.floor(value);
  return n > 0 ? n : fallback;
}

export async function consumeUserUrlCreateToken(params: {
  userId: string;
  now?: Date;
  cost?: number;
}): Promise<{ result: TokenBucketCheckResult }>
{
  const now = params.now ?? new Date();
  const cost = toPositiveInt(params.cost ?? 1, 1);

  const cfg: TokenBucketConfig = {
    capacity: 20,
    refillTokens: 10,
    refillIntervalMs: 20 * 60 * 1000,
  };

  const key = `create_url:${params.userId}`;

  const existing = await db
    .select()
    .from(rateLimitBuckets)
    .where(eq(rateLimitBuckets.key, key))
    .limit(1);

  const prev = existing.length
    ? {
        tokens: existing[0]!.tokens,
        updatedAtMs: new Date(existing[0]!.updatedAt).getTime(),
      }
    : null;

  const { next, result } = computeTokenBucket(now.getTime(), prev, cfg, cost);

  if (!existing.length) {
    if (result.allowed) {
      await db.insert(rateLimitBuckets).values({
        key,
        tokens: next.tokens,
        updatedAt: new Date(next.updatedAtMs),
      });
    }

    return { result };
  }

  const shouldPersist = result.allowed || next.updatedAtMs !== prev!.updatedAtMs;

  if (shouldPersist) {
    await db
      .update(rateLimitBuckets)
      .set({ tokens: next.tokens, updatedAt: new Date(next.updatedAtMs) })
      .where(eq(rateLimitBuckets.key, key));
  }

  return { result };
}

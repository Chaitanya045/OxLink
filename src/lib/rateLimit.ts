export type TokenBucketConfig = {
  capacity: number;
  refillTokens: number;
  refillIntervalMs: number;
};

export type TokenBucketState = {
  tokens: number;
  updatedAtMs: number;
};

export type TokenBucketCheckResult = {
  allowed: boolean;
  remaining: number;
  retryAfterMs: number | null;
};

export function computeTokenBucket(
  nowMs: number,
  prev: TokenBucketState | null,
  cfg: TokenBucketConfig,
  cost: number
): { next: TokenBucketState; result: TokenBucketCheckResult } {
  const capacity = cfg.capacity;

  const prevTokens = prev ? prev.tokens : capacity;
  const prevUpdatedAtMs = prev ? prev.updatedAtMs : nowMs;

  const elapsedMs = Math.max(0, nowMs - prevUpdatedAtMs);
  const intervals = Math.floor(elapsedMs / cfg.refillIntervalMs);

  const refilledTokens = intervals > 0 ? intervals * cfg.refillTokens : 0;

  const available = Math.min(capacity, prevTokens + refilledTokens);
  const updatedAtMs = intervals > 0 ? prevUpdatedAtMs + intervals * cfg.refillIntervalMs : prevUpdatedAtMs;

  const remainingAfter = available - cost;

  if (remainingAfter >= 0) {
    return {
      next: { tokens: remainingAfter, updatedAtMs },
      result: { allowed: true, remaining: remainingAfter, retryAfterMs: null },
    };
  }

  const missing = Math.abs(remainingAfter);
  const intervalsNeeded = Math.ceil(missing / cfg.refillTokens);
  const retryAfterMs = intervalsNeeded * cfg.refillIntervalMs;

  return {
    next: { tokens: available, updatedAtMs },
    result: { allowed: false, remaining: available, retryAfterMs },
  };
}

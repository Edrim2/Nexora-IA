
interface D1Result<T> {
  request_count: number;
}

interface D1Statement {
  bind(...values: unknown[]): D1Statement;
  first<T>(): Promise<T | null>;
}

export interface CoreDatabase {
  prepare(query: string): D1Statement;
}

export interface RateLimitResult {
  allowed: boolean;
  remaining: number;
  retryAfter: number;
}

export async function checkRateLimit(
  db: CoreDatabase,
  deviceId: string,
  limit = 30,
  windowSeconds = 60
): Promise<RateLimitResult> {
  const now = Math.floor(Date.now() / 1000);
  const windowStart =
    Math.floor(now / windowSeconds) * windowSeconds;

  const result = await db.prepare(`
    INSERT INTO rate_limits (
      device_id,
      window_start,
      request_count
    )
    VALUES (?, ?, 1)
    ON CONFLICT(device_id, window_start)
    DO UPDATE SET request_count = request_count + 1
    RETURNING request_count
  `)
    .bind(deviceId, windowStart)
    .first<D1Result<number>>();

  if (!result) {
    throw new Error("Não foi possível verificar o limite.");
  }

  const remaining = Math.max(
    0,
    limit - result.request_count
  );

  return {
    allowed: result.request_count <= limit,
    remaining,
    retryAfter: windowStart + windowSeconds - now
  };
}

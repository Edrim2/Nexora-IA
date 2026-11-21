
export interface CoreDatabase {
  prepare(query: string): {
    bind(...values: unknown[]): {
      first<T>(): Promise<T | null>;
    };
  };
}

interface D1Count {
  request_count: number;
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
  if (
    !deviceId ||
    !Number.isInteger(limit) ||
    limit < 1 ||
    !Number.isInteger(windowSeconds) ||
    windowSeconds < 1
  ) {
    throw new Error("Configuração de limite inválida.");
  }

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
    .first<D1Count>();

  if (!result) {
    throw new Error("Falha ao consultar limite de requisições.");
  }

  return {
    allowed: result.request_count <= limit,
    remaining: Math.max(0, limit - result.request_count),
    retryAfter: windowStart + windowSeconds - now
  };
}

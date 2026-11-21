
export interface DeviceDatabase {
  prepare(query: string): {
    bind(...values: unknown[]): {
      first<T>(): Promise<T | null>;
    };
  };
}

interface DeviceRecord {
  id: string;
}

function toHex(bytes: Uint8Array): string {
  return Array.from(bytes)
    .map(byte => byte.toString(16).padStart(2, "0"))
    .join("");
}

async function hashToken(token: string): Promise<string> {
  const data = new TextEncoder().encode(token);
  const hash = await crypto.subtle.digest("SHA-256", data);

  return toHex(new Uint8Array(hash));
}

export async function authenticateDevice(
  request: Request,
  db: DeviceDatabase
): Promise<string | null> {
  const authorization = request.headers.get("Authorization");

  if (!authorization?.startsWith("Bearer ")) {
    return null;
  }

  const token = authorization.slice(7).trim();

  if (!token || token.length > 512) {
    return null;
  }

  const tokenHash = await hashToken(token);

  const device = await db.prepare(`
    SELECT id
    FROM devices
    WHERE token_hash = ?
      AND revoked_at IS NULL
    LIMIT 1
  `)
    .bind(tokenHash)
    .first<DeviceRecord>();

  return device?.id ?? null;
}


export interface AuthEnv {
  CORE_API_TOKEN?: string;
}

async function hashToken(token: string): Promise<Uint8Array> {
  const data = new TextEncoder().encode(token);
  const hash = await crypto.subtle.digest("SHA-256", data);

  return new Uint8Array(hash);
}

export async function authenticateRequest(
  request: Request,
  env: AuthEnv
): Promise<boolean> {
  const secret = env.CORE_API_TOKEN;

  if (!secret) {
    return false;
  }

  const authorization = request.headers.get("Authorization");

  if (!authorization?.startsWith("Bearer ")) {
    return false;
  }

  const suppliedToken = authorization.slice(7);

  if (!suppliedToken || suppliedToken.length > 512) {
    return false;
  }

  const expectedHash = await hashToken(secret);
  const suppliedHash = await hashToken(suppliedToken);

  let difference = 0;

  for (let i = 0; i < expectedHash.length; i++) {
    difference |= expectedHash[i] ^ suppliedHash[i];
  }

  return difference === 0;
}

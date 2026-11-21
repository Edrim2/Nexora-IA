
export interface CoreEnv {
  CORE_VERSION?: string;
}

export async function routeRequest(
  request: Request,
  env: CoreEnv
): Promise<Response> {
  const url = new URL(request.url);

  if (url.pathname === "/api/health" && request.method === "GET") {
    return Response.json({
      name: "NEXORA CORE",
      status: "online",
      version: env.CORE_VERSION ?? "0.1.0",
      engines: {
        local: false,
        cloud: false
      }
    });
  }

  return Response.json(
    {
      error: "Endpoint não encontrado."
    },
    { status: 404 }
  );
}

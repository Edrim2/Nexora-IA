
import { routeRequest, type CoreEnv } from "./router";

export default {
  async fetch(
    request: Request,
    env: CoreEnv
  ): Promise<Response> {
    const corsHeaders = {
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
      "Access-Control-Allow-Headers": "Content-Type, Authorization"
    };

    if (request.method === "OPTIONS") {
      return new Response(null, {
        status: 204,
        headers: corsHeaders
      });
    }

    try {
      const response = await routeRequest(request, env);

      const headers = new Headers(response.headers);

      for (const [key, value] of Object.entries(corsHeaders)) {
        headers.set(key, value);
      }

      return new Response(response.body, {
        status: response.status,
        statusText: response.statusText,
        headers
      });
    } catch {
      return Response.json(
        { error: "Erro interno do NEXORA CORE." },
        {
          status: 500,
          headers: corsHeaders
        }
      );
    }
  }
};

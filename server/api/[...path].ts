
import { routeRequest, type CoreEnv } from "../src/router";

export default {
  async fetch(request: Request): Promise<Response> {
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

    const env: CoreEnv = {
      CORE_VERSION: process.env.CORE_VERSION ?? "0.1.0",
      CLOUD_API_URL: process.env.CLOUD_API_URL,
      CLOUD_API_KEY: process.env.CLOUD_API_KEY,
      CLOUD_MODEL: process.env.CLOUD_MODEL
    };

    try {
      const response = await routeRequest(request, env);
      const headers = new Headers(response.headers);

      for (const [key, value] of Object.entries(corsHeaders)) {
        headers.set(key, value);
      }

      return new Response(response.body, {
        status: response.status,
        headers
      });
    } catch {
      return Response.json(
        { error: "Erro interno do NEXORA CORE." },
        { status: 500, headers: corsHeaders }
      );
    }
  }
};

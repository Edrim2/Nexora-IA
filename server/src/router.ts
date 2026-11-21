
import {
  generateCloudResponse,
  type CoreMessage,
  type ProviderEnv
} from "./providers";

export interface CoreEnv extends ProviderEnv {
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
        cloud: Boolean(
          env.CLOUD_API_URL &&
          env.CLOUD_API_KEY &&
          env.CLOUD_MODEL
        )
      }
    });
  }

  if (url.pathname === "/api/chat" && request.method === "POST") {
    let body: { messages?: CoreMessage[] };

    try {
      body = await request.json() as { messages?: CoreMessage[] };
    } catch {
      return Response.json(
        { error: "Formato JSON inválido." },
        { status: 400 }
      );
    }

    if (
      !Array.isArray(body.messages) ||
      body.messages.length === 0 ||
      body.messages.length > 30
    ) {
      return Response.json(
        { error: "Histórico de mensagens inválido." },
        { status: 400 }
      );
    }

    const valid = body.messages.every(message =>
      message &&
      ["system", "user", "assistant"].includes(message.role) &&
      typeof message.content === "string" &&
      message.content.length <= 8000
    );

    if (!valid) {
      return Response.json(
        { error: "Uma ou mais mensagens são inválidas." },
        { status: 400 }
      );
    }

    try {
      const result = await generateCloudResponse(
        body.messages,
        env
      );

      return Response.json({
        text: result.text,
        model: result.model
      });
    } catch (error) {
      const message = error instanceof Error
        ? error.message
        : "Erro desconhecido.";

      const status = message === "Provedor de IA não configurado."
        ? 503
        : 502;

      return Response.json(
        { error: message },
        { status }
      );
    }
  }

  return Response.json(
    { error: "Endpoint não encontrado." },
    { status: 404 }
  );
}

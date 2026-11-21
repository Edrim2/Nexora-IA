
export interface CoreEnv {
  CORE_VERSION?: string;
}

interface ChatMessage {
  role: "system" | "user" | "assistant";
  content: string;
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

  if (url.pathname === "/api/chat" && request.method === "POST") {
    let body: { messages?: ChatMessage[] };

    try {
      body = await request.json() as { messages?: ChatMessage[] };
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

    return Response.json(
      {
        error: "Nenhum provedor de IA está conectado ao NEXORA CORE ainda."
      },
      { status: 503 }
    );
  }

  return Response.json(
    { error: "Endpoint não encontrado." },
    { status: 404 }
  );
}

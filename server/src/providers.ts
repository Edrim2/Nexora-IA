
export interface CoreMessage {
  role: "system" | "user" | "assistant";
  content: string;
}

export interface ProviderEnv {
  CLOUD_API_URL?: string;
  CLOUD_API_KEY?: string;
  CLOUD_MODEL?: string;
}

interface ProviderResponse {
  choices?: Array<{
    message?: {
      content?: string;
    };
  }>;
  error?: {
    message?: string;
  };
}

export async function generateCloudResponse(
  messages: CoreMessage[],
  env: ProviderEnv
): Promise<{ text: string; model: string }> {
  const { CLOUD_API_URL, CLOUD_API_KEY, CLOUD_MODEL } = env;

  if (!CLOUD_API_URL || !CLOUD_API_KEY || !CLOUD_MODEL) {
    throw new Error("Provedor de IA não configurado.");
  }

  const response = await fetch(CLOUD_API_URL, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "Authorization": `Bearer ${CLOUD_API_KEY}`
    },
    body: JSON.stringify({
      model: CLOUD_MODEL,
      messages
    })
  });

  if (!response.ok) {
    throw new Error(
      `Provedor de IA respondeu com HTTP ${response.status}.`
    );
  }

  const data = await response.json() as ProviderResponse;

  if (data.error?.message) {
    throw new Error("O provedor de IA recusou a solicitação.");
  }

  const text = data.choices?.[0]?.message?.content;

  if (typeof text !== "string" || !text.trim()) {
    throw new Error("Resposta inválida do provedor de IA.");
  }

  return {
    text,
    model: CLOUD_MODEL
  };
}

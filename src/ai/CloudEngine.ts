
import type {
  AIEngine,
  ChatMessage,
  GenerateOptions,
  GenerateResult
} from "./types";

interface CloudEngineConfig {
  baseUrl: string;
}

interface CloudResponse {
  text?: string;
  model?: string;
  error?: string;
}

export class CloudEngine implements AIEngine {
  readonly id = "cloud" as const;
  private baseUrl: string;

  constructor(config: CloudEngineConfig) {
    this.baseUrl = config.baseUrl.replace(/\/+$/, "");
  }

  async isAvailable(): Promise<boolean> {
    return this.baseUrl.length > 0;
  }

  async generate(
    prompt: string,
    options: GenerateOptions
  ): Promise<GenerateResult> {
    const messages: ChatMessage[] = [
      ...options.history,
      { role: "user", content: prompt }
    ];

    const response = await fetch(`${this.baseUrl}/api/chat`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({ messages }),
      signal: options.signal
    });

        if (!response.ok) {
      throw new Error(
        "Servidor de IA respondeu com erro HTTP " + response.status + "."
      );
    }
    const data = await response.json() as CloudResponse;

    if (data.error) {
      throw new Error(data.error);
    }

    if (!data.text?.trim()) {
      throw new Error("O servidor não retornou uma resposta válida.");
    }

    return {
      text: data.text,
      provider: "cloud",
      model: data.model
    };
  }
}

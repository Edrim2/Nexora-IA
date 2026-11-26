import { registerPlugin } from "@capacitor/core";

import type {
  AIEngine,
  ChatMessage,
  GenerateOptions,
  GenerateResult
} from "./types";

interface LocalAIPlugin {
  getStatus(): Promise<{
    available: boolean;
    engine: string;
    message: string;
  }>;

  generate(options: {
    payload: string;
  }): Promise<{
    text: string;
    model?: string;
  }>;
}

const LocalAI = registerPlugin<LocalAIPlugin>("LocalAI");

export class LocalEngine implements AIEngine {
  readonly id = "local" as const;

  async isAvailable(): Promise<boolean> {
    try {
      const status = await LocalAI.getStatus();
      return status.available;
    } catch {
      return false;
    }
  }

  async generate(
    prompt: string,
    options: GenerateOptions
  ): Promise<GenerateResult> {
    if (options.signal?.aborted) {
      throw new DOMException(
        "Operação cancelada.",
        "AbortError"
      );
    }

    const messages: ChatMessage[] = [
      ...options.history,
      {
        role: "user",
        content: prompt
      }
    ];

    const result = await LocalAI.generate({
      payload: JSON.stringify({
        messages,
        max_tokens: 128,
        temperature: 0.7
      })
    });

    if (!result.text?.trim()) {
      throw new Error(
        "O motor local não retornou uma resposta."
      );
    }

    return {
      text: result.text,
      provider: "local",
      model: result.model
    };
  }
}

export type MessageRole = "system" | "user" | "assistant";

export interface ChatMessage {
  role: MessageRole;
  content: string;
}

export type EngineMode = "auto" | "local" | "cloud";

export interface GenerateOptions {
  history: ChatMessage[];
  signal?: AbortSignal;
}

export interface GenerateResult {
  text: string;
  provider: "local" | "cloud";
  model?: string;
}

export interface AIEngine {
  readonly id: "local" | "cloud";
  isAvailable(): Promise<boolean>;
  generate(
    prompt: string,
    options: GenerateOptions
  ): Promise<GenerateResult>;
}

export class EngineUnavailableError extends Error {
  constructor(engine: string) {
    super(`O motor ${engine} não está disponível.`);
    this.name = "EngineUnavailableError";
  }
}

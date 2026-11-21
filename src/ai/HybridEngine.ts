
import {
  EngineUnavailableError,
  type AIEngine,
  type ChatMessage,
  type EngineMode,
  type GenerateResult
} from "./types";

export interface HybridEngineOptions {
  local?: AIEngine;
  cloud?: AIEngine;
  mode?: EngineMode;
}

export class HybridEngine {
  private local?: AIEngine;
  private cloud?: AIEngine;
  private mode: EngineMode;

  constructor(options: HybridEngineOptions = {}) {
    this.local = options.local;
    this.cloud = options.cloud;
    this.mode = options.mode ?? "auto";
  }

  setMode(mode: EngineMode): void {
    this.mode = mode;
  }

  getMode(): EngineMode {
    return this.mode;
  }

  async getStatus() {
    const [local, cloud] = await Promise.all([
      this.local?.isAvailable() ?? Promise.resolve(false),
      this.cloud?.isAvailable() ?? Promise.resolve(false)
    ]);

    return { local, cloud, mode: this.mode };
  }

  async generate(
    prompt: string,
    history: ChatMessage[] = [],
    signal?: AbortSignal
  ): Promise<GenerateResult> {
    const cleanPrompt = prompt.trim();

    if (!cleanPrompt) {
      throw new Error("Digite uma mensagem antes de enviar.");
    }

    if (signal?.aborted) {
      throw new DOMException("Operação cancelada.", "AbortError");
    }

    if (this.mode === "local") {
      return this.runEngine(this.local, "local", cleanPrompt, history, signal);
    }

    if (this.mode === "cloud") {
      return this.runEngine(this.cloud, "cloud", cleanPrompt, history, signal);
    }

    if (this.local && await this.local.isAvailable()) {
      try {
        return await this.local.generate(cleanPrompt, { history, signal });
      } catch (error) {
        if (signal?.aborted) throw error;
        if (!this.cloud || !(await this.cloud.isAvailable())) throw error;
      }
    }

    return this.runEngine(this.cloud, "cloud", cleanPrompt, history, signal);
  }

  private async runEngine(
    engine: AIEngine | undefined,
    name: "local" | "cloud",
    prompt: string,
    history: ChatMessage[],
    signal?: AbortSignal
  ): Promise<GenerateResult> {
    if (!engine || !(await engine.isAvailable())) {
      throw new EngineUnavailableError(name);
    }

    return engine.generate(prompt, { history, signal });
  }
}

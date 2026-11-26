import type {
  CompatibilityDevice,
  CompatibilityResult,
  ModuleRequirements
} from "./CompatibilityTypes";

export class CompatibilityEngine {
  evaluate(
    device: CompatibilityDevice,
    requirements: ModuleRequirements
  ): CompatibilityResult {
    const passed: string[] = [];
    const failed: string[] = [];
    const unknown: string[] = [];

    if (requirements.platforms?.length) {
      if (device.platform === "unknown") {
        unknown.push("Plataforma não identificada");
      } else if (requirements.platforms.includes(device.platform)) {
        passed.push("Plataforma compatível");
      } else {
        failed.push("Plataforma não suportada");
      }
    }

    if (requirements.minLogicalCores !== undefined) {
      if (device.logicalCores === null) {
        unknown.push("Quantidade de núcleos desconhecida");
      } else if (device.logicalCores >= requirements.minLogicalCores) {
        passed.push("Processador atende ao requisito de núcleos");
      } else {
        failed.push("Quantidade insuficiente de núcleos");
      }
    }

    if (requirements.minMemoryGB !== undefined) {
      if (device.memoryGB === null) {
        unknown.push("Memória RAM disponível não identificada");
      } else if (device.memoryGB >= requirements.minMemoryGB) {
        passed.push("Memória RAM atende ao requisito");
      } else {
        failed.push("Memória RAM abaixo do requisito");
      }
    }

    if (requirements.minStorageGB !== undefined) {
      if (device.freeStorageGB === null) {
        unknown.push("Armazenamento livre desconhecido");
      } else if (device.freeStorageGB >= requirements.minStorageGB) {
        passed.push("Armazenamento atende ao requisito");
      } else {
        failed.push("Armazenamento livre insuficiente");
      }
    }

    const total = passed.length + failed.length + unknown.length;
    let level: CompatibilityResult["level"];
    let score: number | null = null;

    if (failed.length > 0) {
      level = "not-compatible";
    } else if (total === 0) {
      level = "not-tested";
    } else if (unknown.length > 0) {
      level = passed.length > 0 ? "limited" : "not-tested";
    } else {
      level = "compatible";
      score = 100;
    }

    return {
      moduleId: requirements.id,
      moduleName: requirements.name,
      level,
      score,
      passed,
      failed,
      unknown,
      evaluatedAt: Date.now()
    };
  }
}

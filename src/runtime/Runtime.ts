import { DeviceService } from "../services/DeviceService";
import { HealthService } from "../services/HealthService";
import { StorageService } from "../storage/StorageService";
import { CompatibilityEngine } from "../compatibility/CompatibilityEngine";

import type {
  ModuleRequirements,
  CompatibilityResult
} from "../compatibility/CompatibilityTypes";

import {
  DEFAULT_RUNTIME_CONFIG,
  type RuntimeConfig
} from "./RuntimeConfig";

import type { RuntimeStatus } from "./RuntimeStatus";

export class NexoraRuntime {
  readonly device = new DeviceService();
  readonly health = new HealthService();
  readonly storage = new StorageService();
  readonly compatibility = new CompatibilityEngine();

  private config: RuntimeConfig;

  private status: RuntimeStatus = {
    state: "stopped",
    platform: "unknown",
    online: false,
    storageAvailable: false,
    startedAt: null
  };

  constructor(config: RuntimeConfig = DEFAULT_RUNTIME_CONFIG) {
    this.config = config;
  }

  async initialize(): Promise<RuntimeStatus> {
    if (this.status.state === "ready") {
      return this.getStatus();
    }

    this.status = {
      ...this.status,
      state: "initializing",
      error: undefined
    };

    try {
      const deviceInfo = this.device.getInfo();
      const storageAvailable = this.storage.isAvailable();

      this.health.check(deviceInfo, storageAvailable);

      this.status = {
        state: "ready",
        platform: deviceInfo.platform,
        online: deviceInfo.online,
        storageAvailable,
        startedAt: Date.now()
      };
    } catch (error) {
      this.status = {
        ...this.status,
        state: "error",
        error: error instanceof Error
          ? error.message
          : "Falha ao inicializar o Runtime."
      };
    }

    return this.getStatus();
  }

  async evaluateCompatibility(
    requirements: ModuleRequirements
  ): Promise<CompatibilityResult> {
    const status = await this.initialize();

    if (status.state !== "ready") {
      throw new Error("O Runtime não conseguiu inicializar.");
    }

    const info = this.device.getInfo();

    return this.compatibility.evaluate(
      {
        platform: info.platform,
        logicalCores: info.logicalCores,
        memoryGB: info.memoryEstimateGB,
        freeStorageGB: null
      },
      requirements
    );
  }

  async getAppStorageInfo() {
    return this.device.getAppStorageInfo();
  }

  getStatus(): RuntimeStatus {
    return { ...this.status };
  }

  getConfig(): RuntimeConfig {
    return { ...this.config };
  }

  shutdown(): void {
    this.status = {
      ...this.status,
      state: "stopped",
      startedAt: null
    };
  }
}

export const nexoraRuntime = new NexoraRuntime();

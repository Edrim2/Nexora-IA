import { Capacitor } from "@capacitor/core";

export interface DeviceInfo {
  platform: string;
  native: boolean;
  online: boolean;
  language: string;
  logicalCores: number | null;
  memoryEstimateGB: number | null;
  screenWidth: number;
  screenHeight: number;
  pixelRatio: number;
  userAgent: string;
}

export interface AppStorageInfo {
  quotaGB: number | null;
  usageGB: number | null;
}

export class DeviceService {
  getInfo(): DeviceInfo {
    const platform = Capacitor.getPlatform();

    const memory = (
      navigator as Navigator & { deviceMemory?: number }
    ).deviceMemory;

    return {
      platform,
      native: Capacitor.isNativePlatform(),
      online: navigator.onLine,
      language: navigator.language || "unknown",
      logicalCores: navigator.hardwareConcurrency || null,
      memoryEstimateGB: typeof memory === "number" ? memory : null,
      screenWidth: window.screen.width,
      screenHeight: window.screen.height,
      pixelRatio: window.devicePixelRatio || 1,
      userAgent: navigator.userAgent
    };
  }

  async getAppStorageInfo(): Promise<AppStorageInfo> {
    try {
      if (!navigator.storage?.estimate) {
        return { quotaGB: null, usageGB: null };
      }

      const estimate = await navigator.storage.estimate();

      return {
        quotaGB: typeof estimate.quota === "number"
          ? estimate.quota / (1024 ** 3)
          : null,
        usageGB: typeof estimate.usage === "number"
          ? estimate.usage / (1024 ** 3)
          : null
      };
    } catch {
      return { quotaGB: null, usageGB: null };
    }
  }
}

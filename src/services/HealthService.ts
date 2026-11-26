import type { DeviceInfo } from "./DeviceService";

export interface HealthReport {
  online: boolean;
  platform: string;
  native: boolean;
  storageAvailable: boolean;
  checkedAt: number;
}

export class HealthService {
  check(device: DeviceInfo, storageAvailable: boolean): HealthReport {
    return {
      online: device.online,
      platform: device.platform,
      native: device.native,
      storageAvailable,
      checkedAt: Date.now()
    };
  }
}

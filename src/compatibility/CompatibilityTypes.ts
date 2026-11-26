export type CompatibilityLevel =
  | "compatible"
  | "limited"
  | "not-compatible"
  | "not-tested";

export interface ModuleRequirements {
  id: string;
  name: string;
  platforms?: string[];
  minLogicalCores?: number;
  minMemoryGB?: number;
  minStorageGB?: number;
}

export interface CompatibilityResult {
  moduleId: string;
  moduleName: string;
  level: CompatibilityLevel;
  score: number | null;
  passed: string[];
  failed: string[];
  unknown: string[];
  evaluatedAt: number;
}

export interface CompatibilityDevice {
  platform: string;
  logicalCores: number | null;
  memoryGB: number | null;
  freeStorageGB: number | null;
}

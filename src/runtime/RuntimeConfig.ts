export interface RuntimeConfig {
  appName: string;
  version: string;
}

export const DEFAULT_RUNTIME_CONFIG: RuntimeConfig = {
  appName: "NEXORA",
  version: "0.1.0"
};

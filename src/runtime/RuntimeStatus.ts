export type RuntimeState =
  | "stopped"
  | "initializing"
  | "ready"
  | "error";

export interface RuntimeStatus {
  state: RuntimeState;
  platform: string;
  online: boolean;
  storageAvailable: boolean;
  startedAt: number | null;
  error?: string;
}

export class StorageService {
  isAvailable(): boolean {
    try {
      const key = "__nexora_storage_test__";
      localStorage.setItem(key, "ok");
      localStorage.removeItem(key);
      return true;
    } catch {
      return false;
    }
  }

  set<T>(key: string, value: T): boolean {
    try {
      localStorage.setItem(key, JSON.stringify(value));
      return true;
    } catch {
      return false;
    }
  }

  get<T>(key: string): T | null {
    try {
      const value = localStorage.getItem(key);
      return value === null ? null : JSON.parse(value) as T;
    } catch {
      return null;
    }
  }

  remove(key: string): boolean {
    try {
      localStorage.removeItem(key);
      return true;
    } catch {
      return false;
    }
  }
}

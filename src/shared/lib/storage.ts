// Thin, typed localStorage wrapper used by module-scoped mock stores
// (ev/, rental/, mechanic/, worker/, admin/). Centralising serialisation
// means every module handles corrupt data / quota-exceeded the same way.

export function readJson<T>(key: string, fallback: T): T {
  try {
    const raw = localStorage.getItem(key);
    if (!raw) return fallback;
    return JSON.parse(raw) as T;
  } catch {
    return fallback;
  }
}

export function writeJson<T>(key: string, value: T): void {
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch {
    /* quota exceeded / storage disabled — silently drop */
  }
}

export function removeKey(key: string): void {
  try {
    localStorage.removeItem(key);
  } catch {
    /* */
  }
}

/** Small helper for id generation in mock stores. */
export function makeId(prefix: string): string {
  return `${prefix}_${Date.now().toString(36)}_${Math.random()
    .toString(36)
    .slice(2, 8)}`;
}

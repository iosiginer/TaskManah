const STORAGE_PREFIX = 'taskflow_';

/**
 * Get a value from localStorage by key.
 * Returns defaultValue if key doesn't exist or data is corrupted.
 */
export function get(key, defaultValue = null) {
  try {
    const raw = localStorage.getItem(STORAGE_PREFIX + key);
    if (raw === null) return defaultValue;
    return JSON.parse(raw);
  } catch {
    return defaultValue;
  }
}

/**
 * Set a value in localStorage.
 */
export function set(key, value) {
  try {
    localStorage.setItem(STORAGE_PREFIX + key, JSON.stringify(value));
  } catch {
    // Storage full or unavailable — fail silently
  }
}

/**
 * Remove a key from localStorage.
 */
export function remove(key) {
  try {
    localStorage.removeItem(STORAGE_PREFIX + key);
  } catch {
    // fail silently
  }
}

/**
 * Get all taskflow keys from localStorage.
 */
export function keys() {
  try {
    const result = [];
    for (let i = 0; i < localStorage.length; i++) {
      const k = localStorage.key(i);
      if (k && k.startsWith(STORAGE_PREFIX)) {
        result.push(k.slice(STORAGE_PREFIX.length));
      }
    }
    return result;
  } catch {
    return [];
  }
}

export default { get, set, remove, keys };

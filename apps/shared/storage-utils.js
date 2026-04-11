/**
 * Shared localStorage utilities — all Miro apps.
 */

/**
 * Read a JSON value from localStorage.
 * Returns `fallback` if the key is absent or the stored value is malformed JSON.
 */
export function getSafeJSON(key, fallback = null) {
  try {
    const raw = localStorage.getItem(key);
    if (raw === null) return fallback;
    return JSON.parse(raw);
  } catch (err) {
    console.warn(`[storage] Failed to parse "${key}":`, err);
    return fallback;
  }
}

/**
 * Write a JSON value to localStorage.
 * Logs a warning on failure (e.g. storage quota exceeded) instead of throwing.
 */
export function setSafeJSON(key, value) {
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch (err) {
    console.warn(`[storage] Failed to write "${key}":`, err);
  }
}

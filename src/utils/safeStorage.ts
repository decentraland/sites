/**
 * `localStorage` (and `sessionStorage`) is not always there, and not always readable.
 *
 * Some Android WebViews expose it as `null`, and a document denied storage
 * access (third-party framing, a locked-down browser profile) throws
 * `SecurityError` on the property itself, before any method call. Either one
 * takes down whatever is rendering at the time: an unguarded read inside the
 * navbar's hooks blanked the whole page for those visitors (SITES-2RR, -2RS,
 * -2RY).
 *
 * These wrappers turn both failures into "no value", which is always a sane
 * answer here: everything we keep in storage is a convenience (an anonymous
 * analytics id, a wallet pointer), never something the page cannot render
 * without.
 */

/** Which Web Storage object to use. `localStorage` unless a caller asks for the per-tab one. */
type StorageArea = 'local' | 'session'

/**
 * Resolves the global binding rather than `window.localStorage` on purpose:
 * tests swap the global, and reaching through `window` would read past the
 * substitute. `sessionStorage` fails the same way (SITES-2TJ: a document
 * denied storage access threw on `/download_success` and blanked the page).
 */
function getStorage(area: StorageArea = 'local'): Storage | null {
  try {
    if (area === 'session') {
      return typeof sessionStorage === 'undefined' ? null : sessionStorage
    }
    return typeof localStorage === 'undefined' ? null : localStorage
  } catch {
    return null
  }
}

/** Reads a key, or null when storage is missing, unreadable, or has no value. */
function readStorageItem(key: string, area: StorageArea = 'local'): string | null {
  try {
    return getStorage(area)?.getItem(key) ?? null
  } catch {
    return null
  }
}

/** Writes a key, returning false when storage is unavailable or rejects the write. */
function writeStorageItem(key: string, value: string, area: StorageArea = 'local'): boolean {
  try {
    const storage = getStorage(area)
    if (!storage) return false
    storage.setItem(key, value)
    return true
  } catch {
    return false
  }
}

/** Removes every key the predicate matches. A no-op when storage is unavailable. */
function removeStorageItems(shouldRemove: (key: string) => boolean): void {
  try {
    const storage = getStorage()
    if (!storage) return

    const keysToRemove: string[] = []
    for (let index = 0; index < storage.length; index++) {
      const key = storage.key(index)
      if (key && shouldRemove(key)) {
        keysToRemove.push(key)
      }
    }
    // Collected first, then removed: removing during the walk shifts the
    // remaining indices and silently skips keys.
    keysToRemove.forEach(key => storage.removeItem(key))
  } catch {
    // Storage unavailable. The caller's in-memory cleanup still runs.
  }
}

export { readStorageItem, writeStorageItem, removeStorageItems }

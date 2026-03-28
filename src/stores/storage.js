function getUsableStorage() {
  // Some environments can block `localStorage`. Fall back to `sessionStorage`.
  try {
    localStorage.setItem('__nova_storage_test__', '1')
    localStorage.removeItem('__nova_storage_test__')
    return localStorage
  } catch {
    try {
      sessionStorage.setItem('__nova_storage_test__', '1')
      sessionStorage.removeItem('__nova_storage_test__')
      return sessionStorage
    } catch {
      return null
    }
  }
}

const storage = getUsableStorage()

export function readJson(key, fallback) {
  try {
    if (!storage) return fallback
    const raw = storage.getItem(key)
    if (!raw) return fallback
    return JSON.parse(raw)
  } catch {
    return fallback
  }
}

export function writeJson(key, value) {
  try {
    if (!storage) return
    storage.setItem(key, JSON.stringify(value))
  } catch {
    // ignore
  }
}


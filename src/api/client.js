export function getApiBase() {
  return import.meta.env.VITE_API_URL || ''
}

export function apiPath(path) {
  const base = getApiBase().replace(/\/$/, '')
  const p = path.startsWith('/') ? path : `/${path}`
  return base ? `${base}${p}` : p
}

export async function apiFetch(path, options = {}) {
  const { token, ...rest } = options
  const headers = new Headers(rest.headers || {})
  if (!headers.has('Content-Type') && rest.body && typeof rest.body === 'string') {
    headers.set('Content-Type', 'application/json')
  }
  if (token) headers.set('Authorization', `Bearer ${token}`)
  const res = await fetch(apiPath(path), { ...rest, headers })
  if (!res.ok) {
    let message = res.statusText || 'Request failed'
    try {
      const err = await res.json()
      if (err?.error) message = err.error
    } catch {
      // ignore
    }
    throw new Error(message)
  }
  if (res.status === 204) return null
  const text = await res.text()
  if (!text) return null
  return JSON.parse(text)
}

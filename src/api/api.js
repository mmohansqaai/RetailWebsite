import { apiFetch } from './client'

export async function apiListProducts({ query = '' } = {}) {
  const qs = query ? `?q=${encodeURIComponent(query)}` : ''
  return apiFetch(`/api/products${qs}`)
}

export async function apiGetProduct(productId) {
  return apiFetch(`/api/products/${encodeURIComponent(productId)}`)
}

export async function apiPlaceOrder({ items, shipping }, token) {
  return apiFetch('/api/orders', {
    method: 'POST',
    body: JSON.stringify({ items, shipping }),
    token
  })
}

export async function apiLogin({ email, password }) {
  return apiFetch('/api/auth/login', {
    method: 'POST',
    body: JSON.stringify({ email, password })
  })
}

export async function apiRegister({ email, password, name }) {
  return apiFetch('/api/auth/register', {
    method: 'POST',
    body: JSON.stringify({ email, password, name })
  })
}

export async function apiCreateProduct(body, token) {
  return apiFetch('/api/admin/products', {
    method: 'POST',
    body: JSON.stringify(body),
    token
  })
}

export async function apiDeleteProduct(productId, token) {
  return apiFetch(`/api/admin/products/${encodeURIComponent(productId)}`, {
    method: 'DELETE',
    token
  })
}

export async function apiUpdateProductStock(productId, stock, token) {
  return apiFetch(`/api/admin/products/${encodeURIComponent(productId)}`, {
    method: 'PATCH',
    body: JSON.stringify({ stock }),
    token
  })
}

export async function apiRestockAll(stock, token) {
  return apiFetch('/api/admin/products/restock-all', {
    method: 'POST',
    body: JSON.stringify({ stock }),
    token
  })
}

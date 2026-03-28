import { create } from 'zustand'
import { readJson, writeJson } from './storage'

const STORAGE_KEY = 'nova.cart'

export const useCartStore = create((set, get) => ({
  items: readJson(STORAGE_KEY, []),
  lastAdded: null,
  addItem: (product, qty = 1) => {
    if (!product) return
    const items = [...get().items]
    const existing = items.find((i) => i.productId === product.id)
    if (existing) existing.qty += qty
    else items.push({ productId: product.id, name: product.name, price: product.price, qty })
    writeJson(STORAGE_KEY, items)
    set({
      items,
      lastAdded: { productId: product.id, name: product.name, qty, at: Date.now() }
    })
  },
  removeItem: (productId) => {
    const items = get().items.filter((i) => i.productId !== productId)
    writeJson(STORAGE_KEY, items)
    set({ items })
  },
  setQty: (productId, qty) => {
    const items = get().items.map((i) => (i.productId === productId ? { ...i, qty } : i)).filter((i) => i.qty > 0)
    writeJson(STORAGE_KEY, items)
    set({ items })
  },
  clear: () => {
    writeJson(STORAGE_KEY, [])
    set({ items: [], lastAdded: null })
  },
  totals: () => {
    const subtotal = get().items.reduce((sum, i) => sum + i.price * i.qty, 0)
    const shipping = subtotal > 120 ? 0 : subtotal === 0 ? 0 : 8
    const tax = Math.round(subtotal * 0.0825 * 100) / 100
    const total = Math.round((subtotal + shipping + tax) * 100) / 100
    return { subtotal, shipping, tax, total }
  },
  count: () => get().items.reduce((sum, i) => sum + i.qty, 0)
}))


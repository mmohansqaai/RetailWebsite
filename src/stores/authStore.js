import { create } from 'zustand'
import { apiLogin } from '../api/api'
import { readJson, writeJson } from './storage'

const STORAGE_KEY = 'nova.auth'

export const useAuthStore = create((set, get) => ({
  session: readJson(STORAGE_KEY, null),
  login: async ({ email, password }) => {
    if (!email || !password) throw new Error('Missing credentials')
    const data = await apiLogin({ email, password })
    const session = {
      user: data.user,
      token: data.token,
      createdAt: Date.now()
    }
    writeJson(STORAGE_KEY, session)
    set({ session })
    return session
  },
  logout: () => {
    writeJson(STORAGE_KEY, null)
    set({ session: null })
  },
  isAuthenticated: () => Boolean(get().session?.token),
  isAdmin: () => get().session?.user?.role === 'admin',
  getToken: () => get().session?.token
}))

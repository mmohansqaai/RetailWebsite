import { create } from 'zustand'
import { readJson, writeJson } from './storage'

const STORAGE_KEY = 'nova.settings'

const DEFAULT_SETTINGS = {
  testingMode: false,
  featureFlags: {
    quickCheckout: true,
    adminInsights: true,
    recommendations: false
  }
}

function mergeSettings(raw) {
  if (!raw || typeof raw !== 'object') return { ...DEFAULT_SETTINGS }
  return {
    ...DEFAULT_SETTINGS,
    ...raw,
    featureFlags: { ...DEFAULT_SETTINGS.featureFlags, ...raw.featureFlags }
  }
}

export const useSettingsStore = create((set, get) => ({
  settings: mergeSettings(readJson(STORAGE_KEY, null)),
  setTestingMode: (enabled) => {
    const settings = { ...get().settings, testingMode: enabled }
    writeJson(STORAGE_KEY, settings)
    set({ settings })
  },
  setFlag: (key, value) => {
    const settings = {
      ...get().settings,
      featureFlags: { ...get().settings.featureFlags, [key]: value }
    }
    writeJson(STORAGE_KEY, settings)
    set({ settings })
  }
}))


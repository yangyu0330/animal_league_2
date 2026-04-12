const DEVICE_STORAGE_KEY = 'animal_league_device_id'

function createDeviceId(): string {
  if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
    return crypto.randomUUID()
  }

  return `web_${Date.now()}_${Math.random().toString(36).slice(2, 10)}`
}

export function getOrCreateDeviceId(): string {
  if (typeof window === 'undefined') {
    return 'server'
  }

  try {
    const saved = window.localStorage.getItem(DEVICE_STORAGE_KEY)
    if (saved) return saved
    const next = createDeviceId()
    window.localStorage.setItem(DEVICE_STORAGE_KEY, next)
    return next
  } catch {
    return createDeviceId()
  }
}

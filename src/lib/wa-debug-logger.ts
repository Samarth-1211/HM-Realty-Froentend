import { useSyncExternalStore } from 'react'

/**
 * In-memory ring buffer of WhatsApp-related frontend events (API calls,
 * polling failures, messages showing up in the UI, page errors) — shown in
 * the WhatsApp Debug Console's "Frontend console" panel and mirrored to the
 * browser console with a "[WA]" prefix. Lives only in this tab's memory.
 */

export type WaLogLevel = 'info' | 'warn' | 'error'

export interface WaLogEntry {
  id: number
  at: number
  level: WaLogLevel
  message: string
  data?: unknown
  /** How many times this exact entry repeated back-to-back (polling noise is collapsed). */
  count: number
}

const CAPACITY = 200

let entries: WaLogEntry[] = []
let nextId = 1
const listeners = new Set<() => void>()

function emit() {
  listeners.forEach((l) => l())
}

/** Strips anything token-shaped before it is stored or printed. */
function scrub(value: unknown): unknown {
  if (typeof value === 'string') {
    return value.replace(/Bearer\s+[\w.-]+/gi, 'Bearer ••••').replace(/EAA[A-Za-z0-9]{20,}/g, 'EAA••••')
  }
  if (Array.isArray(value)) return value.map(scrub)
  if (value && typeof value === 'object') {
    return Object.fromEntries(
      Object.entries(value as Record<string, unknown>).map(([k, v]) =>
        /token|secret|authorization|password/i.test(k) ? [k, '••••'] : [k, scrub(v)],
      ),
    )
  }
  return value
}

export function waLog(level: WaLogLevel, message: string, data?: unknown) {
  const clean = data === undefined ? undefined : scrub(data)
  const last = entries[entries.length - 1]

  if (last && last.level === level && last.message === message) {
    entries = [...entries.slice(0, -1), { ...last, at: Date.now(), count: last.count + 1, data: clean }]
  } else {
    entries = [...entries, { id: nextId++, at: Date.now(), level, message, data: clean, count: 1 }].slice(-CAPACITY)
  }

  // Info goes to console.debug (hidden unless "Verbose" is on) so polling
  // doesn't flood everyone's console; warnings and errors always show.
  const print = level === 'error' ? console.error : level === 'warn' ? console.warn : console.debug
  if (clean === undefined) print(`[WA] ${message}`)
  else print(`[WA] ${message}`, clean)

  emit()
}

export const waDebug = {
  info: (message: string, data?: unknown) => waLog('info', message, data),
  warn: (message: string, data?: unknown) => waLog('warn', message, data),
  error: (message: string, data?: unknown) => waLog('error', message, data),

  clear() {
    entries = []
    emit()
  },

  /** Plain-text dump for the "Copy" button. */
  asText(): string {
    return entries
      .map((e) => {
        const time = new Date(e.at).toISOString()
        const repeat = e.count > 1 ? ` (×${e.count})` : ''
        const data = e.data === undefined ? '' : ` ${JSON.stringify(e.data)}`
        return `${time} [${e.level.toUpperCase()}] ${e.message}${repeat}${data}`
      })
      .join('\n')
  },

  /**
   * Wraps one WhatsApp API call: logs it with status and duration, and
   * re-throws failures untouched so callers behave exactly as before.
   */
  async track<T>(label: string, call: () => Promise<T>): Promise<T> {
    const started = performance.now()
    try {
      const result = await call()
      waLog('info', `${label} → ok`, { ms: Math.round(performance.now() - started) })
      return result
    } catch (error) {
      const err = error as { response?: { status?: number; data?: { message?: unknown } }; message?: string }
      waLog('error', `${label} → failed`, {
        status: err.response?.status ?? null,
        message: err.response?.data?.message ?? err.message ?? String(error),
        ms: Math.round(performance.now() - started),
      })
      throw error
    }
  },

  /** Records window "error" / "unhandledrejection" while mounted; returns the cleanup. */
  captureWindowErrors(): () => void {
    const onError = (e: ErrorEvent) =>
      waLog('error', `window error: ${e.message}`, { source: e.filename, line: e.lineno, col: e.colno })
    const onRejection = (e: PromiseRejectionEvent) =>
      waLog('error', 'unhandled promise rejection', {
        reason: e.reason instanceof Error ? e.reason.message : String(e.reason),
      })
    window.addEventListener('error', onError)
    window.addEventListener('unhandledrejection', onRejection)
    waLog('info', 'window error capture on')
    return () => {
      window.removeEventListener('error', onError)
      window.removeEventListener('unhandledrejection', onRejection)
      waLog('info', 'window error capture off')
    }
  },
}

function subscribe(listener: () => void) {
  listeners.add(listener)
  return () => {
    listeners.delete(listener)
  }
}

export function useWaDebugLog(): WaLogEntry[] {
  return useSyncExternalStore(subscribe, () => entries)
}

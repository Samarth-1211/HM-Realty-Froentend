import { type ClassValue, clsx } from 'clsx'
import { twMerge } from 'tailwind-merge'

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function initials(firstName: string, lastName: string) {
  return `${firstName?.[0] ?? ''}${lastName?.[0] ?? ''}`.toUpperCase()
}

export function formatCurrency(value: string | number | null | undefined) {
  if (value === null || value === undefined || value === '') return '—'
  const num = typeof value === 'string' ? Number(value) : value
  if (Number.isNaN(num)) return '—'
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: 0,
  }).format(num)
}

export function formatDate(value: string | null | undefined) {
  if (!value) return '—'
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return '—'
  return new Intl.DateTimeFormat('en-IN', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  }).format(date)
}

export function formatDateTime(value: string | null | undefined) {
  if (!value) return '—'
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return '—'
  return new Intl.DateTimeFormat('en-IN', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  }).format(date)
}

export function formatTime(value: string | null | undefined) {
  if (!value) return '—'
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return '—'
  return new Intl.DateTimeFormat('en-IN', { hour: '2-digit', minute: '2-digit' }).format(date)
}

/** Human-friendly sequential lead id, e.g. 123 -> "LD-000123". */
export function formatLeadNumber(leadNumber: number) {
  return `LD-${String(leadNumber).padStart(6, '0')}`
}

export function formatRoleLabel(role: string) {
  return role
    .toLowerCase()
    .split('_')
    .map((w) => w[0].toUpperCase() + w.slice(1))
    .join(' ')
}

/** Converts an ISO date string to the value a <input type="datetime-local"> expects, in local time. */
export function toDatetimeLocal(iso?: string | null): string {
  if (!iso) return ''
  const d = new Date(iso)
  const pad = (n: number) => String(n).padStart(2, '0')
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`
}

export function formatEnumLabel(value: string) {
  return value
    .toLowerCase()
    .split('_')
    .map((w) => w[0].toUpperCase() + w.slice(1))
    .join(' ')
}

export function titleCase(value: string) {
  return value.replace(/\b\w/g, (c) => c.toUpperCase())
}

/** Strips keys whose value is undefined, empty string, or null — safe for the
 * backend's `forbidNonWhitelisted` validation, which 400s on stray keys. */
export function cleanPayload<T extends Record<string, unknown>>(obj: T): Partial<T> {
  const result: Partial<T> = {}
  for (const key in obj) {
    const value = obj[key]
    if (value !== undefined && value !== null && value !== '') {
      result[key] = value
    }
  }
  return result
}

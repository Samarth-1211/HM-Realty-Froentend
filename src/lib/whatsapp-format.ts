// How the WhatsApp inbox words things: names, timestamps, message kinds.

const DAY_MS = 24 * 60 * 60 * 1000

function parse(value: string | null | undefined): Date | null {
  if (!value) return null
  const date = new Date(value)
  return Number.isNaN(date.getTime()) ? null : date
}

function startOfDay(date: Date) {
  return new Date(date.getFullYear(), date.getMonth(), date.getDate()).getTime()
}

/** "10:42 am" */
export function waClockTime(value: string | null | undefined) {
  const date = parse(value)
  return date ? new Intl.DateTimeFormat('en-IN', { hour: 'numeric', minute: '2-digit' }).format(date) : ''
}

/** The divider between days in a chat: "Today", "Yesterday", "Monday", then "03/10/2026". */
export function waDayLabel(value: string | null | undefined) {
  const date = parse(value)
  if (!date) return ''
  const daysAgo = Math.round((startOfDay(new Date()) - startOfDay(date)) / DAY_MS)
  if (daysAgo === 0) return 'Today'
  if (daysAgo === 1) return 'Yesterday'
  if (daysAgo > 1 && daysAgo < 7) return new Intl.DateTimeFormat('en-IN', { weekday: 'long' }).format(date)
  return new Intl.DateTimeFormat('en-IN', { day: '2-digit', month: '2-digit', year: 'numeric' }).format(date)
}

/** The chat list's timestamp: the time for today's messages, the day for older ones. */
export function waListTime(value: string | null | undefined) {
  const label = waDayLabel(value)
  return label === 'Today' ? waClockTime(value) : label
}

export function isSameDay(a: string, b: string) {
  const first = parse(a)
  const second = parse(b)
  return !!first && !!second && startOfDay(first) === startOfDay(second)
}

/** Message types that carry an attachment. */
export const MEDIA_TYPES = ['image', 'sticker', 'audio', 'video', 'document']

/** Leads captured without a WhatsApp profile name are saved as "WhatsApp +91…" — show the number, as WhatsApp does. */
export function whatsappDisplayName(lead: { fullName: string; phone: string }) {
  return /^WhatsApp\s+\+?\d/.test(lead.fullName) ? lead.phone : lead.fullName
}

// Payload keys that hold a person's phone number (Meta's and ours).
const PHONE_KEYS = new Set(['from', 'wa_id', 'recipient_id', 'display_phone_number', 'to', 'phone', 'fromPhone', 'toPhone'])

/** "919812345678" -> "919•••••••78" — enough to recognise a number, not to dial it. */
export function maskPhone(value: string): string {
  const digits = value.replace(/\D/g, '')
  if (digits.length < 6) return value
  return `${value.startsWith('+') ? '+' : ''}${digits.slice(0, 3)}${'•'.repeat(digits.length - 5)}${digits.slice(-2)}`
}

/** Deep copy with every phone-number field masked. */
export function maskPhones(value: unknown): unknown {
  if (Array.isArray(value)) return value.map(maskPhones)
  if (value && typeof value === 'object') {
    return Object.fromEntries(
      Object.entries(value as Record<string, unknown>).map(([k, v]) => [
        k,
        PHONE_KEYS.has(k) && (typeof v === 'string' || typeof v === 'number') ? maskPhone(String(v)) : maskPhones(v),
      ]),
    )
  }
  return value
}

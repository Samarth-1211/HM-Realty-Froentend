import { Field, Input } from '@/components/ui/input'
import { Select } from '@/components/ui/select'

export interface DateTimeParts {
  /** yyyy-mm-dd, as a date input gives it. */
  date: string
  /** 1–12. */
  hour: string
  /** 00–59. */
  minute: string
  period: 'AM' | 'PM'
}

const HOURS = Array.from({ length: 12 }, (_, i) => String(i + 1))
const MINUTES = Array.from({ length: 60 }, (_, i) => String(i).padStart(2, '0'))

const pad = (n: number) => String(n).padStart(2, '0')

/** A Date as the form's parts, in the browser's local time. */
export function toDateTimeParts(d: Date): DateTimeParts {
  const h = d.getHours()
  return {
    date: `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`,
    hour: String(h % 12 || 12),
    minute: pad(d.getMinutes()),
    period: h < 12 ? 'AM' : 'PM',
  }
}

/** The parts back as a Date, or null while the date is empty. */
export function fromDateTimeParts(p: DateTimeParts): Date | null {
  const [y, m, d] = p.date.split('-').map(Number)
  if (!y || !m || !d) return null
  const hour12 = Number(p.hour) % 12
  return new Date(y, m - 1, d, p.period === 'PM' ? hour12 + 12 : hour12, Number(p.minute))
}

/** A date picker, plus the time as hour, minute and AM/PM dropdowns. */
export function VisitDateTimeFields({
  value,
  onChange,
  error,
}: {
  value: DateTimeParts
  onChange: (value: DateTimeParts) => void
  /** Shown under the time, e.g. when it's in the future. */
  error?: string
}) {
  const set = (patch: Partial<DateTimeParts>) => onChange({ ...value, ...patch })
  return (
    <div className="grid gap-4 sm:grid-cols-2">
      <Field label="Date" required>
        <Input type="date" value={value.date} onChange={(e) => set({ date: e.target.value })} error={!value.date} />
      </Field>
      <Field label="Time" required error={error}>
        <div className="grid grid-cols-3 gap-2">
          <Select value={value.hour} onChange={(e) => set({ hour: e.target.value })} aria-label="Hour">
            {HOURS.map((h) => (
              <option key={h} value={h}>
                {h}
              </option>
            ))}
          </Select>
          <Select value={value.minute} onChange={(e) => set({ minute: e.target.value })} aria-label="Minute">
            {MINUTES.map((m) => (
              <option key={m} value={m}>
                {m}
              </option>
            ))}
          </Select>
          <Select value={value.period} onChange={(e) => set({ period: e.target.value as 'AM' | 'PM' })} aria-label="AM or PM">
            <option value="AM">AM</option>
            <option value="PM">PM</option>
          </Select>
        </div>
      </Field>
    </div>
  )
}

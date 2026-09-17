import { useState } from 'react'
import { Plus, X } from 'lucide-react'
import { Select } from '@/components/ui/select'
import { Input } from '@/components/ui/input'
import { REMINDER_PRESETS } from '@/lib/constants'
import { cn } from '@/lib/utils'

const CUSTOM_UNITS = [
  { label: 'minutes', minutes: 1 },
  { label: 'hours', minutes: 60 },
  { label: 'days', minutes: 1440 },
]

/** Lets the employee pick preset offsets (1 day / 6 hours before, etc.) plus
 * arbitrary custom ones — "how many times before that task" reminders. */
export function ReminderPicker({
  value,
  onChange,
  disabled,
}: {
  value: number[]
  onChange: (offsets: number[]) => void
  disabled?: boolean
}) {
  const [customValue, setCustomValue] = useState('1')
  const [customUnit, setCustomUnit] = useState(60)

  const togglePreset = (minutes: number) => {
    onChange(value.includes(minutes) ? value.filter((m) => m !== minutes) : [...value, minutes].sort((a, b) => a - b))
  }

  const addCustom = () => {
    const n = Number(customValue)
    if (!n || n <= 0) return
    const minutes = n * customUnit
    if (!value.includes(minutes)) onChange([...value, minutes].sort((a, b) => a - b))
  }

  const customOffsets = value.filter((m) => !REMINDER_PRESETS.some((p) => p.minutes === m))

  const formatOffset = (minutes: number) => {
    if (minutes % 1440 === 0) return `${minutes / 1440}d before`
    if (minutes % 60 === 0) return `${minutes / 60}h before`
    return `${minutes}m before`
  }

  return (
    <div className="flex flex-col gap-2">
      <div className="flex flex-wrap gap-2">
        {REMINDER_PRESETS.map((preset) => (
          <button
            key={preset.minutes}
            type="button"
            disabled={disabled}
            onClick={() => togglePreset(preset.minutes)}
            className={cn(
              'rounded-full px-3 py-1.5 text-xs font-medium ring-1 ring-inset transition-colors',
              value.includes(preset.minutes)
                ? 'bg-brand-50 text-brand-700 ring-brand-600/30'
                : 'bg-white text-slate-500 ring-slate-200 hover:bg-slate-50',
            )}
          >
            {preset.label}
          </button>
        ))}
        {customOffsets.map((minutes) => (
          <span
            key={minutes}
            className="flex items-center gap-1 rounded-full bg-brand-50 px-3 py-1.5 text-xs font-medium text-brand-700 ring-1 ring-inset ring-brand-600/30"
          >
            {formatOffset(minutes)}
            <button type="button" onClick={() => onChange(value.filter((m) => m !== minutes))}>
              <X className="size-3" />
            </button>
          </span>
        ))}
      </div>
      <div className="flex items-center gap-2">
        <Input
          type="number"
          min={1}
          value={customValue}
          onChange={(e) => setCustomValue(e.target.value)}
          disabled={disabled}
          className="w-20"
        />
        <Select value={customUnit} onChange={(e) => setCustomUnit(Number(e.target.value))} disabled={disabled} className="w-32">
          {CUSTOM_UNITS.map((u) => (
            <option key={u.label} value={u.minutes}>
              {u.label}
            </option>
          ))}
        </Select>
        <span className="text-xs text-slate-400">before</span>
        <button
          type="button"
          onClick={addCustom}
          disabled={disabled}
          className="flex items-center gap-1 rounded-lg px-2 py-1.5 text-xs font-medium text-brand-600 hover:bg-brand-50"
        >
          <Plus className="size-3.5" />
          Add
        </button>
      </div>
    </div>
  )
}

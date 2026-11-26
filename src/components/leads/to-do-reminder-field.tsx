import { BellRing } from 'lucide-react'
import { ReminderPicker } from '@/components/tasks/reminder-picker'
import { cn } from '@/lib/utils'

/**
 * Shown under a lead's follow-up or site visit date: the date is saved to My
 * To-Do as a task, and this picks when its reminders go off.
 */
export function ToDoReminderField({
  what,
  owner,
  value,
  onChange,
  className,
}: {
  /** "follow-up" or "site visit". */
  what: string
  /** Whose To-Do it lands in, e.g. "your To-Do" or "Priya’s To-Do". */
  owner: string
  value: number[]
  onChange: (offsets: number[]) => void
  className?: string
}) {
  return (
    <div className={cn('rounded-xl bg-brand-50/50 p-3 ring-1 ring-inset ring-brand-100', className)}>
      <p className="mb-2 flex items-center gap-1.5 text-xs font-medium text-slate-700">
        <BellRing className="size-3.5 text-brand-600" />
        The {what} is added to {owner}. Remind:
      </p>
      <ReminderPicker value={value} onChange={onChange} />
      <p className="mt-1.5 text-[11px] text-slate-400">A reminder at the time itself is always added.</p>
    </div>
  )
}

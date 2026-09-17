import { useEffect, useState, type FormEvent } from 'react'
import { Modal } from '@/components/ui/modal'
import { Field, Input } from '@/components/ui/input'
import { Select, Textarea } from '@/components/ui/select'
import { Button } from '@/components/ui/button'
import { ReminderPicker } from './reminder-picker'
import { useCreateTask, useUpdateTask } from '@/hooks/queries/use-tasks'
import { useLeads } from '@/hooks/queries/use-leads'
import { TASK_TYPE_LABELS } from '@/lib/constants'
import { TaskType, type Task } from '@/types'

const TASK_TYPE_OPTIONS = Object.values(TaskType)

/** Converts a Date + local <input type="datetime-local"> string pair. */
function toDatetimeLocal(iso?: string | null): string {
  if (!iso) return ''
  const d = new Date(iso)
  const pad = (n: number) => String(n).padStart(2, '0')
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`
}

export function TaskFormModal({
  open,
  onClose,
  lead,
  requireLeadSelect,
  task,
}: {
  open: boolean
  onClose: () => void
  /** Pre-linked, locked lead (e.g. opened from a lead's detail page). */
  lead?: { id: string; fullName: string }
  /** Show a lead picker instead (the To-Do page's "Lead Task" button). */
  requireLeadSelect?: boolean
  /** Editing an existing task instead of creating one. */
  task?: Task
}) {
  const create = useCreateTask()
  const update = useUpdateTask()
  const { data: leads } = useLeads()

  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [taskType, setTaskType] = useState<TaskType | ''>('')
  const [dueAt, setDueAt] = useState('')
  const [leadId, setLeadId] = useState('')
  const [reminders, setReminders] = useState<number[]>([1440, 360])

  useEffect(() => {
    if (!open) return
    setTitle(task?.title ?? '')
    setDescription(task?.description ?? '')
    setTaskType(task?.taskType ?? '')
    setDueAt(toDatetimeLocal(task?.dueAt))
    setLeadId(task?.leadId ?? lead?.id ?? '')
    setReminders([1440, 360])
  }, [open, task, lead])

  const pending = create.isPending || update.isPending

  const onSubmit = (e: FormEvent) => {
    e.preventDefault()
    if (!title.trim()) return

    const payload = {
      title: title.trim(),
      description: description.trim() || undefined,
      taskType: taskType || undefined,
      dueAt: dueAt ? new Date(dueAt).toISOString() : undefined,
      leadId: lead?.id ?? leadId ?? undefined,
      reminderOffsetsMinutes: dueAt ? reminders : undefined,
    }

    if (task) {
      update.mutate({ id: task.id, payload }, { onSuccess: onClose })
    } else {
      create.mutate(payload, { onSuccess: onClose })
    }
  }

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={task ? 'Edit task' : lead ? `Add task for ${lead.fullName}` : 'Add task'}
      subtitle={requireLeadSelect ? 'Pick a lead and schedule a task against it' : undefined}
      size="sm"
    >
      <form onSubmit={onSubmit} className="flex flex-col gap-4">
        <Field label="Title" required>
          <Input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Follow up with Rahul" />
        </Field>

        {requireLeadSelect && !lead && (
          <Field label="Lead" required hint="Only tasks linked to a lead show up on that lead's timeline">
            <Select value={leadId} onChange={(e) => setLeadId(e.target.value)}>
              <option value="">Select a lead…</option>
              {(leads ?? []).map((l) => (
                <option key={l.id} value={l.id}>
                  {l.fullName} — {l.phone}
                </option>
              ))}
            </Select>
          </Field>
        )}

        <Field label="Task type">
          <Select value={taskType} onChange={(e) => setTaskType(e.target.value as TaskType)}>
            <option value="">General</option>
            {TASK_TYPE_OPTIONS.map((t) => (
              <option key={t} value={t}>
                {TASK_TYPE_LABELS[t]}
              </option>
            ))}
          </Select>
        </Field>

        <Field label="Description">
          <Textarea value={description} onChange={(e) => setDescription(e.target.value)} placeholder="Optional notes" />
        </Field>

        <Field label="Due" hint="Leave blank for a task with no deadline">
          <Input type="datetime-local" value={dueAt} onChange={(e) => setDueAt(e.target.value)} />
        </Field>

        {dueAt && (
          <Field label="Remind me" hint="You'll get an in-app notification at each of these times">
            <ReminderPicker value={reminders} onChange={setReminders} disabled={pending} />
          </Field>
        )}

        <div className="flex justify-end gap-2 pt-2">
          <Button type="button" variant="ghost" onClick={onClose} disabled={pending}>
            Cancel
          </Button>
          <Button type="submit" loading={pending} disabled={requireLeadSelect && !lead && !leadId}>
            {task ? 'Save' : 'Add task'}
          </Button>
        </div>
      </form>
    </Modal>
  )
}

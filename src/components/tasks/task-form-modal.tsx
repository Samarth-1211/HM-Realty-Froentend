import { useEffect, useState, type FormEvent } from 'react'
import { Modal } from '@/components/ui/modal'
import { Field, Input } from '@/components/ui/input'
import { Select, Textarea } from '@/components/ui/select'
import { Button } from '@/components/ui/button'
import { ReminderPicker } from './reminder-picker'
import { useCreateTask, useUpdateTask } from '@/hooks/queries/use-tasks'
import { useLeads } from '@/hooks/queries/use-leads'
import { useUsers } from '@/hooks/queries/use-users'
import { useAuthStore } from '@/store/auth-store'
import { ASSIGNER_ROLES, TASK_PRIORITY_LABELS, TASK_TYPE_LABELS } from '@/lib/constants'
import { toDatetimeLocal } from '@/lib/utils'
import { TaskPriority, TaskType, type Task } from '@/types'

const TASK_TYPE_OPTIONS = Object.values(TaskType)
const TASK_PRIORITY_OPTIONS = Object.values(TaskPriority)

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
  const authUser = useAuthStore((s) => s.user)
  const canAssign = !!authUser && ASSIGNER_ROLES.includes(authUser.role)
  const { data: assignableUsers } = useUsers(canAssign)

  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [taskType, setTaskType] = useState<TaskType | ''>('')
  const [priority, setPriority] = useState<TaskPriority>(TaskPriority.NORMAL)
  const [assignedToId, setAssignedToId] = useState('')
  const [dueAt, setDueAt] = useState('')
  const [leadId, setLeadId] = useState('')
  const [reminders, setReminders] = useState<number[]>([1440, 360])

  useEffect(() => {
    if (!open) return
    setTitle(task?.title ?? '')
    setDescription(task?.description ?? '')
    setTaskType(task?.taskType ?? '')
    setPriority(task?.priority ?? TaskPriority.NORMAL)
    setAssignedToId(task?.userId ?? '')
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
      priority,
      assignedToId: canAssign ? assignedToId || undefined : undefined,
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

        <div className="grid grid-cols-2 gap-4">
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

          <Field label="Priority">
            <Select value={priority} onChange={(e) => setPriority(e.target.value as TaskPriority)}>
              {TASK_PRIORITY_OPTIONS.map((p) => (
                <option key={p} value={p}>
                  {TASK_PRIORITY_LABELS[p]}
                </option>
              ))}
            </Select>
          </Field>
        </div>

        {canAssign && (
          <Field label="Assign to" hint="Leave as yourself for a personal task">
            <Select value={assignedToId} onChange={(e) => setAssignedToId(e.target.value)}>
              <option value="">Myself</option>
              {(assignableUsers ?? [])
                .filter((u) => u.id !== authUser?.id)
                .map((u) => (
                  <option key={u.id} value={u.id}>
                    {u.firstName} {u.lastName}
                  </option>
                ))}
            </Select>
          </Field>
        )}

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

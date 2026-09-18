import { useState } from 'react'
import { Link } from '@tanstack/react-router'
import { Calendar, Check, Contact, Pencil, Trash2, UserRound } from 'lucide-react'
import { Badge, StatusPill } from '@/components/ui/badge'
import { ConfirmDialog } from '@/components/ui/confirm-dialog'
import { EmptyState } from '@/components/ui/empty-state'
import { TaskFormModal } from './task-form-modal'
import { useCompleteTask, useDeleteTask } from '@/hooks/queries/use-tasks'
import { useAuthStore } from '@/store/auth-store'
import { ASSIGNER_ROLES, TASK_PRIORITY_COLORS, TASK_PRIORITY_LABELS, TASK_STATUS_COLORS, TASK_TYPE_LABELS } from '@/lib/constants'
import { formatDateTime } from '@/lib/utils'
import { TaskPriority, TaskStatus, type Task } from '@/types'

export function TaskList({ tasks }: { tasks: Task[] }) {
  const complete = useCompleteTask()
  const del = useDeleteTask()
  const authUser = useAuthStore((s) => s.user)
  const [editing, setEditing] = useState<Task | null>(null)
  const [deleting, setDeleting] = useState<Task | null>(null)

  if (tasks.length === 0) {
    return <EmptyState icon={Calendar} title="No tasks here" description="Add a task to start tracking your day-to-day work." />
  }

  const isOverdue = (task: Task) => task.dueAt && task.status === TaskStatus.PENDING && new Date(task.dueAt) < new Date()

  return (
    <div className="flex flex-col gap-2">
      {tasks.map((task) => (
        <div
          key={task.id}
          className="flex items-start gap-3 rounded-xl border border-slate-100 p-3.5 hover:bg-slate-50/50"
        >
          <button
            onClick={() => complete.mutate(task.id)}
            disabled={task.status !== TaskStatus.PENDING || complete.isPending}
            className="mt-0.5 flex size-5 shrink-0 items-center justify-center rounded-full border border-slate-300 text-transparent hover:border-brand-500 hover:text-brand-500 disabled:cursor-not-allowed disabled:opacity-50 data-[done=true]:border-emerald-500 data-[done=true]:bg-emerald-500 data-[done=true]:text-white"
            data-done={task.status === TaskStatus.COMPLETED}
          >
            <Check className="size-3.5" />
          </button>

          <div className="min-w-0 flex-1">
            <p className={task.status === TaskStatus.COMPLETED ? 'text-sm text-slate-400 line-through' : 'text-sm font-medium text-slate-800'}>
              {task.title}
            </p>
            {task.description && <p className="mt-0.5 text-xs text-slate-500">{task.description}</p>}
            <div className="mt-1.5 flex flex-wrap items-center gap-1.5">
              {task.priority !== TaskPriority.NORMAL && (
                <StatusPill label={TASK_PRIORITY_LABELS[task.priority]} className={TASK_PRIORITY_COLORS[task.priority]} />
              )}
              {task.taskType && <Badge variant="neutral">{TASK_TYPE_LABELS[task.taskType]}</Badge>}
              {task.createdById !== task.userId && (
                <Badge variant="brand">
                  <UserRound className="size-3" />
                  {task.userId === authUser?.id
                    ? `Assigned by ${task.createdBy ? `${task.createdBy.firstName} ${task.createdBy.lastName}` : 'someone else'}`
                    : `Assigned to ${task.user ? `${task.user.firstName} ${task.user.lastName}` : 'someone'}`}
                </Badge>
              )}
              {task.dueAt && (
                <Badge variant={isOverdue(task) ? 'danger' : 'neutral'}>
                  <Calendar className="size-3" />
                  {formatDateTime(task.dueAt)}
                </Badge>
              )}
              {task.lead && (
                <Link to="/leads/$leadId" params={{ leadId: task.lead.id }} className="inline-flex">
                  <Badge variant="brand">
                    <Contact className="size-3" />
                    {task.lead.fullName}
                  </Badge>
                </Link>
              )}
              <StatusPill label={task.status} className={TASK_STATUS_COLORS[task.status]} />
            </div>
          </div>

          {task.status === TaskStatus.PENDING &&
            !!authUser &&
            (task.createdById === authUser.id || ASSIGNER_ROLES.includes(authUser.role)) && (
            <div className="flex shrink-0 items-center gap-1">
              <button
                onClick={() => setEditing(task)}
                className="flex size-8 items-center justify-center rounded-lg text-slate-400 hover:bg-slate-100 hover:text-slate-600"
              >
                <Pencil className="size-4" />
              </button>
              <button
                onClick={() => setDeleting(task)}
                className="flex size-8 items-center justify-center rounded-lg text-slate-400 hover:bg-rose-50 hover:text-rose-600"
              >
                <Trash2 className="size-4" />
              </button>
            </div>
          )}
        </div>
      ))}

      {editing && <TaskFormModal open onClose={() => setEditing(null)} task={editing} />}

      <ConfirmDialog
        open={!!deleting}
        onClose={() => setDeleting(null)}
        onConfirm={() => {
          if (deleting) del.mutate(deleting.id)
          setDeleting(null)
        }}
        loading={del.isPending}
        title="Delete this task?"
        description={deleting ? `"${deleting.title}" and any pending reminders will be removed.` : undefined}
        confirmLabel="Delete"
        variant="danger"
      />
    </div>
  )
}

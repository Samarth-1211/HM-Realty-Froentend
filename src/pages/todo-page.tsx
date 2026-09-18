import { useState } from 'react'
import { CalendarPlus, Plus } from 'lucide-react'
import { Card, CardBody, CardHeader } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Tabs } from '@/components/ui/tabs'
import { PageHeader } from '@/components/ui/page-header'
import { PageLoader } from '@/components/ui/spinner'
import { TaskList } from '@/components/tasks/task-list'
import { TaskFormModal } from '@/components/tasks/task-form-modal'
import { useMyTasks, useTasksAssignedByMe } from '@/hooks/queries/use-tasks'
import { useAuthStore } from '@/store/auth-store'
import { ASSIGNER_ROLES } from '@/lib/constants'
import { TaskStatus } from '@/types'
import type { TaskSourceFilter } from '@/api/tasks.api'

const STATUS_TABS = [
  { value: 'PENDING', label: 'Pending' },
  { value: 'COMPLETED', label: 'Completed' },
  { value: 'ALL', label: 'All' },
] as const

const SOURCE_TABS = [
  { value: 'ALL', label: 'All tasks' },
  { value: 'ASSIGNED_TO_ME', label: 'Assigned to me' },
  { value: 'PERSONAL', label: 'My own' },
] as const

export function TodoPage() {
  const authUser = useAuthStore((s) => s.user)
  const canAssign = !!authUser && ASSIGNER_ROLES.includes(authUser.role)

  const [tab, setTab] = useState<(typeof STATUS_TABS)[number]['value']>('PENDING')
  const [source, setSource] = useState<(typeof SOURCE_TABS)[number]['value']>('ALL')
  const [addOpen, setAddOpen] = useState(false)
  const [addLeadTaskOpen, setAddLeadTaskOpen] = useState(false)
  const [assignedTab, setAssignedTab] = useState<(typeof STATUS_TABS)[number]['value']>('PENDING')

  const { data: tasks, isLoading } = useMyTasks({
    ...(tab === 'ALL' ? {} : { status: tab as TaskStatus }),
    ...(source === 'ALL' ? {} : { source: source as TaskSourceFilter }),
  })

  const { data: assignedByMe, isLoading: assignedByMeLoading } = useTasksAssignedByMe(
    assignedTab === 'ALL' ? {} : { status: assignedTab as TaskStatus },
    canAssign,
  )

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        title="My To-Do"
        description="Personal tasks and lead follow-ups — you'll get reminders as they come due"
        actions={
          <div className="flex gap-2">
            <Button variant="secondary" onClick={() => setAddLeadTaskOpen(true)}>
              <CalendarPlus className="size-4" />
              Lead Task
            </Button>
            <Button onClick={() => setAddOpen(true)}>
              <Plus className="size-4" />
              {canAssign ? 'Add / Assign Task' : 'Add Task'}
            </Button>
          </div>
        }
      />

      <Card>
        <CardHeader title="Tasks" action={<Tabs tabs={[...STATUS_TABS]} active={tab} onChange={(v) => setTab(v as typeof tab)} />} />
        <CardBody className="flex flex-col gap-4">
          <Tabs tabs={[...SOURCE_TABS]} active={source} onChange={(v) => setSource(v as typeof source)} />
          {isLoading ? <PageLoader label="Loading tasks…" /> : <TaskList tasks={tasks ?? []} />}
        </CardBody>
      </Card>

      {canAssign && (
        <Card>
          <CardHeader
            title="Tasks I've Assigned"
            subtitle="What you've delegated to your team"
            action={<Tabs tabs={[...STATUS_TABS]} active={assignedTab} onChange={(v) => setAssignedTab(v as typeof assignedTab)} />}
          />
          <CardBody>
            {assignedByMeLoading ? <PageLoader label="Loading…" /> : <TaskList tasks={assignedByMe ?? []} />}
          </CardBody>
        </Card>
      )}

      <TaskFormModal open={addOpen} onClose={() => setAddOpen(false)} />
      <TaskFormModal open={addLeadTaskOpen} onClose={() => setAddLeadTaskOpen(false)} requireLeadSelect />
    </div>
  )
}

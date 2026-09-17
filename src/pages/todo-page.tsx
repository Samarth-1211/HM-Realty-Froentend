import { useState } from 'react'
import { CalendarPlus, Plus } from 'lucide-react'
import { Card, CardBody, CardHeader } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Tabs } from '@/components/ui/tabs'
import { PageHeader } from '@/components/ui/page-header'
import { PageLoader } from '@/components/ui/spinner'
import { TaskList } from '@/components/tasks/task-list'
import { TaskFormModal } from '@/components/tasks/task-form-modal'
import { useMyTasks } from '@/hooks/queries/use-tasks'
import { TaskStatus } from '@/types'

const TABS = [
  { value: 'PENDING', label: 'Pending' },
  { value: 'COMPLETED', label: 'Completed' },
  { value: 'ALL', label: 'All' },
] as const

export function TodoPage() {
  const [tab, setTab] = useState<(typeof TABS)[number]['value']>('PENDING')
  const [addOpen, setAddOpen] = useState(false)
  const [addLeadTaskOpen, setAddLeadTaskOpen] = useState(false)

  const { data: tasks, isLoading } = useMyTasks(tab === 'ALL' ? {} : { status: tab as TaskStatus })

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
              Add Task
            </Button>
          </div>
        }
      />

      <Card>
        <CardHeader
          title="Tasks"
          action={<Tabs tabs={[...TABS]} active={tab} onChange={(v) => setTab(v as typeof tab)} />}
        />
        <CardBody>{isLoading ? <PageLoader label="Loading tasks…" /> : <TaskList tasks={tasks ?? []} />}</CardBody>
      </Card>

      <TaskFormModal open={addOpen} onClose={() => setAddOpen(false)} />
      <TaskFormModal open={addLeadTaskOpen} onClose={() => setAddLeadTaskOpen(false)} requireLeadSelect />
    </div>
  )
}

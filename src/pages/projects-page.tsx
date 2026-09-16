import { useState } from 'react'
import { FolderKanban, Pencil, Plus, Trash2, Users } from 'lucide-react'
import { PageHeader } from '@/components/ui/page-header'
import { Card } from '@/components/ui/card'
import { DataTable, type Column } from '@/components/ui/data-table'
import { Button } from '@/components/ui/button'
import { DropdownMenu } from '@/components/ui/dropdown-menu'
import { Badge } from '@/components/ui/badge'
import { ConfirmDialog } from '@/components/ui/confirm-dialog'
import { ProjectFormModal } from '@/components/projects/project-form-modal'
import { AssignManagersModal } from '@/components/projects/assign-managers-modal'
import { useDeleteProject, useProjects } from '@/hooks/queries/use-projects'
import { formatCurrency } from '@/lib/utils'
import type { Project } from '@/types'

type DialogState =
  | { type: 'none' }
  | { type: 'create' }
  | { type: 'edit'; project: Project }
  | { type: 'assign'; project: Project }
  | { type: 'delete'; project: Project }

export function ProjectsPage() {
  const [dialog, setDialog] = useState<DialogState>({ type: 'none' })
  const { data: projects, isLoading } = useProjects()
  const remove = useDeleteProject()

  const close = () => setDialog({ type: 'none' })

  const columns: Column<Project>[] = [
    {
      key: 'name',
      header: 'Project',
      render: (p) => (
        <div>
          <p className="font-medium text-slate-800">{p.name}</p>
          <p className="text-xs text-slate-400">{p.location ?? '—'}</p>
        </div>
      ),
    },
    { key: 'price', header: 'Price', render: (p) => <span className="text-slate-600">{formatCurrency(p.price)}</span> },
    {
      key: 'size',
      header: 'Plot size',
      render: (p) => <span className="text-slate-500">{p.plotSize ? `${p.plotSize} ${p.plotSizeUnit ?? ''}` : '—'}</span>,
    },
    {
      key: 'platforms',
      header: 'Platforms',
      render: (p) => <span className="text-slate-500">{p.activePlatforms?.length ?? 0} active</span>,
    },
    {
      key: 'status',
      header: 'Status',
      render: (p) => <Badge variant={p.isActive ? 'success' : 'neutral'}>{p.isActive ? 'Active' : 'Inactive'}</Badge>,
    },
    {
      key: 'actions',
      header: '',
      headerClassName: 'w-10',
      className: 'w-10',
      render: (p) => (
        <DropdownMenu
          actions={[
            { label: 'Edit', icon: <Pencil className="size-4" />, onClick: () => setDialog({ type: 'edit', project: p }) },
            { label: 'Assign managers', icon: <Users className="size-4" />, onClick: () => setDialog({ type: 'assign', project: p }) },
            { label: 'Delete', icon: <Trash2 className="size-4" />, danger: true, onClick: () => setDialog({ type: 'delete', project: p }) },
          ]}
        />
      ),
    },
  ]

  return (
    <div>
      <PageHeader
        title="Projects"
        description="Property listings your teams sell and market."
        actions={
          <Button onClick={() => setDialog({ type: 'create' })}>
            <Plus className="size-4" />
            New project
          </Button>
        }
      />

      <Card>
        <DataTable
          columns={columns}
          data={projects ?? []}
          isLoading={isLoading}
          rowKey={(p) => p.id}
          emptyIcon={FolderKanban}
          emptyTitle="No projects yet"
          emptyDescription="Add your first property project to start assigning teams and leads."
        />
      </Card>

      <ProjectFormModal
        open={dialog.type === 'create' || dialog.type === 'edit'}
        onClose={close}
        project={dialog.type === 'edit' ? dialog.project : null}
      />

      <AssignManagersModal
        open={dialog.type === 'assign'}
        onClose={close}
        project={dialog.type === 'assign' ? dialog.project : null}
      />

      {dialog.type === 'delete' && (
        <ConfirmDialog
          open
          onClose={close}
          title={`Delete ${dialog.project.name}?`}
          description="This permanently deletes the project and its manager assignments."
          confirmLabel="Delete"
          variant="danger"
          loading={remove.isPending}
          onConfirm={() => remove.mutate(dialog.project.id, { onSuccess: close })}
        />
      )}
    </div>
  )
}

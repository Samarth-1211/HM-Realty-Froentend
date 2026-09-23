import { useState } from 'react'
import { UserCog, X } from 'lucide-react'
import { Modal } from '@/components/ui/modal'
import { ConfirmDialog } from '@/components/ui/confirm-dialog'
import { Select } from '@/components/ui/select'
import { Button } from '@/components/ui/button'
import { Avatar } from '@/components/ui/avatar'
import { Spinner } from '@/components/ui/spinner'
import { useManagers } from '@/hooks/queries/use-managers'
import {
  useAssignProjectManager,
  useProjectManagers,
  useUnassignProjectManager,
} from '@/hooks/queries/use-projects'
import type { Project } from '@/types'

export function AssignManagersModal({
  open,
  onClose,
  project,
}: {
  open: boolean
  onClose: () => void
  project: Project | null
}) {
  const [selected, setSelected] = useState('')
  const [unassigning, setUnassigning] = useState<{ managerId: string; name: string } | null>(null)
  const { data: allManagers } = useManagers()
  const { data: assigned, isLoading } = useProjectManagers(project?.id)
  const assign = useAssignProjectManager()
  const unassign = useUnassignProjectManager()

  if (!project) return null

  const assignedIds = new Set((assigned ?? []).map((a) => a.managerId))
  const available = (allManagers ?? []).filter((m) => !assignedIds.has(m.id))

  return (
    <Modal open={open} onClose={onClose} title="Assign managers" subtitle={project.name} size="sm">
      <div className="flex flex-col gap-4">
        <div className="flex gap-2">
          <Select value={selected} onChange={(e) => setSelected(e.target.value)} className="flex-1">
            <option value="">Select a manager…</option>
            {available.map((m) => (
              <option key={m.id} value={m.id}>
                {m.firstName} {m.lastName}
              </option>
            ))}
          </Select>
          <Button
            disabled={!selected}
            loading={assign.isPending}
            onClick={() => {
              assign.mutate({ id: project.id, managerId: selected }, { onSuccess: () => setSelected('') })
            }}
          >
            Assign
          </Button>
        </div>

        <div className="flex flex-col gap-1.5">
          {isLoading && (
            <div className="flex justify-center py-6">
              <Spinner />
            </div>
          )}
          {!isLoading && (assigned ?? []).length === 0 && (
            <p className="py-6 text-center text-sm text-slate-400">No managers assigned yet.</p>
          )}
          {(assigned ?? []).map((link) => (
            <div key={link.id} className="flex items-center gap-3 rounded-xl px-2 py-2 hover:bg-slate-50">
              <Avatar
                firstName={link.manager?.firstName ?? '?'}
                lastName={link.manager?.lastName ?? ''}
                size="sm"
              />
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-medium text-slate-800">
                  {link.manager?.firstName} {link.manager?.lastName}
                </p>
                <p className="truncate text-xs text-slate-400">{link.manager?.email}</p>
              </div>
              <button
                onClick={() =>
                  setUnassigning({
                    managerId: link.managerId,
                    name: `${link.manager?.firstName ?? ''} ${link.manager?.lastName ?? ''}`.trim() || 'this manager',
                  })
                }
                className="flex size-7 shrink-0 items-center justify-center rounded-lg text-slate-400 hover:bg-rose-50 hover:text-rose-600"
              >
                <X className="size-4" />
              </button>
            </div>
          ))}
        </div>

        {available.length === 0 && (allManagers ?? []).length === 0 && (
          <p className="flex items-center gap-2 text-xs text-slate-400">
            <UserCog className="size-3.5" />
            Create a manager first to assign them to this project.
          </p>
        )}
      </div>

      {unassigning && (
        <ConfirmDialog
          open
          onClose={() => setUnassigning(null)}
          title={`Remove ${unassigning.name} from ${project.name}?`}
          description="They will lose access to this project and to the leads under it. You can assign them again at any time."
          confirmLabel="Remove"
          variant="danger"
          loading={unassign.isPending}
          onConfirm={() =>
            unassign.mutate(
              { id: project.id, managerId: unassigning.managerId },
              { onSuccess: () => setUnassigning(null) },
            )
          }
        />
      )}
    </Modal>
  )
}

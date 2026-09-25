import { useState } from 'react'
import { useNavigate } from '@tanstack/react-router'
import { Mail, Pencil, Play, Plus, Trash2, UserCog, UserX } from 'lucide-react'
import { PageHeader } from '@/components/ui/page-header'
import { Card } from '@/components/ui/card'
import { DataTable, type Column } from '@/components/ui/data-table'
import { Button } from '@/components/ui/button'
import { DropdownMenu } from '@/components/ui/dropdown-menu'
import { Badge } from '@/components/ui/badge'
import { Avatar } from '@/components/ui/avatar'
import { ConfirmDialog } from '@/components/ui/confirm-dialog'
import { ManagerFormModal } from '@/components/managers/manager-form-modal'
import {
  useDeactivateManager,
  useDeleteManager,
  useManagers,
  useReactivateManager,
  useResendManagerVerification,
} from '@/hooks/queries/use-managers'
import { formatDate } from '@/lib/utils'
import type { ManagerSummary } from '@/types'

type DialogState =
  | { type: 'none' }
  | { type: 'create' }
  | { type: 'edit'; manager: ManagerSummary }
  | { type: 'deactivate'; manager: ManagerSummary }
  | { type: 'reactivate'; manager: ManagerSummary }
  | { type: 'delete'; manager: ManagerSummary }
  | { type: 'resend'; manager: ManagerSummary }

export function ManagersPage() {
  const navigate = useNavigate()
  const [dialog, setDialog] = useState<DialogState>({ type: 'none' })
  const { data: managers, isLoading } = useManagers()
  const deactivate = useDeactivateManager()
  const reactivate = useReactivateManager()
  const remove = useDeleteManager()
  const resendVerification = useResendManagerVerification()

  const close = () => setDialog({ type: 'none' })

  const columns: Column<ManagerSummary>[] = [
    {
      key: 'name',
      header: 'Manager',
      render: (m) => (
        <div className="flex items-center gap-3">
          <Avatar firstName={m.firstName} lastName={m.lastName} size="sm" />
          <div>
            <p className="font-medium text-slate-800">
              {m.firstName} {m.lastName}
            </p>
            <p className="text-xs text-slate-400">{m.email}</p>
          </div>
        </div>
      ),
    },
    { key: 'phone', header: 'Mobile', render: (m) => <span className="text-slate-500">{m.phone ?? '—'}</span> },
    {
      key: 'status',
      header: 'Status',
      render: (m) => (
        <Badge variant={m.isActive ? 'success' : 'neutral'}>{m.isActive ? 'Active' : 'Inactive'}</Badge>
      ),
    },
    { key: 'created', header: 'Created', render: (m) => <span className="text-slate-400">{formatDate(m.createdAt)}</span> },
    {
      key: 'verification',
      header: 'Verification',
      render: (m) =>
        m.isVerified ? (
          <Badge variant="success">Verified</Badge>
        ) : (
          <div className="flex items-center gap-2">
            <Badge variant="warning">Pending</Badge>
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={(e) => {
                e.stopPropagation()
                setDialog({ type: 'resend', manager: m })
              }}
            >
              <Mail className="size-3.5" />
              Resend
            </Button>
          </div>
        ),
    },
    {
      key: 'actions',
      header: '',
      headerClassName: 'w-10',
      className: 'w-10',
      render: (m) => (
        <DropdownMenu
          actions={[
            { label: 'Edit', icon: <Pencil className="size-4" />, onClick: () => setDialog({ type: 'edit', manager: m }) },
            m.isActive
              ? {
                  label: 'Deactivate',
                  icon: <UserX className="size-4" />,
                  onClick: () => setDialog({ type: 'deactivate', manager: m }),
                }
              : {
                  label: 'Reactivate',
                  icon: <Play className="size-4" />,
                  onClick: () => setDialog({ type: 'reactivate', manager: m }),
                },
            {
              label: 'Delete',
              icon: <Trash2 className="size-4" />,
              danger: true,
              onClick: () => setDialog({ type: 'delete', manager: m }),
            },
          ]}
        />
      ),
    },
  ]

  return (
    <div>
      <PageHeader
        title="Managers"
        description="Managers build and run their own sales teams and projects."
        actions={
          <Button onClick={() => setDialog({ type: 'create' })}>
            <Plus className="size-4" />
            New manager
          </Button>
        }
      />

      <Card>
        <DataTable
          columns={columns}
          data={managers ?? []}
          isLoading={isLoading}
          rowKey={(m) => m.id}
          onRowClick={(m) => navigate({ to: '/users/$userId', params: { userId: m.id } })}
          emptyIcon={UserCog}
          emptyTitle="No managers yet"
          emptyDescription="Create your first manager to start building sales teams."
        />
      </Card>

      <ManagerFormModal
        open={dialog.type === 'create' || dialog.type === 'edit'}
        onClose={close}
        manager={dialog.type === 'edit' ? dialog.manager : null}
      />

      {dialog.type === 'deactivate' && (
        <ConfirmDialog
          open
          onClose={close}
          title={`Deactivate ${dialog.manager.firstName}?`}
          description="They will no longer be able to sign in."
          confirmLabel="Deactivate"
          variant="danger"
          loading={deactivate.isPending}
          onConfirm={() => deactivate.mutate(dialog.manager.id, { onSuccess: close })}
        />
      )}

      {dialog.type === 'reactivate' && (
        <ConfirmDialog
          open
          onClose={close}
          title={`Reactivate ${dialog.manager.firstName}?`}
          confirmLabel="Reactivate"
          loading={reactivate.isPending}
          onConfirm={() => reactivate.mutate(dialog.manager.id, { onSuccess: close })}
        />
      )}

      {dialog.type === 'delete' && (
        <ConfirmDialog
          open
          onClose={close}
          title={`Delete ${dialog.manager.firstName}?`}
          description="This permanently deletes the manager account from the database. This cannot be undone. If they still have assigned leads, tasks, attendance, targets, or direct reports, you'll need to reassign those first."
          confirmLabel="Delete"
          variant="danger"
          requireReason
          reasonLabel="Reason (optional)"
          requireTypedConfirmation="delete"
          loading={remove.isPending}
          onConfirm={(reason) => remove.mutate({ id: dialog.manager.id, reason }, { onSuccess: close })}
        />
      )}

      {dialog.type === 'resend' && (
        <ConfirmDialog
          open
          onClose={close}
          title={`Resend the verification email to ${dialog.manager.firstName}?`}
          description={`A new verification link will be emailed to ${dialog.manager.email}. Any link sent earlier stops working.`}
          confirmLabel="Send email"
          loading={resendVerification.isPending}
          onConfirm={() => resendVerification.mutate(dialog.manager.id, { onSuccess: close })}
        />
      )}
    </div>
  )
}

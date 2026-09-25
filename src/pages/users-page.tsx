import { useState } from 'react'
import { useNavigate } from '@tanstack/react-router'
import { Plus, Trash2, UserX, Users2 } from 'lucide-react'
import { PageHeader } from '@/components/ui/page-header'
import { Card } from '@/components/ui/card'
import { DataTable, type Column } from '@/components/ui/data-table'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Avatar } from '@/components/ui/avatar'
import { DropdownMenu } from '@/components/ui/dropdown-menu'
import { ConfirmDialog } from '@/components/ui/confirm-dialog'
import { UserFormModal } from '@/components/users/user-form-modal'
import { useDeactivateUser, useDeleteUser, useUsers } from '@/hooks/queries/use-users'
import { useAuthStore } from '@/store/auth-store'
import { CREATION_MATRIX } from '@/lib/constants'
import { formatDate, formatRoleLabel } from '@/lib/utils'
import { UserRole, type User } from '@/types'

type DialogState = { type: 'none' } | { type: 'create' } | { type: 'deactivate'; user: User } | { type: 'delete'; user: User }

export function UsersPage() {
  const currentUser = useAuthStore((s) => s.user)
  const navigate = useNavigate()
  const [dialog, setDialog] = useState<DialogState>({ type: 'none' })
  const { data: users, isLoading } = useUsers()
  const deactivate = useDeactivateUser()
  const remove = useDeleteUser()

  if (!currentUser) return null
  const close = () => setDialog({ type: 'none' })
  const canCreate = CREATION_MATRIX[currentUser.role].length > 0
  const canManage = currentUser.role === UserRole.SUPER_ADMIN || currentUser.role === UserRole.ADMIN

  const columns: Column<User>[] = [
    {
      key: 'name',
      header: 'User',
      render: (u) => (
        <div className="flex items-center gap-3">
          <Avatar firstName={u.firstName} lastName={u.lastName} size="sm" />
          <div>
            <p className="font-medium text-slate-800">
              {u.firstName} {u.lastName}
            </p>
            <p className="text-xs text-slate-400">{u.email}</p>
          </div>
        </div>
      ),
    },
    { key: 'role', header: 'Role', render: (u) => <Badge variant="brand">{formatRoleLabel(u.role)}</Badge> },
    {
      key: 'status',
      header: 'Status',
      render: (u) => <Badge variant={u.isActive ? 'success' : 'neutral'}>{u.isActive ? 'Active' : 'Inactive'}</Badge>,
    },
    { key: 'created', header: 'Created', render: (u) => <span className="text-slate-400">{formatDate(u.createdAt)}</span> },
    ...(canManage
      ? [
          {
            key: 'actions',
            header: '',
            headerClassName: 'w-10',
            className: 'w-10',
            render: (u: User) => (
              <DropdownMenu
                actions={[
                  {
                    label: 'Deactivate',
                    icon: <UserX className="size-4" />,
                    disabled: !u.isActive || currentUser.role === UserRole.MANAGER,
                    onClick: () => setDialog({ type: 'deactivate', user: u }),
                  },
                  {
                    label: 'Delete admin',
                    icon: <Trash2 className="size-4" />,
                    danger: true,
                    disabled:
                      currentUser.role !== UserRole.SUPER_ADMIN || u.role !== UserRole.ADMIN || u.id === currentUser.id,
                    onClick: () => setDialog({ type: 'delete', user: u }),
                  },
                ]}
              />
            ),
          },
        ]
      : []),
  ]

  return (
    <div>
      <PageHeader
        title="Users"
        description="Everyone with access to your organization. Click a user for their attendance, leads and full details."
        actions={
          canCreate && (
            <Button onClick={() => setDialog({ type: 'create' })}>
              <Plus className="size-4" />
              New user
            </Button>
          )
        }
      />

      <Card>
        <DataTable
          columns={columns}
          data={users ?? []}
          isLoading={isLoading}
          rowKey={(u) => u.id}
          onRowClick={(u) => navigate({ to: '/users/$userId', params: { userId: u.id } })}
          emptyIcon={Users2}
          emptyTitle="No users found"
        />
      </Card>

      <UserFormModal open={dialog.type === 'create'} onClose={close} actorRole={currentUser.role} />

      {dialog.type === 'deactivate' && (
        <ConfirmDialog
          open
          onClose={close}
          title={`Deactivate ${dialog.user.firstName}?`}
          description="They will no longer be able to sign in."
          confirmLabel="Deactivate"
          variant="danger"
          loading={deactivate.isPending}
          onConfirm={() => deactivate.mutate(dialog.user.id, { onSuccess: close })}
        />
      )}

      {dialog.type === 'delete' && (
        <ConfirmDialog
          open
          onClose={close}
          title={`Delete admin ${dialog.user.firstName}?`}
          description="This permanently deletes the admin account from the database. This cannot be undone. If they still have assigned leads, tasks, attendance, targets, or direct reports, you'll need to reassign those first."
          confirmLabel="Delete"
          variant="danger"
          requireReason
          reasonLabel="Reason (optional)"
          requireTypedConfirmation="delete"
          loading={remove.isPending}
          onConfirm={(reason) => remove.mutate({ id: dialog.user.id, reason }, { onSuccess: close })}
        />
      )}
    </div>
  )
}

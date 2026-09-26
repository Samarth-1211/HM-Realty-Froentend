import { useState } from 'react'
import { useNavigate } from '@tanstack/react-router'
import { Play, Plus, Trash2, UserX, Users2 } from 'lucide-react'
import { PageHeader } from '@/components/ui/page-header'
import { Card } from '@/components/ui/card'
import { DataTable, type Column } from '@/components/ui/data-table'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Avatar } from '@/components/ui/avatar'
import { Tabs } from '@/components/ui/tabs'
import { DropdownMenu } from '@/components/ui/dropdown-menu'
import { ConfirmDialog } from '@/components/ui/confirm-dialog'
import { UserFormModal } from '@/components/users/user-form-modal'
import { DeleteUserDialog } from '@/components/users/delete-user-dialog'
import { useDeactivateUser, useDeletedUsers, useReactivateUser, useUsers } from '@/hooks/queries/use-users'
import { useAuthStore } from '@/store/auth-store'
import { CREATION_MATRIX } from '@/lib/constants'
import { formatDate, formatRoleLabel } from '@/lib/utils'
import { UserRole, type User } from '@/types'

type DialogState =
  | { type: 'none' }
  | { type: 'create' }
  | { type: 'deactivate'; user: User }
  | { type: 'reactivate'; user: User }
  | { type: 'delete'; user: User }

const SALES_ROLES: UserRole[] = [UserRole.PRESALES, UserRole.POSTSALES, UserRole.AGENT]

// Mirrors the backend's UserDeletionService: who may delete whom.
const DELETABLE_ROLES: Partial<Record<UserRole, UserRole[]>> = {
  SUPER_ADMIN: [UserRole.ADMIN, UserRole.MANAGER, ...SALES_ROLES],
  ADMIN: [UserRole.MANAGER, ...SALES_ROLES],
}

export function UsersPage() {
  const currentUser = useAuthStore((s) => s.user)
  const navigate = useNavigate()
  const [dialog, setDialog] = useState<DialogState>({ type: 'none' })
  const [view, setView] = useState<'current' | 'deleted'>('current')
  const canManage = currentUser?.role === UserRole.SUPER_ADMIN || currentUser?.role === UserRole.ADMIN
  const { data: users, isLoading } = useUsers()
  const { data: deletedUsers, isLoading: deletedLoading } = useDeletedUsers(canManage && view === 'deleted')
  const deactivate = useDeactivateUser()
  const reactivate = useReactivateUser()

  if (!currentUser) return null
  const close = () => setDialog({ type: 'none' })
  const canCreate = CREATION_MATRIX[currentUser.role].length > 0
  const deletableRoles = DELETABLE_ROLES[currentUser.role] ?? []
  const showingDeleted = view === 'deleted'

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
    { key: 'phone', header: 'Mobile', render: (u) => <span className="text-slate-500">{u.phone ?? '—'}</span> },
    { key: 'role', header: 'Role', render: (u) => <Badge variant="brand">{formatRoleLabel(u.role)}</Badge> },
    {
      key: 'status',
      header: 'Status',
      render: (u) =>
        u.isDeleted ? (
          <Badge variant="danger">Deleted</Badge>
        ) : (
          <Badge variant={u.isActive ? 'success' : 'neutral'}>{u.isActive ? 'Active' : 'Inactive'}</Badge>
        ),
    },
    showingDeleted
      ? {
          key: 'deleted',
          header: 'Deleted',
          render: (u) => <span className="text-slate-400">{u.deletedAt ? formatDate(u.deletedAt) : '—'}</span>,
        }
      : { key: 'created', header: 'Created', render: (u) => <span className="text-slate-400">{formatDate(u.createdAt)}</span> },
    ...(canManage && !showingDeleted
      ? [
          {
            key: 'actions',
            header: '',
            headerClassName: 'w-10',
            className: 'w-10',
            render: (u: User) => {
              const isSelf = u.id === currentUser.id
              return (
                <DropdownMenu
                  actions={[
                    u.isActive
                      ? {
                          label: 'Deactivate',
                          icon: <UserX className="size-4" />,
                          disabled: isSelf,
                          onClick: () => setDialog({ type: 'deactivate', user: u }),
                        }
                      : {
                          label: 'Reactivate',
                          icon: <Play className="size-4" />,
                          disabled: isSelf,
                          onClick: () => setDialog({ type: 'reactivate', user: u }),
                        },
                    {
                      label: 'Delete',
                      icon: <Trash2 className="size-4" />,
                      danger: true,
                      disabled: isSelf || !deletableRoles.includes(u.role),
                      onClick: () => setDialog({ type: 'delete', user: u }),
                    },
                  ]}
                />
              )
            },
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

      {canManage && (
        <div className="mb-4 max-w-xs">
          <Tabs
            tabs={[
              { value: 'current', label: 'Users' },
              { value: 'deleted', label: 'Deleted users' },
            ]}
            active={view}
            onChange={(v) => setView(v as 'current' | 'deleted')}
          />
        </div>
      )}

      <Card>
        <DataTable
          columns={columns}
          data={(showingDeleted ? deletedUsers : users) ?? []}
          isLoading={showingDeleted ? deletedLoading : isLoading}
          rowKey={(u) => u.id}
          onRowClick={(u) => navigate({ to: '/users/$userId', params: { userId: u.id } })}
          emptyIcon={Users2}
          emptyTitle={showingDeleted ? 'No deleted users' : 'No users found'}
          emptyDescription={
            showingDeleted ? 'Deleted accounts show up here so you can still open their history.' : undefined
          }
        />
      </Card>

      <UserFormModal open={dialog.type === 'create'} onClose={close} actorRole={currentUser.role} />

      {dialog.type === 'deactivate' && (
        <ConfirmDialog
          open
          onClose={close}
          title={`Deactivate ${dialog.user.firstName}?`}
          description="They will no longer be able to sign in or receive new leads. You can reactivate them any time."
          confirmLabel="Deactivate"
          variant="danger"
          loading={deactivate.isPending}
          onConfirm={() => deactivate.mutate(dialog.user.id, { onSuccess: close })}
        />
      )}

      {dialog.type === 'reactivate' && (
        <ConfirmDialog
          open
          onClose={close}
          title={`Reactivate ${dialog.user.firstName}?`}
          description="They will be able to sign in and receive leads again."
          confirmLabel="Reactivate"
          loading={reactivate.isPending}
          onConfirm={() => reactivate.mutate(dialog.user.id, { onSuccess: close })}
        />
      )}

      {dialog.type === 'delete' && <DeleteUserDialog scope="org" user={dialog.user} onClose={close} />}
    </div>
  )
}

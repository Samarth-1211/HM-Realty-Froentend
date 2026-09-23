import { useState } from 'react'
import { Mail, Plus, UsersRound } from 'lucide-react'
import { PageHeader } from '@/components/ui/page-header'
import { Card } from '@/components/ui/card'
import { DataTable, type Column } from '@/components/ui/data-table'
import { Select } from '@/components/ui/select'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Avatar } from '@/components/ui/avatar'
import { Pagination } from '@/components/ui/pagination'
import { TeamMemberCreateModal } from '@/components/team/team-member-create-modal'
import { TeamMemberDetailModal } from '@/components/team/team-member-detail-modal'
import { TeamRollupPanel } from '@/components/team/team-rollup-panel'
import { useResendTeamMemberVerification, useTeamMembers } from '@/hooks/queries/use-team'
import { STAFF_ROLES } from '@/lib/constants'
import { formatRoleLabel } from '@/lib/utils'
import type { User } from '@/types'

export function TeamPage() {
  const [role, setRole] = useState('')
  const [isActive, setIsActive] = useState('')
  const [page, setPage] = useState(1)
  const [createOpen, setCreateOpen] = useState(false)
  const [detailId, setDetailId] = useState<string | null>(null)
  const pageSize = 10

  const { data, isLoading } = useTeamMembers({
    role: (role || undefined) as 'AGENT' | 'PRESALES' | 'POSTSALES' | undefined,
    isActive: isActive === '' ? undefined : isActive === 'true',
    page,
    pageSize,
  })
  const resendVerification = useResendTeamMemberVerification()

  const columns: Column<User>[] = [
    {
      key: 'name',
      header: 'Team member',
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
    { key: 'role', header: 'Role', render: (u) => <span className="text-slate-500">{formatRoleLabel(u.role)}</span> },
    {
      key: 'status',
      header: 'Status',
      render: (u) => <Badge variant={u.isActive ? 'success' : 'neutral'}>{u.isActive ? 'Active' : 'Inactive'}</Badge>,
    },
    {
      key: 'verification',
      header: 'Verification',
      render: (u) =>
        u.isVerified ? (
          <Badge variant="success">Verified</Badge>
        ) : (
          <div className="flex items-center gap-2">
            <Badge variant="warning">Pending</Badge>
            <Button
              type="button"
              variant="ghost"
              size="sm"
              loading={resendVerification.isPending}
              onClick={(e) => {
                e.stopPropagation()
                resendVerification.mutate(u.id)
              }}
            >
              <Mail className="size-3.5" />
              Resend
            </Button>
          </div>
        ),
    },
  ]

  return (
    <div>
      <PageHeader
        title="My Team"
        description="Presales, postsales and agents reporting to you."
        actions={
          <Button onClick={() => setCreateOpen(true)}>
            <Plus className="size-4" />
            Add team member
          </Button>
        }
      />

      <div className="mb-6">
        <TeamRollupPanel />
      </div>

      <Card>
        <div className="flex flex-col gap-3 border-b border-slate-100 p-4 sm:flex-row">
          <Select
            value={role}
            onChange={(e) => {
              setRole(e.target.value)
              setPage(1)
            }}
            className="sm:max-w-[180px]"
          >
            <option value="">All roles</option>
            {STAFF_ROLES.map((r) => (
              <option key={r} value={r}>
                {formatRoleLabel(r)}
              </option>
            ))}
          </Select>
          <Select
            value={isActive}
            onChange={(e) => {
              setIsActive(e.target.value)
              setPage(1)
            }}
            className="sm:max-w-[160px]"
          >
            <option value="">All statuses</option>
            <option value="true">Active</option>
            <option value="false">Inactive</option>
          </Select>
        </div>

        <DataTable
          columns={columns}
          data={data?.items ?? []}
          isLoading={isLoading}
          rowKey={(u) => u.id}
          onRowClick={(u) => setDetailId(u.id)}
          emptyIcon={UsersRound}
          emptyTitle="No team members yet"
          emptyDescription="Add your first presales, postsales or agent to start assigning leads."
        />
        {data && data.total > 0 && (
          <Pagination page={page} pageSize={pageSize} total={data.total} onPageChange={setPage} />
        )}
      </Card>

      <TeamMemberCreateModal open={createOpen} onClose={() => setCreateOpen(false)} />
      <TeamMemberDetailModal open={!!detailId} onClose={() => setDetailId(null)} memberId={detailId} />
    </div>
  )
}

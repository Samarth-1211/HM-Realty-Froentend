import { useState } from 'react'
import { Archive, Building2, Mail, Pencil, Play, Plus, Search, ShieldPlus, PauseCircle } from 'lucide-react'
import { PageHeader } from '@/components/ui/page-header'
import { Card } from '@/components/ui/card'
import { DataTable, type Column } from '@/components/ui/data-table'
import { Input } from '@/components/ui/input'
import { Select } from '@/components/ui/select'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { DropdownMenu } from '@/components/ui/dropdown-menu'
import { OrgStatusBadge } from '@/components/leads/lead-status-badge'
import { ConfirmDialog } from '@/components/ui/confirm-dialog'
import { OrganizationFormModal } from '@/components/organizations/organization-form-modal'
import { AddAdminModal } from '@/components/organizations/add-admin-modal'
import {
  useArchiveOrganization,
  useOrganizations,
  useReactivateOrganization,
  useResendOrgAdminVerification,
  useSuspendOrganization,
} from '@/hooks/queries/use-organizations'
import { OrganizationStatus, SubscriptionPlan, type Organization } from '@/types'
import { formatDate, formatEnumLabel } from '@/lib/utils'

type DialogState =
  | { type: 'none' }
  | { type: 'create' }
  | { type: 'edit'; org: Organization }
  | { type: 'add-admin'; org: Organization }
  | { type: 'suspend'; org: Organization }
  | { type: 'reactivate'; org: Organization }
  | { type: 'archive'; org: Organization }
  | { type: 'resend'; org: Organization }

export function OrganizationsPage() {
  const [search, setSearch] = useState('')
  const [status, setStatus] = useState<string>('')
  const [plan, setPlan] = useState<string>('')
  const [dialog, setDialog] = useState<DialogState>({ type: 'none' })

  const { data: orgs, isLoading } = useOrganizations({
    search: search || undefined,
    status: (status || undefined) as OrganizationStatus | undefined,
    plan: (plan || undefined) as SubscriptionPlan | undefined,
  })

  const suspend = useSuspendOrganization()
  const reactivate = useReactivateOrganization()
  const archive = useArchiveOrganization()
  const resendVerification = useResendOrgAdminVerification()

  const close = () => setDialog({ type: 'none' })

  const columns: Column<Organization>[] = [
    {
      key: 'name',
      header: 'Organization',
      render: (o) => (
        <div>
          <p className="font-medium text-slate-800">
            {o.name} {o.isDemo && <span className="ml-1 text-xs text-slate-400">(demo)</span>}
          </p>
          <p className="text-xs text-slate-400">{o.contactEmail}</p>
        </div>
      ),
    },
    { key: 'plan', header: 'Plan', render: (o) => <span className="text-slate-500">{formatEnumLabel(o.plan)}</span> },
    { key: 'status', header: 'Status', render: (o) => <OrgStatusBadge status={o.status} /> },
    {
      key: 'limits',
      header: 'Limits',
      render: (o) => (
        <span className="text-slate-500">
          {o.maxUsers} users · {o.maxLeadsPerMonth}/mo leads
        </span>
      ),
    },
    { key: 'created', header: 'Created', render: (o) => <span className="text-slate-400">{formatDate(o.createdAt)}</span> },
    {
      key: 'verification',
      header: 'Admin verification',
      render: (o) =>
        o.isVerified ? (
          <Badge variant="success">Verified</Badge>
        ) : (
          <div className="flex items-center gap-2">
            <Badge variant="warning">Pending</Badge>
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={() => setDialog({ type: 'resend', org: o })}
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
      render: (o) => (
        <DropdownMenu
          actions={[
            { label: 'Edit', icon: <Pencil className="size-4" />, onClick: () => setDialog({ type: 'edit', org: o }) },
            {
              label: 'Add admin',
              icon: <ShieldPlus className="size-4" />,
              onClick: () => setDialog({ type: 'add-admin', org: o }),
            },
            o.status === 'SUSPENDED'
              ? {
                  label: 'Reactivate',
                  icon: <Play className="size-4" />,
                  onClick: () => setDialog({ type: 'reactivate', org: o }),
                }
              : {
                  label: 'Suspend',
                  icon: <PauseCircle className="size-4" />,
                  onClick: () => setDialog({ type: 'suspend', org: o }),
                  disabled: o.status === 'ARCHIVED',
                },
            {
              label: 'Archive',
              icon: <Archive className="size-4" />,
              danger: true,
              disabled: o.status === 'ARCHIVED' || o.isDemo,
              onClick: () => setDialog({ type: 'archive', org: o }),
            },
          ]}
        />
      ),
    },
  ]

  return (
    <div>
      <PageHeader
        title="Organizations"
        description="Manage every tenant on the platform."
        actions={
          <Button onClick={() => setDialog({ type: 'create' })}>
            <Plus className="size-4" />
            New organization
          </Button>
        }
      />

      <Card>
        <div className="flex flex-col gap-3 border-b border-slate-100 p-4 sm:flex-row sm:items-center">
          <Input
            placeholder="Search by name or email…"
            leftIcon={<Search className="size-4" />}
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="sm:max-w-xs"
          />
          <Select value={status} onChange={(e) => setStatus(e.target.value)} className="sm:max-w-[160px]">
            <option value="">All statuses</option>
            {Object.values(OrganizationStatus).map((s) => (
              <option key={s} value={s}>
                {formatEnumLabel(s)}
              </option>
            ))}
          </Select>
          <Select value={plan} onChange={(e) => setPlan(e.target.value)} className="sm:max-w-[160px]">
            <option value="">All plans</option>
            {Object.values(SubscriptionPlan).map((p) => (
              <option key={p} value={p}>
                {formatEnumLabel(p)}
              </option>
            ))}
          </Select>
        </div>

        <DataTable
          columns={columns}
          data={orgs ?? []}
          isLoading={isLoading}
          rowKey={(o) => o.id}
          emptyIcon={Building2}
          emptyTitle="No organizations found"
          emptyDescription="Try adjusting your filters, or create a new organization."
        />
      </Card>

      <OrganizationFormModal
        open={dialog.type === 'create' || dialog.type === 'edit'}
        onClose={close}
        organization={dialog.type === 'edit' ? dialog.org : null}
      />

      {dialog.type === 'add-admin' && (
        <AddAdminModal
          open
          onClose={close}
          organizationId={dialog.org.id}
          organizationName={dialog.org.name}
        />
      )}

      {dialog.type === 'suspend' && (
        <ConfirmDialog
          open
          onClose={close}
          title={`Suspend ${dialog.org.name}?`}
          description="All users in this organization will be deactivated until reactivated."
          confirmLabel="Suspend"
          variant="danger"
          requireReason
          reasonLabel="Reason (required)"
          loading={suspend.isPending}
          onConfirm={(reason) => {
            if (!reason) return
            suspend.mutate({ id: dialog.org.id, reason }, { onSuccess: close })
          }}
        />
      )}

      {dialog.type === 'reactivate' && (
        <ConfirmDialog
          open
          onClose={close}
          title={`Reactivate ${dialog.org.name}?`}
          description="The organization status will be set back to active. Users are not auto-reactivated."
          confirmLabel="Reactivate"
          requireReason
          reasonLabel="Reason (optional)"
          loading={reactivate.isPending}
          onConfirm={(reason) => reactivate.mutate({ id: dialog.org.id, reason }, { onSuccess: close })}
        />
      )}

      {dialog.type === 'archive' && (
        <ConfirmDialog
          open
          onClose={close}
          title={`Archive ${dialog.org.name}?`}
          description="This soft-deletes the organization and deactivates all its users. This cannot be undone from here."
          confirmLabel="Archive"
          variant="danger"
          loading={archive.isPending}
          onConfirm={() => archive.mutate(dialog.org.id, { onSuccess: close })}
        />
      )}

      {dialog.type === 'resend' && (
        <ConfirmDialog
          open
          onClose={close}
          title={`Resend the admin verification email for ${dialog.org.name}?`}
          description="A new verification link will be emailed to this organization's admin. Any link sent earlier stops working."
          confirmLabel="Send email"
          loading={resendVerification.isPending}
          onConfirm={() => resendVerification.mutate(dialog.org.id, { onSuccess: close })}
        />
      )}
    </div>
  )
}

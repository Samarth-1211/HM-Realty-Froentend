import { useState } from 'react'
import { Pencil, Plus, Target as TargetIcon, Trash2 } from 'lucide-react'
import { Card, CardBody, CardHeader } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Avatar } from '@/components/ui/avatar'
import { EmptyState } from '@/components/ui/empty-state'
import { Spinner } from '@/components/ui/spinner'
import { ConfirmDialog } from '@/components/ui/confirm-dialog'
import { SetTargetModal } from './set-target-modal'
import { TargetRow } from './target-row'
import { TargetDetailModal } from './target-detail-modal'
import { currentPeriod, periodRange, todayKey, TARGET_METRIC_LABELS, type TargetPeriod } from './target-utils'
import { useDeleteTarget, useTeamTargets } from '@/hooks/queries/use-targets'
import { formatRoleLabel } from '@/lib/utils'
import type { TargetProgress } from '@/types'

/** Each person the caller sets targets for, their targets this month, and Set / Change / Delete. */
export function TeamTargetsTable({ period, isAdmin = false }: { period: TargetPeriod; isAdmin?: boolean }) {
  const { data, isLoading } = useTeamTargets(periodRange(period))
  const remove = useDeleteTarget()
  const [settingFor, setSettingFor] = useState<{ userId: string; fullName: string } | null>(null)
  const [editing, setEditing] = useState<TargetProgress | null>(null)
  const [deleting, setDeleting] = useState<TargetProgress | null>(null)
  const [viewing, setViewing] = useState<string | null>(null)

  const now = currentPeriod()
  const isCurrent = now.year === period.year && now.month === period.month
  const defaultDate = isCurrent ? todayKey() : periodRange(period).from

  const members = data?.members ?? []
  const byUser = new Map<string, TargetProgress[]>()
  for (const t of data?.targets ?? []) byUser.set(t.userId, [...(byUser.get(t.userId) ?? []), t])

  return (
    <Card>
      <CardHeader
        title={isAdmin ? 'Set targets' : 'Team targets'}
        subtitle={
          isAdmin
            ? 'Every Manager and sales executive — set a day, week, month or custom-dates target'
            : 'Set targets for your team — a day, week, month or custom dates'
        }
      />
      <CardBody>
        {isLoading ? (
          <div className="flex justify-center py-6">
            <Spinner />
          </div>
        ) : members.length === 0 ? (
          <EmptyState icon={TargetIcon} title={isAdmin ? 'No Managers or executives yet' : 'No team members yet'} />
        ) : (
          <div className="flex flex-col divide-y divide-slate-100">
            {members.map((m) => {
              const targets = byUser.get(m.userId) ?? []
              return (
                <div key={m.userId} className="py-3">
                  <div className="flex items-center gap-3">
                    <Avatar firstName={m.fullName.split(' ')[0] ?? ''} lastName={m.fullName.split(' ')[1] ?? ''} size="sm" />
                    <p className="min-w-0 flex-1 truncate text-sm font-medium text-slate-800">
                      {m.fullName}
                      {isAdmin && <span className="ml-1.5 text-xs font-normal text-slate-400">{formatRoleLabel(m.role)}</span>}
                    </p>
                    <Button size="sm" variant="secondary" onClick={() => setSettingFor(m)}>
                      <Plus className="size-4" />
                      Set target
                    </Button>
                  </div>
                  {targets.length === 0 ? (
                    <p className="mt-1 pl-11 text-xs text-slate-400">No targets this month</p>
                  ) : (
                    <div className="divide-y divide-slate-50 pl-11">
                      {targets.map((t) => (
                        <TargetRow
                          key={t.id}
                          target={t}
                          actions={
                            <>
                              <Button size="sm" variant="ghost" onClick={() => setViewing(t.id)}>
                                Details
                              </Button>
                              <Button size="icon" variant="ghost" title="Change the target" onClick={() => setEditing(t)}>
                                <Pencil className="size-4" />
                              </Button>
                              <Button size="icon" variant="ghost" title="Delete the target" onClick={() => setDeleting(t)}>
                                <Trash2 className="size-4 text-rose-500" />
                              </Button>
                            </>
                          }
                        />
                      ))}
                    </div>
                  )}
                </div>
              )
            })}
          </div>
        )}
      </CardBody>

      <SetTargetModal
        open={!!settingFor || !!editing}
        onClose={() => {
          setSettingFor(null)
          setEditing(null)
        }}
        employee={editing ? { userId: editing.userId, fullName: editing.fullName } : settingFor}
        existing={editing}
        defaultDate={defaultDate}
      />
      <TargetDetailModal targetId={viewing} onClose={() => setViewing(null)} />
      <ConfirmDialog
        open={!!deleting}
        onClose={() => setDeleting(null)}
        onConfirm={() => deleting && remove.mutate(deleting.id, { onSuccess: () => setDeleting(null) })}
        title="Delete this target?"
        description={
          deleting
            ? `${deleting.fullName}'s ${TARGET_METRIC_LABELS[deleting.metric].toLowerCase()} target for ${deleting.periodLabel}, and any progress added to it, will be deleted.`
            : ''
        }
        confirmLabel="Delete"
        variant="danger"
        loading={remove.isPending}
      />
    </Card>
  )
}

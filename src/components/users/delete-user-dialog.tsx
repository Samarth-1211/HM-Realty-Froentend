import { useState, type ReactNode } from 'react'
import { AlertTriangle, CheckCircle2, Contact, UsersRound } from 'lucide-react'
import { Modal } from '@/components/ui/modal'
import { Button } from '@/components/ui/button'
import { Field, Input } from '@/components/ui/input'
import { Select, Textarea } from '@/components/ui/select'
import { Spinner } from '@/components/ui/spinner'
import { Avatar } from '@/components/ui/avatar'
import { Badge } from '@/components/ui/badge'
import { useDeleteUser, useDeletionImpact, type DeletionScope } from '@/hooks/queries/use-user-deletion'
import { useAuthStore } from '@/store/auth-store'
import { extractErrorMessage } from '@/lib/api-client'
import { formatRoleLabel } from '@/lib/utils'
import type { HandoverCandidate } from '@/types'

/**
 * Delete flow for any user. Before the account can go, whatever the org still
 * needs from it is handed over here: a manager's team moves to another
 * manager, and open leads + pending tasks move to a chosen person. Everything
 * historical (attendance, activity, closed leads) stays on the archived
 * account and never blocks the delete.
 */
export function DeleteUserDialog({
  scope,
  user,
  onClose,
}: {
  scope: DeletionScope
  user: { id: string; firstName: string; lastName: string }
  onClose: () => void
}) {
  const currentUserId = useAuthStore((s) => s.user?.id)
  const { data: impact, isLoading, isError, error } = useDeletionImpact(scope, user.id)
  const remove = useDeleteUser(scope)

  const [teamTo, setTeamTo] = useState('')
  const [workTo, setWorkTo] = useState('')
  const [reason, setReason] = useState('')
  const [typed, setTyped] = useState('')

  const hasTeam = !!impact && impact.directReports.length > 0
  const hasWork = !!impact && impact.openLeads + impact.openTasks > 0
  const teamBlocked = hasTeam && impact.managerCandidates.length === 0
  const workBlocked = hasWork && impact.workCandidates.length === 0

  const canDelete =
    !!impact &&
    !teamBlocked &&
    !workBlocked &&
    (!hasTeam || !!teamTo) &&
    (!hasWork || !!workTo) &&
    typed.trim().toLowerCase() === 'delete'

  const candidateLabel = (c: HandoverCandidate) =>
    `${c.firstName} ${c.lastName}${c.id === currentUserId ? ' (you)' : ''} · ${formatRoleLabel(c.role)}`

  const onConfirm = () =>
    remove.mutate(
      {
        id: user.id,
        payload: {
          reason: reason.trim() || undefined,
          reassignTeamToId: hasTeam ? teamTo : undefined,
          reassignWorkToId: hasWork ? workTo : undefined,
        },
      },
      { onSuccess: onClose },
    )

  return (
    <Modal open onClose={onClose} title={`Delete ${user.firstName} ${user.lastName}?`} size="md" level="elevated">
      {isLoading ? (
        <div className="flex justify-center py-10">
          <Spinner />
        </div>
      ) : isError || !impact ? (
        <div className="flex flex-col gap-4">
          <Notice tone="danger">{extractErrorMessage(error)}</Notice>
          <div className="flex justify-end">
            <Button variant="ghost" onClick={onClose}>
              Close
            </Button>
          </div>
        </div>
      ) : (
        <div className="flex flex-col gap-5">
          <p className="text-sm text-slate-500">
            They won't be able to sign in again. Their attendance, activity logs, closed leads and past tasks are kept on
            record{scope === 'org' ? ' under Deleted users' : ''}. Their email becomes free, so they can be added again
            later as a new user.
          </p>

          {hasTeam && (
            <section className="flex flex-col gap-3 rounded-xl border border-slate-200 p-4">
              <SectionTitle icon={UsersRound}>
                {impact.directReports.length} team member{impact.directReports.length === 1 ? '' : 's'} report to{' '}
                {user.firstName}
              </SectionTitle>
              <div className="flex flex-wrap gap-2">
                {impact.directReports.map((m) => (
                  <span
                    key={m.id}
                    className="flex items-center gap-2 rounded-full bg-slate-50 py-1 pl-1 pr-3 text-xs text-slate-700"
                  >
                    <Avatar firstName={m.firstName} lastName={m.lastName} size="sm" />
                    {m.firstName} {m.lastName}
                    <span className="text-slate-400">· {formatRoleLabel(m.role)}</span>
                    {!m.isActive && <Badge variant="neutral">Inactive</Badge>}
                  </span>
                ))}
              </div>
              {teamBlocked ? (
                <Notice tone="danger">
                  There's no other active manager to take this team. Create or reactivate a manager first, then come
                  back to delete {user.firstName}.
                </Notice>
              ) : (
                <Field label="Move the team to" required>
                  <Select value={teamTo} onChange={(e) => setTeamTo(e.target.value)}>
                    <option value="">Choose a manager…</option>
                    {impact.managerCandidates.map((c) => (
                      <option key={c.id} value={c.id}>
                        {candidateLabel(c)}
                      </option>
                    ))}
                  </Select>
                </Field>
              )}
            </section>
          )}

          {hasWork && (
            <section className="flex flex-col gap-3 rounded-xl border border-slate-200 p-4">
              <SectionTitle icon={Contact}>
                {plural(impact.openLeads, 'open lead')} and {plural(impact.openTasks, 'pending task')}
              </SectionTitle>
              <p className="-mt-1 text-xs text-slate-400">
                Converted and lost leads stay with {user.firstName}'s record. Only work still in progress is handed over.
              </p>
              {workBlocked ? (
                <Notice tone="danger">
                  There's nobody active who can take this work over. Add or reactivate a team member first.
                </Notice>
              ) : (
                <Field label="Hand leads and tasks over to" required>
                  <Select value={workTo} onChange={(e) => setWorkTo(e.target.value)}>
                    <option value="">Choose who takes over…</option>
                    {impact.workCandidates.map((c) => (
                      <option key={c.id} value={c.id}>
                        {candidateLabel(c)}
                      </option>
                    ))}
                  </Select>
                </Field>
              )}
            </section>
          )}

          {!hasTeam && !hasWork && (
            <Notice tone="success">Nothing to hand over. {user.firstName} can be deleted straight away.</Notice>
          )}

          <Field label="Reason (optional)">
            <Textarea
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              placeholder="Add a short note…"
              maxLength={255}
            />
          </Field>
          <Field label='Type "delete" to confirm'>
            <Input value={typed} onChange={(e) => setTyped(e.target.value)} placeholder="delete" autoComplete="off" />
          </Field>

          <div className="flex justify-end gap-2 pt-1">
            <Button variant="ghost" onClick={onClose} disabled={remove.isPending}>
              Cancel
            </Button>
            <Button variant="danger" loading={remove.isPending} disabled={!canDelete} onClick={onConfirm}>
              Delete user
            </Button>
          </div>
        </div>
      )}
    </Modal>
  )
}

const plural = (n: number, word: string) => `${n} ${word}${n === 1 ? '' : 's'}`

function SectionTitle({ icon: Icon, children }: { icon: typeof Contact; children: ReactNode }) {
  return (
    <p className="flex items-center gap-2 text-sm font-semibold text-slate-800">
      <Icon className="size-4 text-brand-600" />
      {children}
    </p>
  )
}

function Notice({ tone, children }: { tone: 'danger' | 'success'; children: ReactNode }) {
  const Icon = tone === 'danger' ? AlertTriangle : CheckCircle2
  return (
    <div
      className={
        tone === 'danger'
          ? 'flex items-start gap-2 rounded-xl bg-rose-50 px-3 py-2.5 text-sm text-rose-700'
          : 'flex items-start gap-2 rounded-xl bg-emerald-50 px-3 py-2.5 text-sm text-emerald-700'
      }
    >
      <Icon className="mt-0.5 size-4 shrink-0" />
      <span>{children}</span>
    </div>
  )
}

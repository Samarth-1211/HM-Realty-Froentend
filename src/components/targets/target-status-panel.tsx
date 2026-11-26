import { useState } from 'react'
import { AlertTriangle, CheckCircle2, Target as TargetIcon } from 'lucide-react'
import { Card, CardBody, CardHeader } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { EmptyState } from '@/components/ui/empty-state'
import { Spinner } from '@/components/ui/spinner'
import { Tabs } from '@/components/ui/tabs'
import { useTeamTargets } from '@/hooks/queries/use-targets'
import { TargetRow } from './target-row'
import { TargetDetailModal } from './target-detail-modal'
import { WarnTargetModal } from './warn-target-modal'
import { formatPeriod, periodRange, TARGET_STATUS_LABELS, type TargetPeriod } from './target-utils'
import type { TargetProgress, TargetStatus } from '@/types'

const TABS: TargetStatus[] = ['NOT_COMPLETED', 'IN_PROGRESS', 'COMPLETED', 'UPCOMING']

const EMPTY: Record<TargetStatus, string> = {
  NOT_COMPLETED: 'Nobody has missed a target this month.',
  IN_PROGRESS: 'No targets are running right now.',
  COMPLETED: 'No targets have been completed yet this month.',
  UPCOMING: 'No targets are waiting to start.',
}

/**
 * Who completed their targets and who didn't, for a month — with "Send
 * warning" for the ones that aren't done.
 */
export function TargetStatusPanel({ period }: { period: TargetPeriod }) {
  const { data, isLoading } = useTeamTargets(periodRange(period))
  const [tab, setTab] = useState<TargetStatus>('NOT_COMPLETED')
  const [warning, setWarning] = useState<TargetProgress | null>(null)
  const [viewing, setViewing] = useState<string | null>(null)

  const targets = data?.targets ?? []
  const byStatus = (s: TargetStatus) => targets.filter((t) => t.status === s)
  // Falling-behind ones first, then by who's furthest off.
  const rows = byStatus(tab).sort((a, b) => Number(b.behind) - Number(a.behind) || a.percent - b.percent)
  const behindCount = targets.filter((t) => t.behind).length

  return (
    <Card>
      <CardHeader
        title="Target status"
        subtitle={`${formatPeriod(period)} — who has completed their targets and who hasn't`}
      />
      <CardBody className="flex flex-col gap-4">
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          <Stat label="Not completed" value={byStatus('NOT_COMPLETED').length} tone="text-rose-600" />
          <Stat label="Falling behind" value={behindCount} tone="text-amber-600" />
          <Stat label="In progress" value={byStatus('IN_PROGRESS').length} tone="text-brand-700" />
          <Stat label="Completed" value={byStatus('COMPLETED').length} tone="text-emerald-600" />
        </div>

        <Tabs
          tabs={TABS.map((s) => ({ value: s, label: TARGET_STATUS_LABELS[s], count: byStatus(s).length }))}
          active={tab}
          onChange={(v) => setTab(v as TargetStatus)}
        />

        {isLoading ? (
          <div className="flex justify-center py-6">
            <Spinner />
          </div>
        ) : rows.length === 0 ? (
          <EmptyState icon={tab === 'COMPLETED' ? CheckCircle2 : TargetIcon} title={EMPTY[tab]} />
        ) : (
          <div className="flex flex-col divide-y divide-slate-100">
            {rows.map((t) => (
              <TargetRow
                key={t.id}
                target={t}
                showPerson
                actions={
                  <>
                    <Button size="sm" variant="ghost" onClick={() => setViewing(t.id)}>
                      Details
                    </Button>
                    {t.status !== 'COMPLETED' && t.status !== 'UPCOMING' && (
                      <Button size="sm" variant="secondary" onClick={() => setWarning(t)}>
                        <AlertTriangle className="size-4 text-amber-600" />
                        Send warning
                      </Button>
                    )}
                  </>
                }
              />
            ))}
          </div>
        )}
      </CardBody>
      <WarnTargetModal target={warning} onClose={() => setWarning(null)} />
      <TargetDetailModal targetId={viewing} onClose={() => setViewing(null)} />
    </Card>
  )
}

function Stat({ label, value, tone }: { label: string; value: number; tone: string }) {
  return (
    <div className="rounded-lg border border-slate-200 px-3 py-2">
      <p className="text-xs text-slate-500">{label}</p>
      <p className={`text-xl font-bold tabular-nums ${tone}`}>{value}</p>
    </div>
  )
}

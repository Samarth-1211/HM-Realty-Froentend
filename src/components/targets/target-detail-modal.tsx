import { Link } from '@tanstack/react-router'
import { Modal } from '@/components/ui/modal'
import { Spinner } from '@/components/ui/spinner'
import { useTargetDetail } from '@/hooks/queries/use-targets'
import { formatLeadNumber } from '@/lib/utils'
import { TargetRow } from './target-row'
import { formatDayKey, formatTargetValue, TARGET_AMOUNT_METRICS, TARGET_METRIC_HINTS, TARGET_REPORT_KEYS } from './target-utils'
import type { TargetLead } from '@/types'

function LeadChips({ leads }: { leads: TargetLead[] }) {
  return (
    <div className="flex flex-wrap gap-1">
      {leads.map((l) => (
        <Link
          key={l.id}
          to="/leads/$leadId"
          params={{ leadId: l.id }}
          className="rounded-md bg-slate-100 px-2 py-0.5 text-[11px] text-slate-700 hover:bg-brand-50 hover:text-brand-700"
        >
          {formatLeadNumber(l.leadNumber)} · {l.fullName}
        </Link>
      ))}
    </div>
  )
}

/** One target in full: the day-by-day count and the leads behind it. */
export function TargetDetailModal({ targetId, onClose }: { targetId: string | null; onClose: () => void }) {
  const { data: target, isLoading } = useTargetDetail(targetId)

  const usesReport = target ? TARGET_REPORT_KEYS[target.metric].length > 0 : false
  const recordedLabel = target && TARGET_AMOUNT_METRICS.includes(target.metric) ? 'Added' : 'Recorded in CRM'
  const countedDays = target?.days.filter((d) => d.fromReport > 0 || d.recorded > 0) ?? []

  return (
    <Modal open={!!targetId} onClose={onClose} title={target ? `${target.fullName}'s target` : 'Target'} size="lg">
      {isLoading || !target ? (
        <div className="flex justify-center py-10">
          <Spinner />
        </div>
      ) : (
        <div className="flex flex-col gap-5">
          <div>
            <TargetRow target={target} />
            <p className="text-xs text-slate-400">{TARGET_METRIC_HINTS[target.metric]}</p>
          </div>

          <section>
            <h3 className="mb-1.5 text-xs font-semibold uppercase tracking-wide text-slate-400">Day by day</h3>
            {countedDays.length === 0 ? (
              <p className="text-sm text-slate-400">Nothing counted yet.</p>
            ) : (
              <div className="overflow-hidden rounded-lg border border-slate-200">
                <table className="w-full text-sm">
                  <thead className="bg-slate-50 text-xs text-slate-500">
                    <tr>
                      <th className="px-3 py-2 text-left font-medium">Day</th>
                      {usesReport && <th className="px-3 py-2 text-right font-medium">Check-out report</th>}
                      <th className="px-3 py-2 text-right font-medium">{recordedLabel}</th>
                      <th className="px-3 py-2 text-right font-medium">Counted</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {countedDays.map((d) => (
                      <tr key={d.date}>
                        <td className="px-3 py-1.5 text-slate-700">{formatDayKey(d.date)}</td>
                        {usesReport && (
                          <td className="px-3 py-1.5 text-right tabular-nums text-slate-600">
                            {formatTargetValue(target.metric, d.fromReport)}
                          </td>
                        )}
                        <td className="px-3 py-1.5 text-right tabular-nums text-slate-600">
                          {formatTargetValue(target.metric, d.recorded)}
                        </td>
                        <td className="px-3 py-1.5 text-right font-semibold tabular-nums text-slate-900">
                          {formatTargetValue(target.metric, d.counted)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </section>

          <section>
            <h3 className="mb-1.5 text-xs font-semibold uppercase tracking-wide text-slate-400">Progress added</h3>
            {target.entries.length === 0 ? (
              <p className="text-sm text-slate-400">No progress added with “Add progress” yet.</p>
            ) : (
              <ul className="flex flex-col divide-y divide-slate-100 rounded-lg border border-slate-200">
                {target.entries.map((e) => (
                  <li key={e.id} className="flex flex-col gap-1.5 px-3 py-2">
                    <div className="flex items-center justify-between gap-2 text-xs text-slate-500">
                      <span>{formatDayKey(e.date)}</span>
                      {e.amount !== null && (
                        <span className="font-semibold text-slate-900">+{formatTargetValue(target.metric, e.amount)}</span>
                      )}
                    </div>
                    <LeadChips leads={e.leads} />
                    {e.note && <p className="whitespace-pre-line text-sm text-slate-700">{e.note}</p>}
                  </li>
                ))}
              </ul>
            )}
          </section>

          {usesReport && (
            <section>
              <h3 className="mb-1.5 text-xs font-semibold uppercase tracking-wide text-slate-400">
                Leads picked at check-out
              </h3>
              {target.reportLeads.length === 0 ? (
                <p className="text-sm text-slate-400">No leads picked at check-out on these days.</p>
              ) : (
                <ul className="flex flex-col gap-2">
                  {target.reportLeads.map((r) => (
                    <li key={r.date} className="flex flex-col gap-1">
                      <span className="text-xs text-slate-500">{formatDayKey(r.date)}</span>
                      <LeadChips leads={r.leads} />
                    </li>
                  ))}
                </ul>
              )}
            </section>
          )}
        </div>
      )}
    </Modal>
  )
}

import { Link } from '@tanstack/react-router'
import { RotateCw } from 'lucide-react'
import { Card, CardBody, CardHeader } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Spinner } from '@/components/ui/spinner'
import { usePipelineTrace } from '@/hooks/queries/use-whatsapp-debug'
import { extractErrorMessage } from '@/lib/api-client'
import { cn, formatDateTime } from '@/lib/utils'
import { StatusIcon } from './status-icon'

export function PipelineTracePanel() {
  const { data, isLoading, error, refetch, isFetching } = usePipelineTrace()
  const stoppedAt = data?.stages.find((s) => s.status === 'fail')

  return (
    <Card>
      <CardHeader
        title="Pipeline trace"
        subtitle={
          data?.receivedAt
            ? `Most recent inbound message, received ${formatDateTime(data.receivedAt)}`
            : 'Follows the most recent inbound message through every stage.'
        }
        action={
          <Button variant="ghost" size="sm" onClick={() => refetch()} loading={isFetching}>
            <RotateCw className="size-3.5" />
            Refresh
          </Button>
        }
      />
      <CardBody>
        {error ? (
          <p className="rounded-xl bg-rose-50 px-3 py-2 text-sm text-rose-700">{extractErrorMessage(error)}</p>
        ) : isLoading || !data ? (
          <Spinner />
        ) : (
          <>
            <ol className="flex flex-col">
              {data.stages.map((stage, i) => (
                <li key={stage.key} className="relative flex gap-3 pb-4 last:pb-0">
                  {i < data.stages.length - 1 && (
                    <span
                      className={cn(
                        'absolute left-[7px] top-5 h-[calc(100%-1rem)] w-0.5',
                        stage.status === 'pass' ? 'bg-emerald-200' : 'bg-slate-100',
                      )}
                    />
                  )}
                  <StatusIcon status={stage.status} className="mt-0.5" />
                  <div className="min-w-0">
                    <p className={cn('text-sm font-medium', stage.status === 'skipped' ? 'text-slate-400' : 'text-slate-800')}>
                      {stage.label}
                    </p>
                    {stage.detail && <p className="break-words text-xs text-slate-500">{stage.detail}</p>}
                  </div>
                </li>
              ))}
            </ol>
            <p className={cn('mt-4 text-xs font-medium', stoppedAt ? 'text-rose-600' : 'text-emerald-600')}>
              {stoppedAt ? `Stopped at: ${stoppedAt.label}` : 'Every stage passed.'}
              {data.leadId && (
                <>
                  {' '}
                  <Link to="/leads/$leadId" params={{ leadId: data.leadId }} className="text-brand-600 hover:underline">
                    Open the lead
                  </Link>
                </>
              )}
            </p>
          </>
        )}
      </CardBody>
    </Card>
  )
}

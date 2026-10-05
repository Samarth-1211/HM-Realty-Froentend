import { useState, type ReactNode } from 'react'
import { ChevronDown, Link2, PlugZap, Stethoscope } from 'lucide-react'
import { Card, CardBody, CardHeader } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { CopyButton } from '@/components/ui/copy-button'
import { useSubscribeWhatsAppApp, useWhatsAppHealth } from '@/hooks/queries/use-whatsapp-debug'
import { extractErrorMessage } from '@/lib/api-client'
import { cn, formatDateTime } from '@/lib/utils'
import type { WhatsAppHealthCheck } from '@/api/whatsapp-debug.api'
import { JsonView } from './json-view'
import { StatusIcon } from './status-icon'

interface ConfigVar {
  name: string
  scope: string
  required: boolean
  present: boolean
}

function CheckDetails({ check }: { check: WhatsAppHealthCheck }) {
  if (check.id === 'config') {
    const vars = (check.details?.vars ?? []) as ConfigVar[]
    return (
      <div className="grid grid-cols-1 gap-1.5 sm:grid-cols-2">
        {vars.map((v) => (
          <div key={v.name} className="flex items-center justify-between gap-2 rounded-lg bg-slate-50 px-3 py-1.5 text-xs">
            <span className="font-mono text-slate-600">
              {v.name}
              <span className="ml-1.5 font-sans text-slate-400">{v.scope === 'env' ? 'env' : 'saved'}</span>
            </span>
            <span className={cn('font-medium', v.present ? 'text-emerald-600' : v.required ? 'text-rose-600' : 'text-slate-400')}>
              {v.present ? 'present' : v.required ? 'missing' : 'not set'}
            </span>
          </div>
        ))}
      </div>
    )
  }
  if (check.id === 'callback' && typeof check.details?.callbackUrl === 'string') {
    return (
      <div className="flex flex-col gap-2">
        <div className="flex items-center gap-2 rounded-xl bg-slate-900 px-3 py-2.5">
          <Link2 className="size-3.5 shrink-0 text-slate-400" />
          <code className="flex-1 overflow-x-auto whitespace-nowrap font-mono text-xs text-emerald-300">{check.details.callbackUrl}</code>
          <CopyButton value={check.details.callbackUrl} className="bg-white/10 text-white hover:bg-white/20" />
        </div>
        <p className="text-xs text-slate-500">
          Paste this into Meta App Dashboard → WhatsApp → Configuration → Callback URL. The verify token is on the
          Integrations page (WhatsApp card → Reveal verify token). Self-probe: {String(check.details.reachability)}
        </p>
      </div>
    )
  }
  return check.details ? <JsonView value={check.details} mask /> : null
}

function CheckRow({ check, action }: { check: WhatsAppHealthCheck; action?: ReactNode }) {
  const [open, setOpen] = useState(check.status !== 'pass' && (check.id === 'config' || check.id === 'callback'))
  const hasDetails = !!check.details
  return (
    <li className="border-b border-slate-50 py-3 last:border-0">
      <div className="flex items-start gap-3">
        <StatusIcon status={check.status} className="mt-0.5" />
        <div className="min-w-0 flex-1">
          <p className="text-sm font-medium text-slate-800">{check.label}</p>
          <p className="mt-0.5 text-xs text-slate-500">{check.reason}</p>
        </div>
        <div className="flex shrink-0 items-center gap-2">
          {action}
          {hasDetails && (
            <button
              type="button"
              onClick={() => setOpen((v) => !v)}
              className="rounded-lg p-1 text-slate-400 hover:bg-slate-100"
              aria-label={open ? 'Hide details' : 'Show details'}
            >
              <ChevronDown className={cn('size-4 transition-transform', open && 'rotate-180')} />
            </button>
          )}
        </div>
      </div>
      {open && hasDetails && (
        <div className="mt-3 pl-7">
          <CheckDetails check={check} />
        </div>
      )}
    </li>
  )
}

export function HealthPanel() {
  const { data, error, isFetching, refetch } = useWhatsAppHealth()
  const subscribe = useSubscribeWhatsAppApp()

  const subscribeButton = (
    <Button
      variant="secondary"
      size="sm"
      loading={subscribe.isPending}
      onClick={() => subscribe.mutate(undefined, { onSuccess: () => refetch() })}
    >
      <PlugZap className="size-3.5" />
      Subscribe app to WABA
    </Button>
  )

  const failing = data?.checks.filter((c) => c.status === 'fail').length ?? 0

  return (
    <Card>
      <CardHeader
        title="Health check"
        subtitle={
          data
            ? `Checked ${formatDateTime(data.checkedAt)} · Graph API ${data.graphApiVersion} · ${failing ? `${failing} failing` : 'nothing failing'}`
            : 'Live checks against Meta and this server. Secrets are never shown.'
        }
        action={
          <Button size="sm" onClick={() => refetch()} loading={isFetching}>
            <Stethoscope className="size-3.5" />
            Run checks
          </Button>
        }
      />
      <CardBody>
        {error ? (
          <p className="rounded-xl bg-rose-50 px-3 py-2 text-sm text-rose-700">{extractErrorMessage(error)}</p>
        ) : !data ? (
          <p className="text-sm text-slate-400">Click "Run checks" to test the configuration, token, phone number, webhook subscription and callback URL.</p>
        ) : (
          <ul>
            {data.checks.map((check) => (
              <CheckRow key={check.id} check={check} action={check.id === 'subscription' && check.status !== 'pass' ? subscribeButton : undefined} />
            ))}
          </ul>
        )}
      </CardBody>
    </Card>
  )
}

import { useState } from 'react'
import { Link } from '@tanstack/react-router'
import { FlaskConical } from 'lucide-react'
import { Card, CardBody, CardHeader } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Field, Input } from '@/components/ui/input'
import { useSimulateInbound } from '@/hooks/queries/use-whatsapp-debug'
import { extractErrorMessage } from '@/lib/api-client'
import { waDebug } from '@/lib/wa-debug-logger'
import { JsonView } from './json-view'
import { StatusIcon } from './status-icon'

export function SimulatePanel({ enabled }: { enabled: boolean | undefined }) {
  const [from, setFrom] = useState('+919000000001')
  const [name, setName] = useState('Simulated Customer')
  const [text, setText] = useState('Hi, is the 2BHK still available?')
  const simulate = useSimulateInbound()

  const run = () =>
    simulate.mutate(
      { from, name, text },
      {
        onSuccess: (data) =>
          waDebug.info('simulated inbound webhook sent', { status: data.response.status, saved: !!data.savedMessageId }),
      },
    )

  return (
    <Card>
      <CardHeader
        title="Simulate inbound webhook"
        subtitle="Posts a realistic, signed Meta payload to this server's own webhook — tests webhook → DB → inbox without a phone."
      />
      <CardBody className="flex flex-col gap-3">
        {enabled === false && (
          <p className="rounded-xl bg-amber-50 px-3 py-2 text-xs text-amber-700">
            Disabled on this server (production). Set WHATSAPP_DEBUG_SIMULATE_ENABLED=true on a staging server to use it.
          </p>
        )}
        <p className="text-xs text-slate-500">
          This goes through the real pipeline, so it creates (or reuses) a real lead for the sender number in this organization.
        </p>
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          <Field label="From (E.164)">
            <Input value={from} onChange={(e) => setFrom(e.target.value)} inputMode="tel" />
          </Field>
          <Field label="Profile name">
            <Input value={name} onChange={(e) => setName(e.target.value)} />
          </Field>
          <Field label="Message text" className="sm:col-span-2">
            <Input value={text} onChange={(e) => setText(e.target.value)} />
          </Field>
        </div>
        <div className="flex justify-end">
          <Button size="sm" variant="secondary" onClick={run} loading={simulate.isPending} disabled={enabled === false}>
            <FlaskConical className="size-3.5" />
            Send simulated message
          </Button>
        </div>

        {simulate.error && <p className="rounded-xl bg-rose-50 px-3 py-2 text-sm text-rose-700">{extractErrorMessage(simulate.error)}</p>}
        {simulate.data && (
          <div className="flex flex-col gap-3">
            <ul className="flex flex-col gap-1.5 text-sm">
              <li className="flex items-center gap-2">
                <StatusIcon status={simulate.data.response.status === 200 ? 'pass' : 'fail'} />
                Webhook answered HTTP {simulate.data.response.status}
                {simulate.data.request.signed ? ' (signed)' : ' (unsigned — no App Secret configured)'}
              </li>
              <li className="flex items-center gap-2">
                <StatusIcon status={simulate.data.savedMessageId ? 'pass' : 'fail'} />
                {simulate.data.savedMessageId ? 'Saved to messages' : 'Not saved — check the event log for the error'}
              </li>
              {simulate.data.leadId && (
                <li className="flex items-center gap-2">
                  <StatusIcon status="pass" />
                  On lead{' '}
                  <Link to="/leads/$leadId" params={{ leadId: simulate.data.leadId }} className="font-medium text-brand-600 hover:underline">
                    {simulate.data.leadName}
                  </Link>
                  ·
                  <Link to="/messaging" className="font-medium text-brand-600 hover:underline">
                    open inbox
                  </Link>
                </li>
              )}
            </ul>
            <JsonView value={simulate.data.request.payload} mask />
          </div>
        )}
      </CardBody>
    </Card>
  )
}

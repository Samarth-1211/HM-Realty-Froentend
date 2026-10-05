import { useState } from 'react'
import { Send } from 'lucide-react'
import { Card, CardBody, CardHeader } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Field, Input } from '@/components/ui/input'
import { Select, Textarea } from '@/components/ui/select'
import { useSendTestMessage } from '@/hooks/queries/use-whatsapp-debug'
import { extractErrorMessage } from '@/lib/api-client'
import { JsonView } from './json-view'

const E164 = /^\+?[1-9][0-9]{7,14}$/

export function SendTestPanel() {
  const [to, setTo] = useState('')
  const [type, setType] = useState<'hello_world' | 'text'>('hello_world')
  const [text, setText] = useState('')
  const send = useSendTestMessage()

  const validTo = E164.test(to.replace(/[\s-]/g, ''))
  const canSend = validTo && (type === 'hello_world' || !!text.trim())

  return (
    <Card>
      <CardHeader
        title="Send test message"
        subtitle="Sends straight through the Graph API with this organization's number and shows Meta's full response."
      />
      <CardBody className="flex flex-col gap-3">
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          <Field label="Recipient (E.164)" error={to && !validTo ? 'Use the full number with country code, e.g. +919812345678' : undefined}>
            <Input value={to} onChange={(e) => setTo(e.target.value)} placeholder="+919812345678" inputMode="tel" />
          </Field>
          <Field label="Message type">
            <Select value={type} onChange={(e) => setType(e.target.value as 'hello_world' | 'text')}>
              <option value="hello_world">hello_world template</option>
              <option value="text">Free text (24-hour window only)</option>
            </Select>
          </Field>
        </div>
        {type === 'text' && (
          <Field label="Text" hint="Only allowed if this number messaged you in the last 24 hours.">
            <Textarea value={text} onChange={(e) => setText(e.target.value)} rows={3} placeholder="Hello from the CRM" />
          </Field>
        )}
        <div className="flex justify-end">
          <Button
            size="sm"
            disabled={!canSend}
            loading={send.isPending}
            onClick={() => send.mutate({ to: to.replace(/[\s-]/g, ''), type, text: type === 'text' ? text.trim() : undefined })}
          >
            <Send className="size-3.5" />
            Send
          </Button>
        </div>

        {send.error && <p className="rounded-xl bg-rose-50 px-3 py-2 text-sm text-rose-700">{extractErrorMessage(send.error)}</p>}
        {send.data && (
          <div className="flex flex-col gap-3">
            <div>
              <p className="mb-1.5 text-xs font-semibold uppercase tracking-wide text-slate-400">Request (token hidden)</p>
              <JsonView value={send.data.request} />
            </div>
            <div>
              <p className="mb-1.5 text-xs font-semibold uppercase tracking-wide text-slate-400">
                Graph response —{' '}
                <span className={send.data.response.ok ? 'text-emerald-600' : 'text-rose-600'}>HTTP {send.data.response.status}</span>
              </p>
              <JsonView value={send.data.response.body} />
            </div>
          </div>
        )}
      </CardBody>
    </Card>
  )
}

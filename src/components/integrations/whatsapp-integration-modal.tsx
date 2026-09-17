import { useEffect, useState } from 'react'
import { zodResolver } from '@hookform/resolvers/zod'
import { useForm } from 'react-hook-form'
import { z } from 'zod'
import { AlertTriangle, CheckCircle2, Eye, KeyRound, Link2, PauseCircle, PlayCircle, ShieldAlert, Save } from 'lucide-react'
import { Modal } from '@/components/ui/modal'
import { Field, Input, Label } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { CopyButton } from '@/components/ui/copy-button'
import { WhatsAppMark } from './whatsapp-mark'
import { formatDateTime } from '@/lib/utils'
import {
  useConnectWhatsAppIntegration,
  useDisableWhatsAppIntegration,
  useEnableWhatsAppIntegration,
  useRevealWhatsAppVerifyToken,
  useUpdateWhatsAppIntegration,
} from '@/hooks/queries/use-whatsapp-integration'
import { WhatsAppIntegrationStatus, type WhatsAppIntegration } from '@/types'

const phoneRegex = /^\+?[0-9]{7,15}$/

const connectSchema = z.object({
  wabaId: z.string().min(1, 'Required'),
  phoneNumberId: z.string().min(1, 'Required'),
  accessToken: z.string().min(1, 'Required'),
  displayPhoneNumber: z.string().regex(phoneRegex, 'Enter a valid phone number, e.g. +919812345678').optional().or(z.literal('')),
  businessManagerId: z.string().optional(),
  businessName: z.string().optional(),
})
type ConnectFormValues = z.infer<typeof connectSchema>

const manageSchema = z.object({
  accessToken: z.string().optional(),
  displayPhoneNumber: z.string().regex(phoneRegex, 'Enter a valid phone number').optional().or(z.literal('')),
  businessManagerId: z.string().optional(),
  businessName: z.string().optional(),
})
type ManageFormValues = z.infer<typeof manageSchema>

const STATUS_META: Record<WhatsAppIntegrationStatus, { label: string; variant: 'success' | 'warning' | 'danger' | 'neutral' }> = {
  PENDING: { label: 'Pending verification', variant: 'warning' },
  CONNECTED: { label: 'Connected', variant: 'success' },
  FAILED: { label: 'Failed', variant: 'danger' },
  DISABLED: { label: 'Disabled', variant: 'neutral' },
}

export function WhatsAppIntegrationModal({
  open,
  onClose,
  integration,
  canEdit,
}: {
  open: boolean
  onClose: () => void
  integration: WhatsAppIntegration | undefined
  canEdit: boolean
}) {
  const isManage = !!integration

  const connect = useConnectWhatsAppIntegration()
  const update = useUpdateWhatsAppIntegration()
  const reveal = useRevealWhatsAppVerifyToken()
  const disable = useDisableWhatsAppIntegration()
  const enable = useEnableWhatsAppIntegration()

  const [created, setCreated] = useState<WhatsAppIntegration | null>(null)
  const [editing, setEditing] = useState(false)
  const [revealedToken, setRevealedToken] = useState<string | undefined>()

  const connectForm = useForm<ConnectFormValues>({ resolver: zodResolver(connectSchema) })
  const manageForm = useForm<ManageFormValues>({ resolver: zodResolver(manageSchema) })

  useEffect(() => {
    if (!open) {
      setCreated(null)
      setEditing(false)
      setRevealedToken(undefined)
      connectForm.reset({ wabaId: '', phoneNumberId: '', accessToken: '', displayPhoneNumber: '', businessManagerId: '', businessName: '' })
      return
    }
    if (integration) {
      manageForm.reset({
        accessToken: '',
        displayPhoneNumber: integration.displayPhoneNumber ?? '',
        businessManagerId: integration.businessManagerId ?? '',
        businessName: integration.businessName ?? '',
      })
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, integration])

  const shown = integration ?? created

  const onConnect = (values: ConnectFormValues) => {
    connect.mutate(
      {
        wabaId: values.wabaId,
        phoneNumberId: values.phoneNumberId,
        accessToken: values.accessToken,
        displayPhoneNumber: values.displayPhoneNumber || undefined,
        businessManagerId: values.businessManagerId || undefined,
        businessName: values.businessName || undefined,
      },
      { onSuccess: (data) => setCreated(data) },
    )
  }

  const onSaveEdit = (values: ManageFormValues) => {
    update.mutate(
      {
        accessToken: values.accessToken || undefined,
        displayPhoneNumber: values.displayPhoneNumber || undefined,
        businessManagerId: values.businessManagerId || undefined,
        businessName: values.businessName || undefined,
      },
      { onSuccess: () => setEditing(false) },
    )
  }

  const toggleActive = () => {
    if (!integration) return
    if (integration.isActive) disable.mutate()
    else enable.mutate()
  }

  const title = isManage ? 'WhatsApp Business' : 'Connect WhatsApp Business'
  const subtitle = isManage
    ? undefined
    : 'Leads that message your WhatsApp number land here automatically, with a full chat thread and two-way replies.'

  return (
    <Modal open={open} onClose={onClose} title={title} subtitle={subtitle} size="lg">
      <div className="flex flex-col gap-5">
        {isManage && integration && (
          <div className="flex items-start justify-between gap-3">
            <div className="flex items-center gap-3">
              <WhatsAppMark />
              <div>
                <p className="font-semibold text-slate-800">{integration.businessName || 'WhatsApp Business'}</p>
                <p className="text-xs text-slate-400">{integration.displayPhoneNumber || integration.phoneNumberId}</p>
              </div>
            </div>
            <div className="flex flex-col items-end gap-1.5">
              <Badge variant={STATUS_META[integration.status].variant}>{STATUS_META[integration.status].label}</Badge>
              {!integration.isActive && <span className="text-xs text-slate-400">Disabled</span>}
            </div>
          </div>
        )}

        {isManage && integration?.status === 'PENDING' && (
          <div className="flex items-start gap-2 rounded-xl bg-amber-50 p-3 text-xs text-amber-700">
            <AlertTriangle className="mt-0.5 size-4 shrink-0" />
            <p>
              Waiting for Meta's webhook verification. Paste the webhook URL and verify token below into{' '}
              <span className="font-medium">Meta App Dashboard → WhatsApp → Configuration → Webhooks</span>, then
              subscribe to the <span className="font-medium">messages</span> field. This card flips to "Connected"
              automatically once that handshake succeeds.
            </p>
          </div>
        )}

        {isManage && integration?.status === 'FAILED' && integration.lastError && (
          <div className="flex items-start gap-2 rounded-xl bg-rose-50 p-3 text-xs text-rose-700">
            <AlertTriangle className="mt-0.5 size-4 shrink-0" />
            <p>{integration.lastError}</p>
          </div>
        )}

        {/* Connect form */}
        {!isManage && !created && (
          <form onSubmit={connectForm.handleSubmit(onConnect)} className="flex flex-col gap-3 rounded-xl border border-slate-100 bg-slate-50/60 p-4">
            <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">Meta WhatsApp Business credentials</p>
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              <Field label="WhatsApp Business Account ID (WABA)" required error={connectForm.formState.errors.wabaId?.message} className="sm:col-span-2">
                <Input {...connectForm.register('wabaId')} placeholder="102938475610293" />
              </Field>
              <Field label="Phone Number ID" required error={connectForm.formState.errors.phoneNumberId?.message}>
                <Input {...connectForm.register('phoneNumberId')} placeholder="109876543210987" />
              </Field>
              <Field label="Registered phone number" error={connectForm.formState.errors.displayPhoneNumber?.message} hint="Display only — recognizing which number is connected">
                <Input {...connectForm.register('displayPhoneNumber')} placeholder="+919812345678" />
              </Field>
              <Field label="Permanent access token (System User)" required error={connectForm.formState.errors.accessToken?.message} className="sm:col-span-2">
                <Input type="password" {...connectForm.register('accessToken')} placeholder="EAAxxxxxxxxxxxxxxxxxxxxxxxxxx" />
              </Field>
              <Field label="Business Manager ID" hint="Optional — helps with support/debugging">
                <Input {...connectForm.register('businessManagerId')} placeholder="Optional" />
              </Field>
              <Field label="Display / business name" hint="Optional — shown in this UI">
                <Input {...connectForm.register('businessName')} placeholder="Optional" />
              </Field>
            </div>
            <div className="flex justify-end">
              <Button type="submit" size="sm" loading={connect.isPending}>
                Validate & connect
              </Button>
            </div>
          </form>
        )}

        {/* Manage form */}
        {isManage && editing && (
          <form onSubmit={manageForm.handleSubmit(onSaveEdit)} className="flex flex-col gap-3 rounded-xl border border-slate-100 bg-slate-50/60 p-4">
            <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">Update details</p>
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              <Field label="Registered phone number" error={manageForm.formState.errors.displayPhoneNumber?.message}>
                <Input {...manageForm.register('displayPhoneNumber')} placeholder="+919812345678" />
              </Field>
              <Field label="Business Manager ID">
                <Input {...manageForm.register('businessManagerId')} placeholder="Optional" />
              </Field>
              <Field label="Display / business name" className="sm:col-span-2">
                <Input {...manageForm.register('businessName')} placeholder="Optional" />
              </Field>
              <Field
                label="Replace access token"
                hint="Only fill this in if the token was rotated in Meta Business Manager — it's re-validated live before saving."
                className="sm:col-span-2"
              >
                <Input type="password" {...manageForm.register('accessToken')} placeholder="Leave blank to keep the current token" />
              </Field>
            </div>
            <div className="flex justify-end gap-2">
              <Button type="button" variant="ghost" size="sm" onClick={() => setEditing(false)}>
                Cancel
              </Button>
              <Button type="submit" size="sm" loading={update.isPending}>
                <Save className="size-3.5" />
                Save changes
              </Button>
            </div>
          </form>
        )}

        {isManage && integration && !editing && (
          <div className="grid grid-cols-2 gap-3 rounded-xl border border-slate-100 p-4 text-sm sm:grid-cols-4">
            <InfoStat label="Last message in" value={formatDateTime(integration.lastInboundAt)} />
            <InfoStat label="Last reply sent" value={formatDateTime(integration.lastOutboundAt)} />
            <InfoStat label="Business Manager ID" value={integration.businessManagerId || '—'} />
            <InfoStat label="Verified" value={integration.verifiedAt ? formatDateTime(integration.verifiedAt) : 'Not yet'} />
            {canEdit && (
              <div className="col-span-2 flex items-end sm:col-span-4">
                <Button variant="secondary" size="sm" onClick={() => setEditing(true)}>
                  Edit details / rotate token
                </Button>
              </div>
            )}
          </div>
        )}

        {/* Webhook credentials */}
        {shown && (
          <div className="rounded-xl border border-slate-100 p-4">
            {!isManage && created && (
              <p className="mb-4 flex items-center gap-1.5 text-sm font-medium text-emerald-600">
                <CheckCircle2 className="size-4" />
                Credentials verified — now paste these into Meta to finish setup.
              </p>
            )}
            {isManage && canEdit && !revealedToken && (
              <Button
                variant="secondary"
                size="sm"
                className="mb-4"
                loading={reveal.isPending}
                onClick={() => reveal.mutate(undefined, { onSuccess: (data) => setRevealedToken(data.verifyToken) })}
              >
                <Eye className="size-3.5" />
                Reveal verify token
              </Button>
            )}

            <div className="flex flex-col gap-4">
              <div>
                <div className="mb-1.5 flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wide text-slate-400">
                  <Link2 className="size-3.5" />
                  Webhook callback URL
                </div>
                <div className="flex items-center gap-2 rounded-xl bg-slate-900 px-3 py-2.5">
                  <code className="flex-1 overflow-x-auto whitespace-nowrap font-mono text-xs text-emerald-300">{shown.webhookUrl}</code>
                  <CopyButton value={shown.webhookUrl} className="bg-white/10 text-white hover:bg-white/20" />
                </div>
              </div>

              <div>
                <div className="mb-1.5 flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wide text-slate-400">
                  <KeyRound className="size-3.5" />
                  Verify token
                </div>
                {shown.verifyToken || revealedToken ? (
                  <div className="flex items-center gap-2 rounded-xl bg-slate-900 px-3 py-2.5">
                    <code className="flex-1 overflow-x-auto whitespace-nowrap font-mono text-xs text-amber-300">
                      {shown.verifyToken || revealedToken}
                    </code>
                    <CopyButton value={(shown.verifyToken || revealedToken)!} className="bg-white/10 text-white hover:bg-white/20" />
                  </div>
                ) : (
                  <div className="rounded-xl border border-dashed border-slate-200 bg-slate-50 px-3 py-2.5 text-xs text-slate-400">
                    Hidden — use "Reveal verify token" above.
                  </div>
                )}
                <p className="mt-1.5 flex items-center gap-1 text-xs text-amber-600">
                  <ShieldAlert className="size-3.5 shrink-0" />
                  Paste both values into Meta App Dashboard → WhatsApp → Configuration → Webhooks, then subscribe to
                  the "messages" field.
                </p>
              </div>
            </div>
          </div>
        )}

        <div className="flex items-center justify-between">
          {isManage && integration && canEdit ? (
            <Button
              variant={integration.isActive ? 'outline' : 'secondary'}
              size="sm"
              loading={disable.isPending || enable.isPending}
              onClick={toggleActive}
            >
              {integration.isActive ? (
                <>
                  <PauseCircle className="size-3.5" />
                  Disable
                </>
              ) : (
                <>
                  <PlayCircle className="size-3.5" />
                  Re-enable
                </>
              )}
            </Button>
          ) : (
            <span />
          )}
          <Button variant="ghost" size="sm" onClick={onClose}>
            {!isManage && created ? 'Done' : 'Close'}
          </Button>
        </div>
      </div>
    </Modal>
  )
}

function InfoStat({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <Label className="mb-0.5 text-xs text-slate-400">{label}</Label>
      <p className="text-sm font-medium text-slate-700">{value}</p>
    </div>
  )
}

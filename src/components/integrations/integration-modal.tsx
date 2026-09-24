import { useEffect, useState } from 'react'
import { zodResolver } from '@hookform/resolvers/zod'
import { useForm } from 'react-hook-form'
import { z } from 'zod'
import { CheckCircle2, Eye, PauseCircle, PlayCircle, Save, Send } from 'lucide-react'
import { Modal } from '@/components/ui/modal'
import { ConfirmDialog } from '@/components/ui/confirm-dialog'
import { Field, Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { PlatformIcon } from './platform-icon'
import { WebhookSnippet, buildSamplePayload } from './webhook-snippet'
import { getPlatformMeta } from '@/lib/platform-catalog'
import { formatDateTime } from '@/lib/utils'
import {
  useCreatePlatformIntegration,
  useDeactivatePlatformIntegration,
  useRevealWebhookSecret,
  useUpdatePlatformIntegration,
} from '@/hooks/queries/use-platform-integrations'
import type { LeadSource, PlatformIntegration } from '@/types'

const rmSchema = z.object({
  rmName: z.string().optional(),
  rmEmail: z.string().email('Enter a valid email').optional().or(z.literal('')),
  rmPhone: z
    .string()
    .regex(/^\+?[0-9]{7,15}$/, 'Enter a valid phone number')
    .optional()
    .or(z.literal('')),
})
type RmFormValues = z.infer<typeof rmSchema>

/** wa.me wants digits only, with country code. Bare 10-digit numbers are assumed Indian. */
function toWhatsAppNumber(phone: string | null | undefined): string {
  const digits = (phone ?? '').replace(/\D/g, '')
  return digits.length === 10 ? `91${digits}` : digits
}

function buildShareMessage(opts: {
  platformLabel: string
  monogram: string
  rmName: string | null
  webhookUrl: string
  secret?: string
}) {
  const payload = JSON.stringify(buildSamplePayload(opts.platformLabel, opts.monogram), null, 2)
  return [
    `Hi${opts.rmName ? ` ${opts.rmName}` : ''},`,
    '',
    `Please push our ${opts.platformLabel} leads to the webhook below.`,
    '',
    `*Webhook URL (POST, JSON):*`,
    opts.webhookUrl,
    '',
    ...(opts.secret ? [`*Webhook secret* (send as the "x-webhook-secret" header):`, opts.secret, ''] : []),
    `*Sample payload* (only fullName and phone are required):`,
    '```',
    payload,
    '```',
  ].join('\n')
}

type Props =
  | { open: boolean; onClose: () => void; mode: 'connect'; platform: LeadSource; canEdit: boolean }
  | { open: boolean; onClose: () => void; mode: 'manage'; integration: PlatformIntegration; canEdit: boolean }

export function IntegrationModal(props: Props) {
  const { open, onClose, canEdit } = props
  const meta = getPlatformMeta(props.mode === 'connect' ? props.platform : props.integration.platform)

  const create = useCreatePlatformIntegration()
  const update = useUpdatePlatformIntegration()
  const deactivate = useDeactivatePlatformIntegration()
  const reveal = useRevealWebhookSecret()

  const [created, setCreated] = useState<PlatformIntegration | null>(null)
  const [editing, setEditing] = useState(false)
  const [revealedSecret, setRevealedSecret] = useState<string | undefined>()
  const [confirmToggle, setConfirmToggle] = useState(false)

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<RmFormValues>({ resolver: zodResolver(rmSchema) })

  useEffect(() => {
    if (!open) {
      setCreated(null)
      setEditing(false)
      setRevealedSecret(undefined)
      setConfirmToggle(false)
      return
    }
    if (props.mode === 'manage') {
      reset({
        rmName: props.integration.rmName ?? '',
        rmEmail: props.integration.rmEmail ?? '',
        rmPhone: props.integration.rmPhone ?? '',
      })
    } else {
      reset({ rmName: '', rmEmail: '', rmPhone: '' })
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, props.mode])

  const integration = props.mode === 'manage' ? props.integration : created

  const shareOnWhatsApp = async () => {
    if (!integration) return
    // Open the tab synchronously so popup blockers allow it, then point it at
    // wa.me once we have the secret (manage mode may need to fetch it first).
    const win = window.open('', '_blank')
    let secret = integration.webhookSecret ?? revealedSecret
    if (!secret) {
      try {
        secret = (await reveal.mutateAsync(integration.id)).webhookSecret
        setRevealedSecret(secret)
      } catch {
        win?.close()
        return
      }
    }
    const text = buildShareMessage({
      platformLabel: meta.label,
      monogram: meta.monogram,
      rmName: integration.rmName,
      webhookUrl: integration.webhookUrl,
      secret,
    })
    const url = `https://wa.me/${toWhatsAppNumber(integration.rmPhone)}?text=${encodeURIComponent(text)}`
    if (win) win.location.href = url
    else window.location.href = url
  }

  const onConnect = (values: RmFormValues) => {
    if (props.mode !== 'connect') return
    create.mutate(
      {
        platform: props.platform,
        rmName: values.rmName || undefined,
        rmEmail: values.rmEmail || undefined,
        rmPhone: values.rmPhone || undefined,
      },
      { onSuccess: (data) => setCreated(data) },
    )
  }

  const onSaveEdit = (values: RmFormValues) => {
    if (props.mode !== 'manage') return
    update.mutate(
      {
        id: props.integration.id,
        payload: {
          rmName: values.rmName || undefined,
          rmEmail: values.rmEmail || undefined,
          rmPhone: values.rmPhone || undefined,
        },
      },
      { onSuccess: () => setEditing(false) },
    )
  }

  const toggleActive = () => {
    if (props.mode !== 'manage') return
    if (props.integration.isActive) {
      deactivate.mutate(props.integration.id, { onSuccess: () => setConfirmToggle(false) })
    } else {
      update.mutate(
        { id: props.integration.id, payload: { isActive: true } },
        { onSuccess: () => setConfirmToggle(false) },
      )
    }
  }

  const title = props.mode === 'connect' ? `Connect ${meta.label}` : meta.label
  const subtitle =
    props.mode === 'connect'
      ? 'Add the relationship manager contact for this platform, then share the webhook URL with them.'
      : undefined

  return (
    <Modal open={open} onClose={onClose} title={title} subtitle={subtitle} size="lg">
      <div className="flex flex-col gap-5">
        {props.mode === 'manage' && (
          <div className="flex items-start justify-between gap-3">
            <div className="flex items-center gap-3">
              <PlatformIcon platform={meta} />
              <div>
                <p className="font-semibold text-slate-800">{meta.label}</p>
                <p className="text-xs text-slate-400">{meta.category}</p>
              </div>
            </div>
            <div className="flex flex-col items-end gap-1.5">
              <Badge variant={props.integration.isActive ? 'success' : 'neutral'}>
                {props.integration.isActive ? 'Active' : 'Deactivated'}
              </Badge>
              {props.integration.lastReceivedAt && (
                <p className="text-xs text-slate-400">
                  Last lead {formatDateTime(props.integration.lastReceivedAt)}
                </p>
              )}
            </div>
          </div>
        )}

        {/* RM details */}
        {(props.mode === 'connect' && !created) || editing ? (
          <form
            onSubmit={handleSubmit(props.mode === 'connect' ? onConnect : onSaveEdit)}
            className="flex flex-col gap-3 rounded-xl border border-slate-100 bg-slate-50/60 p-4"
          >
            <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">
              Relationship manager (optional)
            </p>
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              <Field label="RM name" error={errors.rmName?.message} className="sm:col-span-2">
                <Input {...register('rmName')} placeholder="Rohit Verma" />
              </Field>
              <Field label="RM email" error={errors.rmEmail?.message}>
                <Input {...register('rmEmail')} placeholder="rohit.verma@99acres.com" />
              </Field>
              <Field label="RM phone" error={errors.rmPhone?.message}>
                <Input {...register('rmPhone')} placeholder="+919876543210" />
              </Field>
            </div>
            <div className="flex justify-end gap-2">
              {props.mode === 'manage' && (
                <Button type="button" variant="ghost" size="sm" onClick={() => setEditing(false)}>
                  Cancel
                </Button>
              )}
              <Button type="submit" size="sm" loading={create.isPending || update.isPending}>
                {props.mode === 'connect' ? (
                  'Connect & generate webhook'
                ) : (
                  <>
                    <Save className="size-3.5" />
                    Save changes
                  </>
                )}
              </Button>
            </div>
          </form>
        ) : props.mode === 'manage' ? (
          <div className="flex items-center justify-between rounded-xl border border-slate-100 p-4">
            <div className="text-sm">
              <p className="font-medium text-slate-700">{props.integration.rmName || 'No RM name on file'}</p>
              <p className="text-slate-400">
                {props.integration.rmEmail || '—'} {props.integration.rmPhone ? `· ${props.integration.rmPhone}` : ''}
              </p>
            </div>
            {canEdit && (
              <Button variant="secondary" size="sm" onClick={() => setEditing(true)}>
                Edit
              </Button>
            )}
          </div>
        ) : created ? (
          <div className="rounded-xl border border-slate-100 p-4 text-sm">
            <p className="font-medium text-slate-700">{created.rmName || 'No RM name on file'}</p>
            <p className="text-slate-400">
              {created.rmEmail || '—'} {created.rmPhone ? `· ${created.rmPhone}` : ''}
            </p>
          </div>
        ) : null}

        {/* Webhook credentials */}
        {integration && (
          <div className="rounded-xl border border-slate-100 p-4">
            {props.mode === 'manage' && canEdit && !revealedSecret && (
              <Button
                variant="secondary"
                size="sm"
                className="mb-4"
                loading={reveal.isPending}
                onClick={() =>
                  reveal.mutate(props.integration.id, {
                    onSuccess: (data) => setRevealedSecret(data.webhookSecret),
                  })
                }
              >
                <Eye className="size-3.5" />
                Reveal webhook secret
              </Button>
            )}
            {props.mode === 'connect' && (
              <p className="mb-4 flex items-center gap-1.5 text-sm font-medium text-emerald-600">
                <CheckCircle2 className="size-4" />
                Connected — save this secret now, it won't be shown again on this screen.
              </p>
            )}
            <WebhookSnippet
              webhookUrl={integration.webhookUrl}
              secret={integration.webhookSecret ?? revealedSecret}
              platformLabel={meta.label}
              monogram={meta.monogram}
            />
            {canEdit && (
              <div className="mt-4 flex flex-col gap-1.5 border-t border-slate-100 pt-4 sm:flex-row sm:items-center sm:justify-between">
                <p className="text-xs text-slate-400">
                  {integration.rmPhone
                    ? `Send the URL, secret and sample payload to ${integration.rmName || 'the RM'} (${integration.rmPhone}).`
                    : 'No RM phone on file — WhatsApp will ask you to pick a contact.'}
                </p>
                <Button
                  size="sm"
                  className="shrink-0 bg-[#25D366] text-white hover:bg-[#1ebe5a]"
                  loading={reveal.isPending}
                  onClick={shareOnWhatsApp}
                >
                  <Send className="size-3.5" />
                  Share credentials on WhatsApp
                </Button>
              </div>
            )}
          </div>
        )}

        <div className="flex items-center justify-between">
          {props.mode === 'manage' && canEdit ? (
            <Button
              variant={props.integration.isActive ? 'outline' : 'secondary'}
              size="sm"
              onClick={() => setConfirmToggle(true)}
            >
              {props.integration.isActive ? (
                <>
                  <PauseCircle className="size-3.5" />
                  Deactivate
                </>
              ) : (
                <>
                  <PlayCircle className="size-3.5" />
                  Reactivate
                </>
              )}
            </Button>
          ) : (
            <span />
          )}
          <Button variant="ghost" size="sm" onClick={onClose}>
            {props.mode === 'connect' && created ? 'Done' : 'Close'}
          </Button>
        </div>
      </div>

      {props.mode === 'manage' && canEdit && confirmToggle && (
        <ConfirmDialog
          open
          onClose={() => setConfirmToggle(false)}
          title={props.integration.isActive ? `Deactivate ${meta.label}?` : `Reactivate ${meta.label}?`}
          description={
            props.integration.isActive
              ? `New leads sent from ${meta.label} will be rejected until you reactivate this integration. Existing leads are not affected, and the webhook URL and secret stay the same.`
              : `${meta.label} will start accepting leads again on the existing webhook URL and secret.`
          }
          confirmLabel={props.integration.isActive ? 'Deactivate' : 'Reactivate'}
          variant={props.integration.isActive ? 'danger' : 'primary'}
          loading={deactivate.isPending || update.isPending}
          onConfirm={toggleActive}
        />
      )}
    </Modal>
  )
}

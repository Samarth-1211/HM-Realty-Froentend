import { useEffect, useState } from 'react'
import { AlertTriangle, ArrowLeft, CheckCircle2, FileText, ImageIcon, Info, Send } from 'lucide-react'
import { toast } from 'sonner'
import { Modal } from '@/components/ui/modal'
import { Button } from '@/components/ui/button'
import { Field, Input } from '@/components/ui/input'
import { Select } from '@/components/ui/select'
import { Toggle } from '@/components/ui/toggle'
import { Spinner } from '@/components/ui/spinner'
import { useCreateBroadcast, useFollowUpTemplates, usePreviewBroadcast } from '@/hooks/queries/use-follow-ups'
import { useAuthStore } from '@/store/auth-store'
import { extractErrorMessage } from '@/lib/api-client'
import { cn } from '@/lib/utils'
import type {
  Broadcast,
  BroadcastPreview,
  CreateBroadcastPayload,
  FollowUpLead,
  FollowUpSelection,
  FollowUpTemplate,
  ParameterSetting,
  ParameterSource,
} from '@/api/follow-ups.api'
import type { Project } from '@/types'

export const SOURCE_OPTIONS: { value: ParameterSource; label: string }[] = [
  { value: 'LEAD_FIRST_NAME', label: 'Lead’s first name' },
  { value: 'LEAD_NAME', label: 'Lead’s full name' },
  { value: 'PROJECT_NAME', label: 'Project name' },
  { value: 'PROJECT_LOCATION', label: 'Project location' },
  { value: 'ASSIGNEE_NAME', label: 'Assigned person’s name' },
  { value: 'SENDER_NAME', label: 'My name' },
  { value: 'ORGANIZATION_NAME', label: 'Company name' },
  { value: 'CUSTOM', label: 'Type the text…' },
]

export const DEFAULT_FALLBACKS: Partial<Record<ParameterSource, string>> = {
  LEAD_FIRST_NAME: 'Sir/Madam',
  LEAD_NAME: 'Sir/Madam',
  PROJECT_NAME: 'our project',
  PROJECT_LOCATION: 'our site',
  ASSIGNEE_NAME: 'our team',
}

const FOLLOW_UP_DAY_OPTIONS = [1, 2, 3, 5, 7, 10, 14, 30]

const templateKey = (t: Pick<FollowUpTemplate, 'name' | 'language'>) => `${t.name}|${t.language}`

/** Variable keys in sending order: "header:1", "body:1"… */
function variableKeys(t: FollowUpTemplate): string[] {
  return [...(t.header?.variables ?? []).map((v) => `header:${v}`), ...t.bodyVariables.map((v) => `body:${v}`)]
}

/** A sensible first guess for each variable, from its name or position. */
function guessSetting(key: string): ParameterSetting {
  const name = key.split(':')[1].toLowerCase()
  const pick = (source: ParameterSource): ParameterSetting => ({ source, text: DEFAULT_FALLBACKS[source] ?? '' })
  if (/project|property|site/.test(name)) return pick('PROJECT_NAME')
  if (/location|address|area/.test(name)) return pick('PROJECT_LOCATION')
  if (/agent|executive|manager|advisor|rm\b/.test(name)) return pick('ASSIGNEE_NAME')
  if (/company|org|business|brand/.test(name)) return pick('ORGANIZATION_NAME')
  if (/full_?name/.test(name)) return pick('LEAD_NAME')
  if (/name|customer|client/.test(name)) return pick('LEAD_FIRST_NAME')
  if (name === '1') return pick('LEAD_FIRST_NAME')
  if (name === '2') return pick('PROJECT_NAME')
  return { source: 'CUSTOM', text: '' }
}

export function SendFollowUpModal({
  open,
  onClose,
  selection,
  selectedCount,
  sampleLead,
  projects,
  onSent,
}: {
  open: boolean
  onClose: () => void
  selection: FollowUpSelection
  selectedCount: number
  /** One of the chosen leads, to show a realistic preview while composing. */
  sampleLead: FollowUpLead | undefined
  projects: Project[]
  onSent: (broadcast: Broadcast) => void
}) {
  const currentUser = useAuthStore((s) => s.user)
  const templatesQuery = useFollowUpTemplates(open)
  const previewMutation = usePreviewBroadcast()
  const createMutation = useCreateBroadcast()

  const [attachBrochure, setAttachBrochure] = useState(true)
  const [projectId, setProjectId] = useState('')
  const [selectedKey, setSelectedKey] = useState('')
  const [params, setParams] = useState<Record<string, ParameterSetting>>({})
  const [nextFollowUpInDays, setNextFollowUpInDays] = useState<number | null>(3)
  const [preview, setPreview] = useState<BroadcastPreview | null>(null)

  useEffect(() => {
    if (!open) return
    setAttachBrochure(true)
    setProjectId('')
    setSelectedKey('')
    setParams({})
    setNextFollowUpInDays(3)
    setPreview(null)
  }, [open])

  const templates = templatesQuery.data ?? []
  // PDF brochures are the usual case, so document templates come before picture ones.
  const eligible = templates
    .filter((t) => t.supported && (attachBrochure ? !!t.brochureSlot : !t.brochureSlot))
    .sort((a, b) => Number(b.brochureSlot === 'DOCUMENT') - Number(a.brochureSlot === 'DOCUMENT'))
  const otherKind = templates.filter((t) => t.supported && (attachBrochure ? !t.brochureSlot : !!t.brochureSlot))
  const unsupported = templates.filter((t) => !t.supported)
  const template = eligible.find((t) => templateKey(t) === selectedKey) ?? null

  // Keep a valid template picked when the brochure switch changes the list.
  useEffect(() => {
    if (!open || templatesQuery.isLoading) return
    if (!template && eligible.length) chooseTemplate(eligible[0])
    if (!eligible.length && selectedKey) setSelectedKey('')
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, attachBrochure, templatesQuery.data])

  const chooseTemplate = (t: FollowUpTemplate) => {
    setSelectedKey(templateKey(t))
    // Templates made in the CRM remember how their blanks are filled; others get a best guess.
    setParams(Object.fromEntries(variableKeys(t).map((k) => [k, t.crmDefaults?.[k] ?? guessSetting(k)])))
    setPreview(null)
  }

  const fixedProject = projects.find((p) => p.id === projectId) ?? null
  const missingCustom = template ? variableKeys(template).filter((k) => params[k]?.source === 'CUSTOM' && !params[k]?.text?.trim()) : []

  const payload: CreateBroadcastPayload | null = template
    ? {
        selection,
        templateName: template.name,
        templateLanguage: template.language,
        parameters: params,
        attachBrochure,
        projectId: projectId || null,
        nextFollowUpInDays,
      }
    : null

  const review = () => {
    if (!payload) return
    previewMutation.mutate(payload, {
      onSuccess: setPreview,
      onError: (err) => toast.error(extractErrorMessage(err)),
    })
  }

  const send = () => {
    if (!payload) return
    createMutation.mutate(payload, {
      onSuccess: (broadcast) => {
        toast.success(`Follow-up is going out to ${preview?.willSend ?? ''} lead${preview?.willSend === 1 ? '' : 's'}`, {
          description: 'Track delivery, reads and replies under History.',
        })
        onSent(broadcast)
      },
      onError: (err) => toast.error(extractErrorMessage(err)),
    })
  }

  // What a variable shows in the live preview: the sample lead's value, or a label.
  const sampleValue = (key: string): string => {
    const s = params[key]
    if (!s) return `{{${key.split(':')[1]}}}`
    const project = fixedProject ?? (sampleLead?.project ? { name: sampleLead.project.name, location: null } : null)
    const fromLead: Record<ParameterSource, string | null | undefined> = {
      LEAD_FIRST_NAME: sampleLead?.fullName.trim().split(/\s+/)[0],
      LEAD_NAME: sampleLead?.fullName,
      PROJECT_NAME: project?.name,
      PROJECT_LOCATION: project?.location,
      ASSIGNEE_NAME: sampleLead?.assignedTo ? `${sampleLead.assignedTo.firstName} ${sampleLead.assignedTo.lastName}` : null,
      SENDER_NAME: currentUser ? `${currentUser.firstName} ${currentUser.lastName}` : null,
      ORGANIZATION_NAME: null,
      CUSTOM: null,
    }
    const label = SOURCE_OPTIONS.find((o) => o.value === s.source)?.label ?? ''
    return fromLead[s.source]?.trim() || s.text?.trim() || `[${label}]`
  }

  return (
    <Modal
      open={open}
      onClose={onClose}
      size="xl"
      title={preview ? 'Check and send' : 'Send WhatsApp follow-up'}
      subtitle={`${selectedCount.toLocaleString('en-IN')} lead${selectedCount === 1 ? '' : 's'} chosen`}
    >
      {templatesQuery.isLoading ? (
        <div className="flex min-h-[200px] items-center justify-center">
          <Spinner className="size-7" />
        </div>
      ) : templatesQuery.isError ? (
        <Notice tone="danger" title="WhatsApp templates couldn’t be loaded">
          {extractErrorMessage(templatesQuery.error)}
        </Notice>
      ) : preview ? (
        <ReviewStep
          preview={preview}
          template={template!}
          attachBrochure={attachBrochure}
          nextFollowUpInDays={nextFollowUpInDays}
          onBack={() => setPreview(null)}
          onSend={send}
          sending={createMutation.isPending}
        />
      ) : (
        <div className="grid gap-6 lg:grid-cols-[1fr_320px]">
          <div className="flex flex-col gap-5">
            <div className="rounded-xl bg-slate-50 p-3.5">
              <Toggle checked={attachBrochure} onChange={setAttachBrochure} label="Attach the project brochure" />
              <p className="mt-1.5 pl-[3.4rem] text-xs text-slate-500">
                The brochure goes at the top of the message. WhatsApp only allows this with a template made with a
                document (PDF) or picture header.
              </p>
            </div>

            <Field
              label="Project"
              hint={
                attachBrochure
                  ? 'Its name and brochure are used in the message.'
                  : 'Its name is used where the message mentions the project.'
              }
            >
              <Select value={projectId} onChange={(e) => setProjectId(e.target.value)}>
                <option value="">Each lead’s own project</option>
                {projects.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.name}
                    {attachBrochure && !p.brochureToken ? ' — no brochure' : ''}
                  </option>
                ))}
              </Select>
            </Field>

            <Field label="Message template" required>
              {eligible.length ? (
                <Select
                  value={selectedKey}
                  onChange={(e) => {
                    const t = eligible.find((x) => templateKey(x) === e.target.value)
                    if (t) chooseTemplate(t)
                  }}
                >
                  {eligible.map((t) => (
                    <option key={templateKey(t)} value={templateKey(t)}>
                      {t.name.replace(/_/g, ' ')} ({t.language}){t.category ? ` · ${t.category.toLowerCase()}` : ''}
                      {t.brochureSlot === 'IMAGE' ? ' · picture' : t.brochureSlot === 'DOCUMENT' ? ' · PDF' : ''}
                    </option>
                  ))}
                </Select>
              ) : (
                <NoTemplateHelp attachBrochure={attachBrochure} otherKindCount={otherKind.length} />
              )}
              {unsupported.length > 0 && (
                <p className="mt-1.5 text-xs text-slate-400">
                  {unsupported.length} other approved template{unsupported.length === 1 ? '' : 's'} can’t be used here (
                  {unsupported
                    .slice(0, 3)
                    .map((t) => `${t.name}: ${t.unsupportedReason}`)
                    .join('; ')}
                  {unsupported.length > 3 ? '; …' : ''}).
                </p>
              )}
            </Field>

            {template && variableKeys(template).length > 0 && (
              <div className="flex flex-col gap-3">
                <p className="text-sm font-medium text-slate-700">Fill in the blanks</p>
                {variableKeys(template).map((key) => {
                  const s = params[key] ?? { source: 'CUSTOM' as const }
                  const custom = s.source === 'CUSTOM'
                  return (
                    <div key={key} className="grid gap-2 sm:grid-cols-[130px_1fr_1fr] sm:items-center">
                      <code
                        className="w-fit max-w-full truncate rounded-md bg-emerald-50 px-2 py-1 text-xs font-semibold text-emerald-700"
                        title={key.split(':')[1]}
                      >
                        {key.startsWith('header:') ? 'Title ' : ''}
                        {`{{${key.split(':')[1]}}}`}
                      </code>
                      <Select
                        value={s.source}
                        onChange={(e) => {
                          const source = e.target.value as ParameterSource
                          setParams((p) => ({ ...p, [key]: { source, text: DEFAULT_FALLBACKS[source] ?? (source === 'CUSTOM' ? '' : s.text) } }))
                        }}
                      >
                        {SOURCE_OPTIONS.map((o) => (
                          <option key={o.value} value={o.value}>
                            {o.label}
                          </option>
                        ))}
                      </Select>
                      <Input
                        value={s.text ?? ''}
                        maxLength={key.startsWith('header:') ? 60 : 300}
                        error={custom && !s.text?.trim()}
                        placeholder={custom ? 'Text to send' : 'If empty, use…'}
                        title={custom ? 'The text every lead gets here' : 'Used when the lead has no value for this'}
                        onChange={(e) => setParams((p) => ({ ...p, [key]: { ...s, text: e.target.value } }))}
                      />
                    </div>
                  )
                })}
                <p className="text-xs text-slate-400">
                  The right-hand box is used when a lead has no value (e.g. no name saved) — leave it empty to skip such
                  leads instead.
                </p>
              </div>
            )}

            <Field label="After sending" hint="Sent leads are also marked as contacted now, and new leads move to “Follow-up sent”.">
              <Select
                value={nextFollowUpInDays ?? ''}
                onChange={(e) => setNextFollowUpInDays(e.target.value ? Number(e.target.value) : null)}
              >
                <option value="">Don’t change the next follow-up date</option>
                {FOLLOW_UP_DAY_OPTIONS.map((d) => (
                  <option key={d} value={d}>
                    Set next follow-up {d} day{d === 1 ? '' : 's'} later
                  </option>
                ))}
              </Select>
            </Field>
          </div>

          <div className="flex flex-col gap-3">
            <p className="text-sm font-medium text-slate-700">Preview{sampleLead ? ` for ${sampleLead.fullName}` : ''}</p>
            {template ? (
              <WhatsAppBubble
                template={template}
                valueFor={sampleValue}
                brochureName={
                  attachBrochure
                    ? fixedProject?.brochureFileName ?? (sampleLead?.project ? `${sampleLead.project.name} brochure` : 'Project brochure')
                    : null
                }
              />
            ) : (
              <p className="rounded-xl bg-slate-50 p-4 text-sm text-slate-400">Choose a template to see the message.</p>
            )}
            <Button
              className="mt-2"
              onClick={review}
              loading={previewMutation.isPending}
              disabled={!template || missingCustom.length > 0}
            >
              Review recipients
            </Button>
            {missingCustom.length > 0 && <p className="text-xs text-rose-600">Type the text for every “Type the text…” blank.</p>}
          </div>
        </div>
      )}
    </Modal>
  )
}

function ReviewStep({
  preview,
  template,
  attachBrochure,
  nextFollowUpInDays,
  onBack,
  onSend,
  sending,
}: {
  preview: BroadcastPreview
  template: FollowUpTemplate
  attachBrochure: boolean
  nextFollowUpInDays: number | null
  onBack: () => void
  onSend: () => void
  sending: boolean
}) {
  const skippedTotal = preview.total - preview.willSend
  return (
    <div className="flex flex-col gap-5">
      <div className="grid gap-3 sm:grid-cols-3">
        <Stat label="Will receive it" value={preview.willSend} tone="success" />
        <Stat label="Left out" value={skippedTotal} tone={skippedTotal ? 'warning' : 'neutral'} />
        <Stat label="Chosen" value={preview.total} tone="neutral" />
      </div>

      {preview.skipped.length > 0 && (
        <div className="rounded-xl bg-amber-50/70 p-3.5 ring-1 ring-inset ring-amber-200">
          <p className="mb-2 flex items-center gap-1.5 text-sm font-semibold text-amber-800">
            <AlertTriangle className="size-4" /> Why some leads are left out
          </p>
          <ul className="flex flex-col gap-1 text-sm text-amber-900">
            {preview.skipped.map((s) => (
              <li key={s.reason} className="flex justify-between gap-3">
                <span>{s.reason}</span>
                <span className="font-semibold tabular-nums">{s.count}</span>
              </li>
            ))}
          </ul>
        </div>
      )}

      {preview.samples.length > 0 && (
        <div>
          <p className="mb-2 text-sm font-medium text-slate-700">How it will read</p>
          <div className="grid gap-3 md:grid-cols-3">
            {preview.samples.map((s) => (
              <div key={s.leadId} className="rounded-xl bg-[#efeae2] p-3">
                <p className="mb-1.5 text-xs font-medium text-slate-500">
                  To {s.leadName} · +{s.toPhone}
                </p>
                <div className="whitespace-pre-wrap rounded-lg rounded-tl-none bg-white p-2.5 text-[13px] leading-snug text-slate-800 shadow-sm">
                  {attachBrochure && (
                    <span className="mb-1.5 flex items-center gap-1.5 rounded-md bg-slate-100 px-2 py-1.5 text-xs text-slate-600">
                      {template.brochureSlot === 'IMAGE' ? <ImageIcon className="size-3.5" /> : <FileText className="size-3.5" />}
                      Brochure attached
                    </span>
                  )}
                  {s.text}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      <Notice tone="info" title="Before you send">
        WhatsApp sends approved templates even when a lead hasn’t messaged you recently.{' '}
        {template.category === 'MARKETING' && 'Meta charges a small fee for each marketing message delivered. '}
        Every lead’s chat will show this message
        {nextFollowUpInDays ? `, and their next follow-up moves to ${nextFollowUpInDays} day${nextFollowUpInDays === 1 ? '' : 's'} from now` : ''}
        . Leads who reply STOP are left out of future follow-ups automatically.
      </Notice>

      <div className="flex flex-wrap justify-between gap-2 border-t border-slate-100 pt-4">
        <Button variant="ghost" onClick={onBack} disabled={sending}>
          <ArrowLeft className="size-4" />
          Back
        </Button>
        <Button onClick={onSend} loading={sending} disabled={preview.willSend === 0}>
          <Send className="size-4" />
          Send to {preview.willSend.toLocaleString('en-IN')} lead{preview.willSend === 1 ? '' : 's'}
        </Button>
      </div>
    </div>
  )
}

/** The message as the lead's WhatsApp shows it: header, body, footer, buttons. */
export function WhatsAppBubble({
  template,
  valueFor,
  brochureName,
}: {
  template: FollowUpTemplate
  valueFor: (key: string) => string
  brochureName: string | null
}) {
  const fill = (text: string, part: 'header' | 'body') =>
    text.split(/(\{\{\s*[A-Za-z0-9_]+\s*\}\})/g).map((chunk, i) => {
      const m = /^\{\{\s*([A-Za-z0-9_]+)\s*\}\}$/.exec(chunk)
      return m ? (
        <span key={i} className="rounded bg-emerald-100/70 px-0.5 font-medium text-emerald-800">
          {valueFor(`${part}:${m[1]}`)}
        </span>
      ) : (
        <span key={i}>{chunk}</span>
      )
    })

  return (
    <div className="rounded-xl bg-[#efeae2] p-3">
      <div className="rounded-lg rounded-tl-none bg-white p-2.5 text-[13px] leading-snug text-slate-800 shadow-sm">
        {template.brochureSlot && (
          <div className="mb-2 flex items-center gap-2 rounded-md bg-slate-100 px-2.5 py-2 text-xs text-slate-600">
            {template.brochureSlot === 'IMAGE' ? <ImageIcon className="size-4" /> : <FileText className="size-4 text-rose-500" />}
            <span className="truncate">{brochureName ?? 'Brochure'}</span>
          </div>
        )}
        {template.header?.text && <p className="mb-1 font-semibold">{fill(template.header.text, 'header')}</p>}
        <p className="whitespace-pre-wrap">{fill(template.body, 'body')}</p>
        {template.footer && <p className="mt-1.5 text-[11px] text-slate-400">{template.footer}</p>}
      </div>
      {template.buttons.length > 0 && (
        <div className="mt-1 flex flex-col gap-1">
          {template.buttons.map((b, i) => (
            <div key={i} className="rounded-lg bg-white py-1.5 text-center text-[13px] font-medium text-sky-600 shadow-sm">
              {b.text}
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

function NoTemplateHelp({ attachBrochure, otherKindCount }: { attachBrochure: boolean; otherKindCount: number }) {
  return (
    <Notice tone="warning" title={attachBrochure ? 'No approved template can carry a brochure yet' : 'No approved text-only template yet'}>
      <p>
        An Admin can create one on the <strong>Templates</strong> tab of this page (or in WhatsApp Manager → Message templates
        {attachBrochure ? ', with the header set to “Document” for PDF brochures or “Image” for JPG/PNG ones' : ''}). For
        example: <em>“Hi {'{{1}}'}, sharing the details of {'{{2}}'} with you. Would you like to plan a site visit this week?”</em>{' '}
        WhatsApp usually approves it within minutes to a day, and it then shows up here.
      </p>
      {otherKindCount > 0 && (
        <p className="mt-1">
          {otherKindCount} template{otherKindCount === 1 ? '' : 's'}{' '}
          {attachBrochure ? 'without a brochure are available — turn off “Attach the project brochure” to use them.' : 'with a brochure are available — turn on “Attach the project brochure” to use them.'}
        </p>
      )}
    </Notice>
  )
}

function Notice({ tone, title, children }: { tone: 'info' | 'warning' | 'danger'; title: string; children: React.ReactNode }) {
  const styles = {
    info: 'bg-sky-50/70 ring-sky-200 text-sky-900',
    warning: 'bg-amber-50/70 ring-amber-200 text-amber-900',
    danger: 'bg-rose-50/70 ring-rose-200 text-rose-900',
  }[tone]
  const Icon = tone === 'info' ? Info : AlertTriangle
  return (
    <div className={cn('rounded-xl p-3.5 text-sm ring-1 ring-inset', styles)}>
      <p className="mb-1 flex items-center gap-1.5 font-semibold">
        <Icon className="size-4" /> {title}
      </p>
      <div className="text-[13px] leading-relaxed opacity-90">{children}</div>
    </div>
  )
}

function Stat({ label, value, tone }: { label: string; value: number; tone: 'success' | 'warning' | 'neutral' }) {
  const color = { success: 'text-emerald-700', warning: 'text-amber-700', neutral: 'text-slate-800' }[tone]
  return (
    <div className="rounded-xl bg-slate-50 p-3.5">
      <p className="text-xs font-medium text-slate-500">{label}</p>
      <p className={cn('mt-1 flex items-center gap-1.5 text-2xl font-bold tabular-nums', color)}>
        {tone === 'success' && <CheckCircle2 className="size-5" />}
        {value.toLocaleString('en-IN')}
      </p>
    </div>
  )
}

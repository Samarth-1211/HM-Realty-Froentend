import { useEffect, useMemo, useRef, useState } from 'react'
import { AlertTriangle, FileText, ImageIcon, Plus, Send, Trash2, Type, X } from 'lucide-react'
import { toast } from 'sonner'
import { Modal } from '@/components/ui/modal'
import { Button } from '@/components/ui/button'
import { Field, Input } from '@/components/ui/input'
import { Select, Textarea } from '@/components/ui/select'
import { useCreateTemplate, useResubmitTemplate } from '@/hooks/queries/use-follow-ups'
import { extractErrorMessage } from '@/lib/api-client'
import { cn } from '@/lib/utils'
import { DEFAULT_FALLBACKS, SOURCE_OPTIONS, WhatsAppBubble } from './send-follow-up-modal'
import type {
  FollowUpTemplate,
  ManagedTemplate,
  ParameterSource,
  TemplateButton,
  TemplateDraft,
  TemplateHeaderType,
  TemplateVariable,
} from '@/api/follow-ups.api'
import type { Project } from '@/types'

export const TEMPLATE_LANGUAGES: { code: string; label: string }[] = [
  { code: 'en', label: 'English' },
  { code: 'en_US', label: 'English (US)' },
  { code: 'en_GB', label: 'English (UK)' },
  { code: 'hi', label: 'Hindi' },
  { code: 'mr', label: 'Marathi' },
  { code: 'gu', label: 'Gujarati' },
  { code: 'pa', label: 'Punjabi' },
  { code: 'bn', label: 'Bengali' },
  { code: 'ta', label: 'Tamil' },
  { code: 'te', label: 'Telugu' },
  { code: 'kn', label: 'Kannada' },
  { code: 'ml', label: 'Malayalam' },
  { code: 'ur', label: 'Urdu' },
]

/** The quick "insert a blank" buttons: the variable name each one writes and how it's filled. */
const BLANKS: { name: string; source: ParameterSource; label: string; sample: string }[] = [
  { name: 'first_name', source: 'LEAD_FIRST_NAME', label: 'Lead’s first name', sample: 'Rahul' },
  { name: 'full_name', source: 'LEAD_NAME', label: 'Lead’s full name', sample: 'Rahul Sharma' },
  { name: 'project_name', source: 'PROJECT_NAME', label: 'Project name', sample: 'Green Acres' },
  { name: 'project_location', source: 'PROJECT_LOCATION', label: 'Project location', sample: 'Sector 21, Gurugram' },
  { name: 'agent_name', source: 'ASSIGNEE_NAME', label: 'Assigned person', sample: 'Priya' },
  { name: 'sender_name', source: 'SENDER_NAME', label: 'Sender’s name', sample: 'Asha' },
  { name: 'company_name', source: 'ORGANIZATION_NAME', label: 'Company name', sample: 'HM Realty' },
]

const SAMPLE_BY_SOURCE = Object.fromEntries(BLANKS.map((b) => [b.source, b.sample])) as Partial<Record<ParameterSource, string>>

const HEADER_OPTIONS: { value: TemplateHeaderType; label: string; icon: typeof FileText; hint: string }[] = [
  { value: 'DOCUMENT', label: 'Brochure (PDF)', icon: FileText, hint: 'Each lead gets their project’s PDF brochure on top' },
  { value: 'IMAGE', label: 'Brochure (picture)', icon: ImageIcon, hint: 'For JPG/PNG brochures, up to 5 MB' },
  { value: 'TEXT', label: 'Title', icon: Type, hint: 'A bold line of text on top' },
  { value: 'NONE', label: 'Nothing', icon: X, hint: 'Just the message' },
]

const VARIABLE = /\{\{\s*([A-Za-z0-9_]+)\s*\}\}/g
const variablesIn = (text: string) => [...new Set([...text.matchAll(VARIABLE)].map((m) => m[1]))]
const toTemplateName = (raw: string) =>
  raw
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '_')
    .replace(/^_+/, '')
    .slice(0, 512)

/** A blank's setting — as chosen, or the usual one for a known name like {{first_name}}. */
function settingFor(d: TemplateDraft, v: string): TemplateVariable {
  const known = BLANKS.find((b) => b.name === v)
  return (
    d.variables[v] ??
    (known
      ? { source: known.source, sample: known.sample, text: DEFAULT_FALLBACKS[known.source] ?? '' }
      : { source: 'CUSTOM', sample: '', text: '' })
  )
}

const EMPTY_DRAFT: TemplateDraft = {
  name: '',
  language: 'en',
  category: 'MARKETING',
  headerType: 'DOCUMENT',
  body: '',
  footer: 'Reply STOP to stop these messages',
  buttons: [],
  variables: {},
}

/** The same rules the server checks (template-draft.util.ts), shown while typing. */
function problemsIn(d: TemplateDraft): string[] {
  const p: string[] = []
  const body = d.body.trim()
  const vars = variablesIn(body)
  if (!d.name.replace(/_/g, '')) p.push('Give the template a name')
  if (!body) p.push('Write the message')
  for (const v of vars) if (!/^[a-z][a-z0-9_]*$/.test(v)) p.push(`{{${v}}}: blanks need a name in lowercase letters, e.g. {{first_name}}`)
  if (body && (/^\{\{/.test(body) || /\}\}[.!?]?$/.test(body))) p.push('The message can’t start or end with a blank')
  if (/\}\}\s*\{\{/.test(body)) p.push('Two blanks can’t sit right next to each other')
  if (vars.length && body.replace(/\{\{[^}]*\}\}/g, '').trim().split(/\s+/).length < vars.length * 2) {
    p.push('Too many blanks for such a short message — add more words')
  }
  for (const v of vars.filter((x) => /^[a-z][a-z0-9_]*$/.test(x))) {
    const s = settingFor(d, v)
    if (!s.sample?.trim()) p.push(`{{${v}}}: give an example value`)
    if (s.source === 'CUSTOM' && !s.text?.trim()) p.push(`{{${v}}}: type the text it should say`)
  }
  if (d.headerType === 'TEXT' && !d.headerText?.trim()) p.push('Write the title, or choose no header')
  if ((d.headerType === 'DOCUMENT' || d.headerType === 'IMAGE') && !d.sampleProjectId) p.push('Choose the sample brochure')
  for (const b of d.buttons) {
    if (!b.text.trim()) p.push('Every button needs a label')
    if (b.type === 'URL' && !/^https?:\/\/\S+\.\S+/.test(b.url ?? '')) p.push(`Button “${b.text || 'Website'}”: enter a full web address`)
    if (b.type === 'PHONE_NUMBER' && !/^\+\d{8,15}$/.test((b.phoneNumber ?? '').replace(/[\s-]/g, ''))) {
      p.push(`Button “${b.text || 'Call'}”: phone number with country code, e.g. +919812345678`)
    }
  }
  return p
}

function draftFrom(t: ManagedTemplate): TemplateDraft {
  const c = t.crm!
  return {
    name: t.name,
    language: t.language,
    category: (c.requestedCategory === 'UTILITY' ? 'UTILITY' : 'MARKETING'),
    headerType: c.headerType,
    headerText: c.headerText ?? undefined,
    sampleProjectId: c.sampleProjectId ?? undefined,
    body: c.body,
    footer: c.footer ?? '',
    buttons: c.buttons ?? [],
    variables: c.variables ?? {},
  }
}

export function TemplateEditorModal({
  open,
  onClose,
  editing,
  projects,
}: {
  open: boolean
  onClose: () => void
  /** A rejected/paused CRM template to fix and resubmit; null = a new template. */
  editing: ManagedTemplate | null
  projects: Project[]
}) {
  const create = useCreateTemplate()
  const resubmit = useResubmitTemplate()
  const [draft, setDraft] = useState<TemplateDraft>(EMPTY_DRAFT)
  const [showProblems, setShowProblems] = useState(false)
  const bodyRef = useRef<HTMLTextAreaElement>(null)

  useEffect(() => {
    if (!open) return
    setDraft(editing?.crm ? draftFrom(editing) : EMPTY_DRAFT)
    setShowProblems(false)
  }, [open, editing])

  const set = (changes: Partial<TemplateDraft>) => setDraft((d) => ({ ...d, ...changes }))
  const bodyVars = variablesIn(draft.body).filter((v) => /^[a-z][a-z0-9_]*$/.test(v))

  // Brochure samples must match the header kind; the first fitting project is the default.
  const sampleProjects = projects.filter((p) =>
    draft.headerType === 'DOCUMENT'
      ? p.brochureMimeType === 'application/pdf'
      : draft.headerType === 'IMAGE'
        ? ['image/jpeg', 'image/png'].includes(p.brochureMimeType ?? '') && (p.brochureSizeBytes ?? 0) <= 5 * 1024 * 1024
        : false,
  )
  const sampleProjectId = sampleProjects.some((p) => p.id === draft.sampleProjectId) ? draft.sampleProjectId : sampleProjects[0]?.id
  const effective: TemplateDraft = { ...draft, sampleProjectId }
  const problems = problemsIn(effective)

  /** Writes {{name}} at the cursor and remembers how that blank is filled. */
  const insertBlank = (name: string, source: ParameterSource, sample: string) => {
    const el = bodyRef.current
    const at = el ? el.selectionStart : draft.body.length
    const before = draft.body.slice(0, at)
    const after = draft.body.slice(el ? el.selectionEnd : at)
    const pad = before && !/\s$/.test(before) ? ' ' : ''
    const token = `${pad}{{${name}}}`
    set({
      body: before + token + after,
      variables: draft.variables[name] ? draft.variables : { ...draft.variables, [name]: { source, sample, text: DEFAULT_FALLBACKS[source] ?? '' } },
    })
    requestAnimationFrame(() => {
      el?.focus()
      el?.setSelectionRange(at + token.length, at + token.length)
    })
  }

  const addCustomBlank = () => {
    const raw = window.prompt('Name this blank (e.g. offer, visit_date):')
    const name = raw ? toTemplateName(raw).replace(/^(\d)/, 'x$1') : ''
    if (name) insertBlank(name, 'CUSTOM', '')
  }

  const setVariable = (name: string, changes: Partial<TemplateVariable>) =>
    set({ variables: { ...draft.variables, [name]: { ...settingFor(draft, name), ...changes } } })

  const setButton = (i: number, changes: Partial<TemplateButton>) =>
    set({ buttons: draft.buttons.map((b, j) => (j === i ? { ...b, ...changes } : b)) })

  const preview: FollowUpTemplate = useMemo(
    () => ({
      name: draft.name,
      language: draft.language,
      category: draft.category,
      parameterFormat: 'NAMED',
      header:
        draft.headerType === 'NONE'
          ? null
          : { format: draft.headerType, text: draft.headerType === 'TEXT' ? draft.headerText ?? '' : null, variables: [] },
      body: draft.body || 'Your message appears here…',
      bodyVariables: bodyVars,
      footer: draft.footer?.trim() || null,
      buttons: draft.buttons.map((b) => ({ type: b.type, text: b.text || '…' })),
      brochureSlot: draft.headerType === 'DOCUMENT' || draft.headerType === 'IMAGE' ? draft.headerType : null,
      supported: true,
      unsupportedReason: null,
    }),
    [draft, bodyVars],
  )

  const submit = () => {
    setShowProblems(true)
    if (problems.length) return
    // Only the blanks the message really uses are sent.
    const payload: TemplateDraft = {
      ...effective,
      footer: draft.footer?.trim() || undefined,
      headerText: draft.headerType === 'TEXT' ? draft.headerText : undefined,
      sampleProjectId: draft.headerType === 'DOCUMENT' || draft.headerType === 'IMAGE' ? sampleProjectId : undefined,
      variables: Object.fromEntries(bodyVars.map((v) => [v, settingFor(draft, v)])),
    }
    const done = {
      onSuccess: () => {
        toast.success(editing ? 'Sent back to WhatsApp for review' : 'Template submitted to WhatsApp for approval', {
          description: 'You’ll get a notification when WhatsApp approves or rejects it — usually within minutes, at most a day.',
        })
        onClose()
      },
      onError: (err: unknown) => toast.error(extractErrorMessage(err)),
    }
    if (editing?.crm) resubmit.mutate({ id: editing.crm.id, draft: payload }, done)
    else create.mutate(payload, done)
  }

  const sampleName = projects.find((p) => p.id === sampleProjectId)?.brochureFileName ?? 'Brochure'
  const sampleValue = (key: string) => {
    const v = key.split(':')[1]
    return settingFor(draft, v).sample?.trim() || `{{${v}}}`
  }

  return (
    <Modal
      open={open}
      onClose={onClose}
      size="xl"
      title={editing ? `Fix and resubmit “${editing.name}”` : 'New WhatsApp template'}
      subtitle="WhatsApp reviews every template before it can be sent to leads who haven’t messaged you in the last 24 hours."
    >
      <div className="grid gap-6 lg:grid-cols-[1fr_320px]">
        <div className="flex flex-col gap-5">
          {editing?.rejectionReason && (
            <p className="rounded-xl bg-rose-50 p-3 text-sm text-rose-800 ring-1 ring-inset ring-rose-200">
              <span className="font-semibold">WhatsApp rejected it:</span> {editing.rejectionReason}
            </p>
          )}

          <div className="grid gap-4 sm:grid-cols-[1fr_180px]">
            <Field label="Name" required hint={editing ? 'The name can’t change.' : 'Lowercase letters, numbers and _ only — e.g. site_visit_invite'}>
              <Input
                value={draft.name}
                disabled={!!editing}
                placeholder="site_visit_invite"
                onChange={(e) => set({ name: toTemplateName(e.target.value) })}
              />
            </Field>
            <Field label="Language" required>
              <Select value={draft.language} disabled={!!editing} onChange={(e) => set({ language: e.target.value })}>
                {TEMPLATE_LANGUAGES.map((l) => (
                  <option key={l.code} value={l.code}>
                    {l.label}
                  </option>
                ))}
              </Select>
            </Field>
          </div>

          <Field label="Kind of message" required>
            <div className="grid gap-2 sm:grid-cols-2">
              {(
                [
                  ['MARKETING', 'Marketing', 'Project updates, offers, follow-ups, invitations to visit. Most follow-ups are this.'],
                  ['UTILITY', 'Utility', 'About something the lead asked for — e.g. confirming a booked site visit. Cheaper, but WhatsApp re-files promotional ones as Marketing.'],
                ] as const
              ).map(([value, label, hint]) => (
                <button
                  key={value}
                  type="button"
                  onClick={() => set({ category: value })}
                  className={cn(
                    'rounded-xl p-3 text-left ring-1 ring-inset transition-colors',
                    draft.category === value ? 'bg-brand-50 ring-brand-500' : 'ring-slate-200 hover:bg-slate-50',
                  )}
                >
                  <p className="text-sm font-semibold text-slate-800">{label}</p>
                  <p className="mt-0.5 text-xs text-slate-500">{hint}</p>
                </button>
              ))}
            </div>
          </Field>

          <Field label="On top of the message">
            <div className="grid gap-2 sm:grid-cols-4">
              {HEADER_OPTIONS.map((h) => (
                <button
                  key={h.value}
                  type="button"
                  title={h.hint}
                  onClick={() => set({ headerType: h.value })}
                  className={cn(
                    'flex flex-col items-center gap-1 rounded-xl p-2.5 text-xs font-medium ring-1 ring-inset',
                    draft.headerType === h.value ? 'bg-brand-50 text-brand-700 ring-brand-500' : 'text-slate-600 ring-slate-200 hover:bg-slate-50',
                  )}
                >
                  <h.icon className="size-4" />
                  {h.label}
                </button>
              ))}
            </div>
            {draft.headerType === 'TEXT' && (
              <Input
                className="mt-2"
                maxLength={60}
                value={draft.headerText ?? ''}
                placeholder="e.g. Your site visit invitation"
                onChange={(e) => set({ headerText: e.target.value })}
              />
            )}
            {(draft.headerType === 'DOCUMENT' || draft.headerType === 'IMAGE') && (
              <div className="mt-2">
                {sampleProjects.length ? (
                  <Select value={sampleProjectId ?? ''} onChange={(e) => set({ sampleProjectId: e.target.value })}>
                    {sampleProjects.map((p) => (
                      <option key={p.id} value={p.id}>
                        Sample for WhatsApp’s review: {p.name} brochure
                      </option>
                    ))}
                  </Select>
                ) : (
                  <p className="rounded-lg bg-amber-50 p-2.5 text-xs text-amber-800">
                    No project has a {draft.headerType === 'DOCUMENT' ? 'PDF' : 'JPG/PNG (up to 5 MB)'} brochure yet — upload one on the Projects page first.
                  </p>
                )}
                <p className="mt-1 text-xs text-slate-400">
                  This brochure is only the example WhatsApp’s reviewers see. When you send, each lead gets their own project’s brochure.
                </p>
              </div>
            )}
          </Field>

          <Field label="Message" required hint="Up to 1,024 characters. Use *bold* and _italics_ like in WhatsApp.">
            <Textarea
              ref={bodyRef}
              rows={5}
              maxLength={1024}
              value={draft.body}
              placeholder="Hi {{first_name}}, sharing the brochure of {{project_name}} with you. Would you like to plan a site visit this week?"
              onChange={(e) => set({ body: e.target.value })}
            />
            <div className="mt-2 flex flex-wrap gap-1.5">
              <span className="self-center text-xs text-slate-500">Insert a blank:</span>
              {BLANKS.map((b) => (
                <button
                  key={b.name}
                  type="button"
                  onClick={() => insertBlank(b.name, b.source, b.sample)}
                  className="rounded-full bg-emerald-50 px-2.5 py-1 text-xs font-medium text-emerald-700 ring-1 ring-inset ring-emerald-600/20 hover:bg-emerald-100"
                >
                  + {b.label}
                </button>
              ))}
              <button
                type="button"
                onClick={addCustomBlank}
                className="rounded-full bg-slate-100 px-2.5 py-1 text-xs font-medium text-slate-600 hover:bg-slate-200"
              >
                + Your own…
              </button>
            </div>
          </Field>

          {bodyVars.length > 0 && (
            <div className="flex flex-col gap-2">
              <div className="grid grid-cols-[130px_1fr_1fr_1fr] gap-2 text-xs font-medium text-slate-500">
                <span>Blank</span>
                <span>Filled with</span>
                <span>If empty / your text</span>
                <span>Example for reviewers</span>
              </div>
              {bodyVars.map((v) => {
                const s = settingFor(draft, v)
                const custom = s.source === 'CUSTOM'
                return (
                  <div key={v} className="grid grid-cols-[130px_1fr_1fr_1fr] items-center gap-2">
                    <code className="truncate rounded-md bg-emerald-50 px-2 py-1 text-xs font-semibold text-emerald-700" title={v}>
                      {`{{${v}}}`}
                    </code>
                    <Select
                      value={s.source}
                      onChange={(e) => {
                        const source = e.target.value as ParameterSource
                        setVariable(v, { source, text: DEFAULT_FALLBACKS[source] ?? '', sample: s.sample || SAMPLE_BY_SOURCE[source] || '' })
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
                      error={showProblems && custom && !s.text?.trim()}
                      placeholder={custom ? 'Text to send' : 'If empty, use…'}
                      onChange={(e) => setVariable(v, { text: e.target.value })}
                    />
                    <Input
                      value={s.sample}
                      error={showProblems && !s.sample.trim()}
                      placeholder="e.g. Rahul"
                      onChange={(e) => setVariable(v, { sample: e.target.value })}
                    />
                  </div>
                )
              })}
            </div>
          )}

          <Field label="Footer (optional)" hint="Small grey line at the bottom — a STOP note keeps your number’s quality rating healthy.">
            <Input maxLength={60} value={draft.footer ?? ''} onChange={(e) => set({ footer: e.target.value })} />
          </Field>

          <div className="flex flex-col gap-2">
            <p className="text-sm font-medium text-slate-700">Buttons (optional)</p>
            {draft.buttons.map((b, i) => (
              <div key={i} className="grid grid-cols-[110px_1fr_1fr_auto] items-center gap-2">
                <span className="text-xs font-medium text-slate-500">
                  {b.type === 'QUICK_REPLY' ? 'Quick reply' : b.type === 'URL' ? 'Website' : 'Call'}
                </span>
                <Input maxLength={25} value={b.text} placeholder="Button label" onChange={(e) => setButton(i, { text: e.target.value })} />
                {b.type === 'URL' ? (
                  <Input value={b.url ?? ''} placeholder="https://…" onChange={(e) => setButton(i, { url: e.target.value })} />
                ) : b.type === 'PHONE_NUMBER' ? (
                  <Input value={b.phoneNumber ?? ''} placeholder="+919812345678" onChange={(e) => setButton(i, { phoneNumber: e.target.value })} />
                ) : (
                  <span />
                )}
                <Button variant="ghost" size="sm" onClick={() => set({ buttons: draft.buttons.filter((_, j) => j !== i) })} title="Remove">
                  <Trash2 className="size-4" />
                </Button>
              </div>
            ))}
            <div className="flex flex-wrap gap-2">
              <Button
                variant="outline"
                size="sm"
                disabled={draft.buttons.length >= 10}
                onClick={() => set({ buttons: [...draft.buttons, { type: 'QUICK_REPLY', text: draft.buttons.length ? '' : 'Yes, call me' }] })}
              >
                <Plus className="size-3.5" /> Quick reply
              </Button>
              <Button
                variant="outline"
                size="sm"
                disabled={draft.buttons.filter((b) => b.type === 'URL').length >= 2}
                onClick={() => set({ buttons: [...draft.buttons, { type: 'URL', text: 'Visit website', url: '' }] })}
              >
                <Plus className="size-3.5" /> Website
              </Button>
              <Button
                variant="outline"
                size="sm"
                disabled={draft.buttons.some((b) => b.type === 'PHONE_NUMBER')}
                onClick={() => set({ buttons: [...draft.buttons, { type: 'PHONE_NUMBER', text: 'Call us', phoneNumber: '' }] })}
              >
                <Plus className="size-3.5" /> Call
              </Button>
            </div>
          </div>
        </div>

        <div className="flex flex-col gap-3">
          <p className="text-sm font-medium text-slate-700">Preview</p>
          <WhatsAppBubble template={preview} valueFor={sampleValue} brochureName={sampleName} />
          {showProblems && problems.length > 0 && (
            <div className="rounded-xl bg-amber-50 p-3 text-xs text-amber-900 ring-1 ring-inset ring-amber-200">
              <p className="mb-1 flex items-center gap-1.5 font-semibold">
                <AlertTriangle className="size-3.5" /> Fix before submitting
              </p>
              <ul className="list-disc pl-4">
                {problems.map((p) => (
                  <li key={p}>{p}</li>
                ))}
              </ul>
            </div>
          )}
          <Button onClick={submit} loading={create.isPending || resubmit.isPending}>
            <Send className="size-4" />
            {editing ? 'Resubmit for approval' : 'Submit for approval'}
          </Button>
          <p className="text-xs text-slate-400">
            WhatsApp usually decides within minutes, at most a day. You’ll get a notification either way, and approved templates
            appear in the send window straight away.
          </p>
        </div>
      </div>
    </Modal>
  )
}

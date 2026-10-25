import { useEffect, useState, type ReactNode } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { Building2, Copy, FileText, Layers, ListChecks, Share2 } from 'lucide-react'
import { toast } from 'sonner'
import { Modal } from '@/components/ui/modal'
import { Field } from '@/components/ui/input'
import { Select, Textarea } from '@/components/ui/select'
import { Button } from '@/components/ui/button'
import { WhatsAppGlyph } from '@/components/integrations/whatsapp-mark'
import { whatsappChatApi } from '@/api/whatsapp-chat.api'
import { useProjects } from '@/hooks/queries/use-projects'
import { useWhatsAppThread } from '@/hooks/queries/use-whatsapp-chat'
import { queryKeys } from '@/hooks/queries/query-keys'
import { extractErrorMessage } from '@/lib/api-client'
import {
  brochureUrl,
  fetchBrochureFile,
  projectBrochureMessage,
  projectShareMessage,
  whatsAppShareLink,
} from '@/lib/project-share'
import { cn } from '@/lib/utils'
import type { Lead } from '@/types'

type Content = 'both' | 'details' | 'brochure'

/** What the company number can send as an attachment (see WhatsAppMessagingService.sendMedia). */
const COMPANY_SENDABLE_TYPES = ['application/pdf', 'image/jpeg', 'image/png']

/** Web Share with files — phones, and Chrome/Edge on Windows. Not Firefox or most desktop Linux. */
const canShareFiles = typeof navigator !== 'undefined' && typeof navigator.canShare === 'function'

/**
 * Sends any of the organization's projects to this lead: pick the project,
 * then details + brochure, details only or brochure only. Goes from the
 * user's own WhatsApp — a wa.me chat with the message typed in, or the
 * device's share menu with the brochure file attached. When the lead has
 * messaged the company's WhatsApp Business number in the last 24 hours, it
 * can also be sent from that number, through the CRM.
 */
export function ShareToLeadModal({
  lead,
  open,
  onClose,
}: {
  lead: Pick<Lead, 'id' | 'fullName' | 'phone' | 'alternatePhones' | 'projectId'>
  open: boolean
  onClose: () => void
}) {
  const qc = useQueryClient()
  const { data: projects = [], isPending: projectsLoading } = useProjects(open)
  const [projectId, setProjectId] = useState('')
  const [content, setContent] = useState<Content>('both')
  const [phone, setPhone] = useState(lead.phone)
  // null = the generated message, which follows the chosen project and content.
  const [draft, setDraft] = useState<string | null>(null)

  useEffect(() => {
    if (open) {
      setProjectId(lead.projectId ?? '')
      setContent('both')
      setPhone(lead.phone)
      setDraft(null)
    }
  }, [open, lead.projectId, lead.phone])

  const project = projects.find((p) => p.id === projectId) ?? null
  const hasBrochure = !!project?.brochureToken
  // A project without a brochure can only send its details.
  const effective: Content = hasBrochure ? content : 'details'
  const withBrochure = effective !== 'details'

  // Fetched as soon as a project is picked: the share menu has to open
  // straight from the click, with no download in between, or browsers block it.
  const brochure = useQuery({
    queryKey: ['project-brochure-file', project?.brochureToken],
    queryFn: () => fetchBrochureFile(project!),
    enabled: open && hasBrochure,
    staleTime: 5 * 60_000,
    retry: false,
  })

  const { data: thread } = useWhatsAppThread(lead.id, open)

  const generated = !project
    ? ''
    : effective === 'brochure'
      ? projectBrochureMessage(project, lead.fullName)
      : projectShareMessage(project, lead.fullName, { withBrochure })
  const message = draft ?? generated
  const brochureOnly = effective === 'brochure'
  // Brochure only, where the file can't be attached: it goes as a link after the text.
  const messageWithLink = brochureOnly && project ? `${message}\n\n${brochureUrl(project)}` : message

  const brochureFile = withBrochure ? (brochure.data ?? null) : null
  const shareableFile = brochureFile && canShareFiles && navigator.canShare({ files: [brochureFile] }) ? brochureFile : null
  const companyFile = brochureFile && COMPANY_SENDABLE_TYPES.includes(brochureFile.type) ? brochureFile : null
  const brochureLoading = withBrochure && brochure.isPending
  const hasCompanyThread = !!thread?.messages.length

  const sendFromCompany = useMutation({
    mutationFn: async () => {
      if (brochureOnly) {
        // The text is the file's caption; a file the company number can't send goes as a link.
        await (companyFile
          ? whatsappChatApi.sendMedia(lead.id, companyFile, message)
          : whatsappChatApi.sendMessage(lead.id, messageWithLink))
        return
      }
      await whatsappChatApi.sendMessage(lead.id, message)
      if (companyFile) await whatsappChatApi.sendMedia(lead.id, companyFile, `${project!.name} — brochure`)
    },
    onSuccess: () => {
      toast.success('Sent from the company WhatsApp number')
      onClose()
    },
    onError: (error) => toast.error('Not sent', { description: extractErrorMessage(error) }),
    onSettled: () => {
      qc.invalidateQueries({ queryKey: queryKeys.whatsappChat.thread(lead.id) })
    },
  })

  const changeProject = (id: string) => {
    setProjectId(id)
    setDraft(null)
  }

  const changeContent = (next: Content) => {
    setContent(next)
    setDraft(null)
  }

  const openWhatsApp = () => {
    window.open(whatsAppShareLink(phone, messageWithLink), '_blank', 'noopener,noreferrer')
  }

  const shareWithBrochure = async () => {
    if (!shareableFile || !project) return
    // Most apps keep the text with the file; some (e.g. a few desktop
    // targets) drop it, so it's on the clipboard too, ready to paste.
    navigator.clipboard?.writeText(message).catch(() => {})
    try {
      await navigator.share({ files: [shareableFile], text: message, title: project.name })
    } catch (error) {
      if ((error as DOMException)?.name !== 'AbortError') {
        toast.error('Could not open the share menu', { description: 'Use Open WhatsApp instead — the brochure link is in the message.' })
      }
    }
  }

  const copyMessage = async () => {
    try {
      await navigator.clipboard.writeText(messageWithLink)
      toast.success('Message copied')
    } catch {
      toast.error('Could not copy — select the text and copy it instead')
    }
  }

  const numbers = [lead.phone, ...(lead.alternatePhones ?? [])]
  const sendDisabled = !project || !message.trim() || brochureLoading

  return (
    <Modal open={open} onClose={onClose} title="Share a project" subtitle={`To ${lead.fullName}`} size="md">
      <div className="flex flex-col gap-4">
        <Field label="Project">
          <Select value={projectId} onChange={(e) => changeProject(e.target.value)} disabled={projectsLoading}>
            <option value="">{projectsLoading ? 'Loading projects…' : 'Choose a project'}</option>
            {projects.map((p) => (
              <option key={p.id} value={p.id}>
                {p.name}
                {p.id === lead.projectId ? ' (lead’s project)' : ''}
              </option>
            ))}
          </Select>
        </Field>

        {project && (
          <>
            <div className="flex flex-col gap-1.5">
              <span className="text-sm font-medium text-slate-700">What to send</span>
              <div role="radiogroup" className="grid gap-2 sm:grid-cols-3">
                <ContentChoice
                  selected={effective === 'both'}
                  onSelect={() => changeContent('both')}
                  disabled={!hasBrochure}
                  icon={<Layers className="size-4" />}
                  title="Details + brochure"
                />
                <ContentChoice
                  selected={effective === 'details'}
                  onSelect={() => changeContent('details')}
                  icon={<ListChecks className="size-4" />}
                  title="Details only"
                />
                <ContentChoice
                  selected={effective === 'brochure'}
                  onSelect={() => changeContent('brochure')}
                  disabled={!hasBrochure}
                  icon={<FileText className="size-4" />}
                  title="Brochure only"
                />
              </div>
            </div>

            {numbers.length > 1 && (
              <Field label="Send to">
                <Select value={phone} onChange={(e) => setPhone(e.target.value)}>
                  {numbers.map((n, i) => (
                    <option key={n} value={n}>
                      {n}
                      {i === 0 ? ' (main number)' : ''}
                    </option>
                  ))}
                </Select>
              </Field>
            )}

            <Field
              label={brochureOnly ? 'Text with the brochure' : 'Message'}
              hint={draft !== null ? undefined : 'Edit anything before sending.'}
            >
              <Textarea
                value={message}
                onChange={(e) => setDraft(e.target.value)}
                className={cn('text-sm', brochureOnly ? 'min-h-20' : 'min-h-56')}
              />
            </Field>

            <p className="flex items-start gap-2 rounded-xl bg-slate-50 px-3 py-2 text-xs text-slate-500">
              <FileText className="mt-px size-4 shrink-0" />
              <span>
                {!hasBrochure
                  ? 'This project has no brochure yet — an Admin can add one from Projects → Edit.'
                  : !withBrochure
                    ? 'Only the project’s details are sent, without the brochure.'
                    : brochure.isPending
                      ? 'Getting the brochure ready…'
                      : brochure.isError
                        ? 'The brochure file couldn’t be loaded, so only its link can be sent.'
                        : brochureOnly
                          ? shareableFile
                            ? `Send on WhatsApp attaches the brochure file with this text — pick WhatsApp, then ${lead.fullName.split(' ')[0]}’s chat.`
                            : 'This browser can’t attach files to WhatsApp, so the brochure goes as a link after this text. On a phone, the file itself is attached.'
                        : shareableFile
                          ? 'Share with brochure attaches the brochure file — pick WhatsApp, then the customer’s chat. The message is also copied, in case the app leaves it out. Open WhatsApp sends the brochure as a link.'
                          : 'This browser can’t attach files to WhatsApp — Open WhatsApp sends the brochure as a link. On a phone, the brochure can be attached.'}
              </span>
            </p>

            {hasCompanyThread && (
              <div className="flex flex-col gap-2 rounded-xl border border-slate-100 p-3 text-xs text-slate-500 sm:flex-row sm:items-center sm:justify-between">
                <p className="flex items-start gap-2">
                  <Building2 className="mt-px size-4 shrink-0" />
                  {thread.withinServiceWindow
                    ? `${lead.fullName} is chatting with the company WhatsApp number (${thread.lead.phone}), so the CRM can send this${
                        companyFile ? ' and the brochure file' : ''
                      } from it.`
                    : `${lead.fullName} hasn’t messaged the company number in the last 24 hours, so WhatsApp only allows approved templates from it — send from your own WhatsApp instead.`}
                </p>
                {thread.withinServiceWindow && (
                  <Button
                    variant="secondary"
                    size="sm"
                    className="shrink-0"
                    loading={sendFromCompany.isPending}
                    disabled={sendDisabled}
                    onClick={() => sendFromCompany.mutate()}
                  >
                    Send from company number
                  </Button>
                )}
              </div>
            )}
          </>
        )}

        <div className="flex flex-col-reverse gap-2 sm:flex-row sm:flex-wrap sm:justify-end [&>button]:whitespace-nowrap">
          <Button variant="ghost" onClick={copyMessage} disabled={!project || !message.trim()}>
            <Copy className="size-4" />
            Copy message
          </Button>
          {shareableFile && !brochureOnly && (
            <Button variant="secondary" onClick={shareWithBrochure} disabled={sendDisabled}>
              <Share2 className="size-4" />
              Share with brochure
            </Button>
          )}
          <Button
            // Brochure only: one button, which attaches the file when this device can.
            onClick={brochureOnly && shareableFile ? shareWithBrochure : openWhatsApp}
            disabled={sendDisabled}
            // WhatsApp's teal rather than its bright green, which is too light for white text.
            className="bg-[#128C7E] shadow-[#128C7E]/20 hover:bg-[#0f7a6e] active:bg-[#0c6a60] disabled:bg-[#128C7E]/40"
          >
            <WhatsAppGlyph />
            {brochureOnly ? 'Send on WhatsApp' : 'Open WhatsApp'}
          </Button>
        </div>
      </div>
    </Modal>
  )
}

function ContentChoice({
  selected,
  onSelect,
  disabled,
  icon,
  title,
}: {
  selected: boolean
  onSelect: () => void
  disabled?: boolean
  icon: ReactNode
  title: string
}) {
  return (
    <button
      type="button"
      role="radio"
      aria-checked={selected}
      disabled={disabled}
      onClick={onSelect}
      title={disabled ? 'This project has no brochure' : undefined}
      className={cn(
        'flex items-center gap-2.5 rounded-xl p-2.5 text-left ring-1 ring-inset transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-brand-500',
        selected ? 'bg-brand-50 ring-brand-500' : 'bg-white ring-slate-200 hover:bg-slate-50',
        disabled && 'cursor-not-allowed opacity-50 hover:bg-white',
      )}
    >
      <span
        className={cn(
          'flex size-7 shrink-0 items-center justify-center rounded-lg',
          selected ? 'bg-brand-600 text-white' : 'bg-slate-100 text-slate-500',
        )}
      >
        {icon}
      </span>
      <span className={cn('text-sm font-medium', selected ? 'text-brand-700' : 'text-slate-800')}>{title}</span>
    </button>
  )
}

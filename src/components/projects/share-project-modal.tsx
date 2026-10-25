import { useEffect, useId, useMemo, useState } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { Building2, Copy, FileText, Share2 } from 'lucide-react'
import { toast } from 'sonner'
import { Modal } from '@/components/ui/modal'
import { Field, Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/select'
import { Button } from '@/components/ui/button'
import { WhatsAppGlyph } from '@/components/integrations/whatsapp-mark'
import { whatsappChatApi } from '@/api/whatsapp-chat.api'
import { useLeads } from '@/hooks/queries/use-leads'
import { useWhatsAppThread } from '@/hooks/queries/use-whatsapp-chat'
import { queryKeys } from '@/hooks/queries/query-keys'
import { extractErrorMessage } from '@/lib/api-client'
import { fetchBrochureFile, projectShareMessage, whatsAppShareLink } from '@/lib/project-share'
import { formatLeadNumber } from '@/lib/utils'
import type { Project } from '@/types'

const digitsOf = (phone: string) => phone.replace(/\D/g, '').slice(-10)

/** What the company number can send as an attachment (see WhatsAppMessagingService.sendMedia). */
const COMPANY_SENDABLE_TYPES = ['application/pdf', 'image/jpeg', 'image/png']

/** Web Share with files — phones, and Chrome/Edge on Windows. Not Firefox or most desktop Linux. */
const canShareFiles = typeof navigator !== 'undefined' && typeof navigator.canShare === 'function'

/**
 * Sends a project's details and brochure to a customer, three ways:
 *  - "Share with brochure": the device's share menu with the brochure file
 *    attached — the user picks WhatsApp and the chat;
 *  - "Open WhatsApp": a wa.me chat with the message typed in (text only;
 *    the brochure goes as a link);
 *  - "Send from company number": when the number is a lead who messaged the
 *    company's WhatsApp Business number in the last 24 hours, the CRM sends
 *    the message and the brochure file from that number.
 */
export function ShareProjectModal({
  project,
  open,
  onClose,
  defaultPhone,
}: {
  project: Project | null
  open: boolean
  onClose: () => void
  /** Pre-fills the customer's number, e.g. when sharing from a lead. */
  defaultPhone?: string | null
}) {
  const listId = useId()
  const qc = useQueryClient()
  const [phone, setPhone] = useState('')
  // null = the generated message, which follows the chosen customer's name.
  const [draft, setDraft] = useState<string | null>(null)
  const { data: leads = [] } = useLeads({}, open)

  useEffect(() => {
    if (open) {
      setPhone(defaultPhone ?? '')
      setDraft(null)
    }
  }, [open, defaultPhone])

  const matchedLead = useMemo(() => {
    const digits = digitsOf(phone)
    return digits.length === 10 ? leads.find((l) => digitsOf(l.phone) === digits) : undefined
  }, [leads, phone])

  // Fetched as soon as the dialog opens: the share menu has to open straight
  // from the click, with no download in between, or browsers block it.
  const brochure = useQuery({
    queryKey: ['project-brochure-file', project?.brochureToken],
    queryFn: () => fetchBrochureFile(project!),
    enabled: open && !!project?.brochureToken,
    staleTime: 5 * 60_000,
    retry: false,
  })

  const { data: thread } = useWhatsAppThread(matchedLead?.id, open && !!matchedLead)

  const message = project ? (draft ?? projectShareMessage(project, matchedLead?.fullName)) : ''

  const sendFromCompany = useMutation({
    mutationFn: async ({ leadId, file }: { leadId: string; file: File | null }) => {
      await whatsappChatApi.sendMessage(leadId, message)
      if (file) await whatsappChatApi.sendMedia(leadId, file, `${project!.name} — brochure`)
    },
    onSuccess: () => {
      toast.success('Sent from the company WhatsApp number')
      onClose()
    },
    onError: (error) => toast.error('Not sent', { description: extractErrorMessage(error) }),
    onSettled: (_data, _error, { leadId }) => {
      qc.invalidateQueries({ queryKey: queryKeys.whatsappChat.thread(leadId) })
    },
  })

  if (!project) return null

  const phoneDigits = phone.replace(/\D/g, '')
  const phoneInvalid = phoneDigits.length > 0 && phoneDigits.length < 10

  const brochureFile = brochure.data ?? null
  const shareableFile = brochureFile && canShareFiles && navigator.canShare({ files: [brochureFile] }) ? brochureFile : null
  const companyFile = brochureFile && COMPANY_SENDABLE_TYPES.includes(brochureFile.type) ? brochureFile : null
  const hasCompanyThread = !!matchedLead && !!thread?.messages.length

  const openWhatsApp = () => {
    window.open(whatsAppShareLink(phone, message), '_blank', 'noopener,noreferrer')
  }

  const shareWithBrochure = async () => {
    if (!shareableFile) return
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
      await navigator.clipboard.writeText(message)
      toast.success('Message copied')
    } catch {
      toast.error('Could not copy — select the text and copy it instead')
    }
  }

  return (
    <Modal open={open} onClose={onClose} title="Send on WhatsApp" subtitle={project.name} size="md">
      <div className="flex flex-col gap-4">
        <Field
          label="Customer’s WhatsApp number"
          error={phoneInvalid ? 'Enter the full number, with country code if outside India' : undefined}
          hint={
            matchedLead
              ? `${matchedLead.fullName} · ${formatLeadNumber(matchedLead.leadNumber)}`
              : 'Type a number or pick one of your leads. Leave blank to choose the chat in WhatsApp.'
          }
        >
          <Input
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            list={listId}
            inputMode="tel"
            placeholder="+91 98765 43210"
            error={phoneInvalid}
          />
          <datalist id={listId}>
            {leads.map((l) => (
              <option key={l.id} value={l.phone}>
                {l.fullName} · {formatLeadNumber(l.leadNumber)}
              </option>
            ))}
          </datalist>
        </Field>

        <Field label="Message" hint={draft !== null ? undefined : 'Edit anything before sending.'}>
          <Textarea value={message} onChange={(e) => setDraft(e.target.value)} className="min-h-64 text-sm" />
        </Field>

        {!project.brochureToken ? (
          <p className="flex items-center gap-2 rounded-xl bg-slate-50 px-3 py-2 text-xs text-slate-500">
            <FileText className="size-4 shrink-0" />
            This project has no brochure yet — an Admin can add one from Projects → Edit.
          </p>
        ) : (
          <p className="flex items-start gap-2 rounded-xl bg-slate-50 px-3 py-2 text-xs text-slate-500">
            <FileText className="mt-px size-4 shrink-0" />
            <span>
              {brochure.isPending
                ? 'Getting the brochure ready…'
                : brochure.isError
                  ? 'The brochure file couldn’t be loaded, so only its link can be sent.'
                  : shareableFile
                    ? 'Share with brochure attaches the brochure file — pick WhatsApp, then the customer’s chat. The message is also copied, in case the app leaves it out.'
                    : 'This browser can’t attach files to WhatsApp — Open WhatsApp sends the details with the brochure link. On a phone, the brochure can be attached.'}
            </span>
          </p>
        )}

        {hasCompanyThread && (
          <div className="flex flex-col gap-2 rounded-xl border border-slate-100 p-3 text-xs text-slate-500 sm:flex-row sm:items-center sm:justify-between">
            <p className="flex items-start gap-2">
              <Building2 className="mt-px size-4 shrink-0" />
              {thread.withinServiceWindow
                ? `${matchedLead.fullName} messaged the company number in the last 24 hours, so the CRM can send this${
                    companyFile ? ' and the brochure file' : ''
                  } from it.`
                : `${matchedLead.fullName} hasn’t messaged the company number in the last 24 hours, so WhatsApp only allows approved templates from it — send from your own WhatsApp instead.`}
            </p>
            {thread.withinServiceWindow && (
              <Button
                variant="secondary"
                size="sm"
                className="shrink-0"
                loading={sendFromCompany.isPending}
                disabled={!message.trim() || (!!project.brochureToken && brochure.isPending)}
                onClick={() => sendFromCompany.mutate({ leadId: matchedLead.id, file: companyFile })}
              >
                Send from company number
              </Button>
            )}
          </div>
        )}

        <div className="flex flex-col-reverse gap-2 sm:flex-row sm:flex-wrap sm:justify-end [&>button]:whitespace-nowrap">
          <Button variant="ghost" onClick={copyMessage}>
            <Copy className="size-4" />
            Copy message
          </Button>
          {shareableFile && (
            <Button variant="secondary" onClick={shareWithBrochure} disabled={!message.trim()}>
              <Share2 className="size-4" />
              Share with brochure
            </Button>
          )}
          <Button
            onClick={openWhatsApp}
            disabled={phoneInvalid || !message.trim()}
            // WhatsApp's teal rather than its bright green, which is too light for white text.
            className="bg-[#128C7E] shadow-[#128C7E]/20 hover:bg-[#0f7a6e] active:bg-[#0c6a60] disabled:bg-[#128C7E]/40"
          >
            <WhatsAppGlyph />
            Open WhatsApp
          </Button>
        </div>
      </div>
    </Modal>
  )
}

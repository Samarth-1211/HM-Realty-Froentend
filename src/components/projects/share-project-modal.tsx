import { useEffect, useId, useMemo, useState } from 'react'
import { Copy, FileText } from 'lucide-react'
import { toast } from 'sonner'
import { Modal } from '@/components/ui/modal'
import { Field, Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/select'
import { Button } from '@/components/ui/button'
import { WhatsAppGlyph } from '@/components/integrations/whatsapp-mark'
import { useLeads } from '@/hooks/queries/use-leads'
import { projectShareMessage, whatsAppShareLink } from '@/lib/project-share'
import { formatLeadNumber } from '@/lib/utils'
import type { Project } from '@/types'

const digitsOf = (phone: string) => phone.replace(/\D/g, '').slice(-10)

/**
 * Sends a project's details (and brochure link) to a customer from the
 * user's own WhatsApp: builds the message, then opens a wa.me chat with it
 * typed in — nothing goes through the company's WhatsApp Business number.
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

  if (!project) return null

  const message = draft ?? projectShareMessage(project, matchedLead?.fullName)
  const phoneDigits = phone.replace(/\D/g, '')
  const phoneInvalid = phoneDigits.length > 0 && phoneDigits.length < 10

  const openWhatsApp = () => {
    window.open(whatsAppShareLink(phone, message), '_blank', 'noopener,noreferrer')
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

        {!project.brochureToken && (
          <p className="flex items-center gap-2 rounded-xl bg-slate-50 px-3 py-2 text-xs text-slate-500">
            <FileText className="size-4 shrink-0" />
            This project has no brochure yet — an Admin can add one from Projects → Edit.
          </p>
        )}

        <div className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
          <Button variant="ghost" onClick={copyMessage}>
            <Copy className="size-4" />
            Copy message
          </Button>
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

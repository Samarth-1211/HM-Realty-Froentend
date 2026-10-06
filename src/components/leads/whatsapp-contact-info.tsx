import type { ComponentType, ReactNode } from 'react'
import { Link } from '@tanstack/react-router'
import {
  Building2,
  CalendarClock,
  ExternalLink,
  Hash,
  House,
  Mail,
  MapPin,
  Phone,
  Smartphone,
  StickyNote,
  UserRound,
  Wallet,
  X,
} from 'lucide-react'
import { StatusPill } from '@/components/ui/badge'
import { Spinner } from '@/components/ui/spinner'
import { LeadStatusBadge } from '@/components/leads/lead-status-badge'
import { WhatsAppAvatar } from '@/components/leads/whatsapp-avatar'
import { useLead } from '@/hooks/queries/use-leads'
import { useBlobUrlRef, useWhatsAppMedia, useWhatsAppThread } from '@/hooks/queries/use-whatsapp-chat'
import type { WhatsAppInboxItem } from '@/api/whatsapp-chat.api'
import { LEAD_TEMPERATURE_COLORS, LEAD_TEMPERATURE_LABELS } from '@/lib/constants'
import { formatCurrency, formatDate, formatDateTime, formatEnumLabel, formatLeadNumber, formatRoleLabel } from '@/lib/utils'
import { MEDIA_TYPES, whatsappDisplayName } from '@/lib/whatsapp-format'
import type { Lead, WhatsAppMessage } from '@/types'

function budgetLabel(lead: Lead) {
  if (lead.budgetMin && lead.budgetMax) return `${formatCurrency(lead.budgetMin)} – ${formatCurrency(lead.budgetMax)}`
  if (lead.budgetMin) return `From ${formatCurrency(lead.budgetMin)}`
  if (lead.budgetMax) return `Up to ${formatCurrency(lead.budgetMax)}`
  return null
}

function Section({ title, children }: { title?: string; children: ReactNode }) {
  return (
    <section className="bg-white px-6 py-4 shadow-[0_1px_0.5px_rgba(11,20,26,0.08)]">
      {title && <h4 className="mb-2 text-sm text-wa-muted">{title}</h4>}
      {children}
    </section>
  )
}

/** One fact, WhatsApp-style: the value on top, what it is underneath. Renders nothing without a value. */
function InfoRow({
  icon: Icon,
  label,
  value,
}: {
  icon: ComponentType<{ className?: string }>
  label: string
  value: ReactNode
}) {
  if (value === null || value === undefined || value === '') return null
  return (
    <div className="flex items-start gap-4 py-2">
      <Icon className="mt-0.5 size-5 shrink-0 text-wa-muted" />
      <div className="min-w-0">
        <div className="break-words text-[15px] leading-5 text-wa-ink">{value}</div>
        <p className="text-[13px] text-wa-muted">{label}</p>
      </div>
    </div>
  )
}

function MediaThumb({ message }: { message: WhatsAppMessage }) {
  const { data: blob } = useWhatsAppMedia(message.leadId, message.id, true)
  const imgRef = useBlobUrlRef<HTMLImageElement>(blob, 'src')
  return (
    <span className="block size-[76px] overflow-hidden rounded-md bg-wa-panel">
      {blob && <img ref={imgRef} alt="" className="size-full object-cover" />}
    </span>
  )
}

function ActionTile({ icon: Icon, label }: { icon: ComponentType<{ className?: string }>; label: string }) {
  return (
    <span className="flex w-24 flex-col items-center gap-1.5 rounded-xl border border-wa-line px-3 py-2.5 text-[13px] text-wa-ink transition-colors hover:bg-wa-hover">
      <Icon className="size-5 text-wa-green" />
      {label}
    </span>
  )
}

/**
 * The panel that opens from a chat's header, laid out like WhatsApp's
 * "Contact info" — filled with what the CRM knows about the lead.
 * `summary` (the inbox row) covers the top card until the full lead loads.
 */
export function WhatsAppContactInfo({
  leadId,
  summary,
  onClose,
}: {
  leadId: string
  summary: WhatsAppInboxItem
  onClose: () => void
}) {
  const { data: lead, isLoading } = useLead(leadId)
  const { data: thread } = useWhatsAppThread(leadId)

  const media = thread?.messages.filter((m) => MEDIA_TYPES.includes(m.messageType)) ?? []
  const photos = media.filter((m) => m.messageType === 'image' && m.mediaStorageKey).slice(-3).reverse()
  const assignee = lead?.assignedTo ?? summary.assignedTo
  const lookingFor = lead ? [lead.propertyInterest, lead.unitType].filter(Boolean).join(' · ') : ''

  return (
    <aside className="flex h-full min-h-0 flex-col bg-wa-panel font-wa">
      <header className="flex h-[60px] shrink-0 items-center gap-6 bg-wa-panel px-5">
        <button type="button" onClick={onClose} aria-label="Close contact info" className="text-wa-icon hover:text-wa-ink">
          <X className="size-5" />
        </button>
        <h3 className="text-base text-wa-ink">Contact info</h3>
      </header>

      <div className="flex min-h-0 flex-1 flex-col gap-2.5 overflow-y-auto pb-6">
        <section className="flex flex-col items-center bg-white px-6 pb-5 pt-7 text-center shadow-[0_1px_0.5px_rgba(11,20,26,0.08)]">
          <WhatsAppAvatar className="size-32" />
          <h2 className="mt-4 break-words text-2xl leading-8 text-wa-ink">{whatsappDisplayName(summary)}</h2>
          <p className="mt-0.5 text-base text-wa-muted">{summary.phone}</p>
          <div className="mt-4 flex justify-center gap-3">
            <a href={`tel:${summary.phone}`}>
              <ActionTile icon={Phone} label="Call" />
            </a>
            <Link to="/leads/$leadId" params={{ leadId }}>
              <ActionTile icon={ExternalLink} label="Open lead" />
            </Link>
          </div>
        </section>

        <Section title="About">
          <div className="flex flex-wrap items-center gap-2">
            <LeadStatusBadge status={lead?.status ?? summary.status} />
            {lead?.leadTemperature && (
              <StatusPill
                label={LEAD_TEMPERATURE_LABELS[lead.leadTemperature] ?? formatEnumLabel(lead.leadTemperature)}
                className={LEAD_TEMPERATURE_COLORS[lead.leadTemperature] ?? ''}
              />
            )}
          </div>
          {lead && (
            <p className="mt-2 text-[15px] text-wa-ink">
              {formatEnumLabel(lead.source)} lead · added {formatDate(lead.receivedAt ?? lead.createdAt)}
            </p>
          )}
        </Section>

        {media.length > 0 && (
          <Section>
            <div className="flex items-center justify-between text-sm text-wa-muted">
              <span>Media, links and docs</span>
              <span>{media.length}</span>
            </div>
            {photos.length > 0 && (
              <div className="mt-3 flex gap-2">
                {photos.map((m) => (
                  <MediaThumb key={m.id} message={m} />
                ))}
              </div>
            )}
          </Section>
        )}

        <Section title="Lead details">
          <InfoRow
            icon={UserRound}
            label="Assigned to"
            value={
              assignee
                ? `${assignee.firstName} ${assignee.lastName}${lead?.assignedTo ? ` · ${formatRoleLabel(lead.assignedTo.role)}` : ''}`
                : 'Unassigned'
            }
          />
          {lead && (
            <>
              <InfoRow icon={Hash} label="Lead ID" value={formatLeadNumber(lead.leadNumber)} />
              <InfoRow icon={Building2} label="Project" value={lead.project?.name} />
              <InfoRow icon={House} label="Looking for" value={lookingFor} />
              <InfoRow icon={Wallet} label="Budget" value={budgetLabel(lead)} />
              <InfoRow icon={MapPin} label="City" value={lead.city} />
              <InfoRow
                icon={CalendarClock}
                label="Next follow-up"
                value={lead.nextFollowUpAt ? formatDateTime(lead.nextFollowUpAt) : null}
              />
              <InfoRow icon={StickyNote} label="Remarks" value={lead.remarks} />
            </>
          )}
          {isLoading && (
            <div className="flex justify-center py-3">
              <Spinner className="text-wa-green" />
            </div>
          )}
        </Section>

        <Section title="Contact">
          <InfoRow icon={Smartphone} label="Mobile" value={summary.phone} />
          {lead?.alternatePhones.map((phone) => (
            <InfoRow key={phone} icon={Phone} label="Other number" value={phone} />
          ))}
          <InfoRow icon={Mail} label="Email" value={lead?.email} />
        </Section>
      </div>
    </aside>
  )
}

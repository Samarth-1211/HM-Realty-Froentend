import { API_BASE_URL, APP_NAME } from '@/lib/constants'
import { formatEnumLabel } from '@/lib/utils'
import {
  formatEmCharges,
  formatPlc,
  formatProjectBudget,
  formatProjectPlotSizes,
  formatRate,
} from '@/lib/project-pricing'
import type { Project } from '@/types'

/**
 * Public link to the project's brochure — opens without logging in, since
 * it's sent to customers. Null when the project has no brochure.
 */
export function brochureUrl(project: Pick<Project, 'brochureToken'>, download = false): string | null {
  if (!project.brochureToken) return null
  return `${API_BASE_URL.replace(/\/$/, '')}/public/brochures/${project.brochureToken}${download ? '?download=1' : ''}`
}

/**
 * The WhatsApp message about a project for a customer — the user can edit it
 * before sending. Internal fields (rate-list source, guideline rate, remarks)
 * are left out; "*text*" is WhatsApp's bold.
 */
export function projectShareMessage(project: Project, customerName?: string | null): string {
  const detail = (label: string, value: string | null | undefined) =>
    value && value !== '—' ? `*${label}:* ${value}` : null

  const place = [project.location, project.zone].filter(Boolean).join(', ')
  const brochure = brochureUrl(project)

  const lines = [
    `Hi${customerName ? ` ${customerName.split(' ')[0]}` : ''},`,
    '',
    `Here are the details of *${project.name}*:`,
    '',
    // Landmarks are typed as "Near Bombay Hospital", so they're shown as written.
    detail('Location', place + (project.landmark ? ` (${project.landmark})` : '')),
    detail('Property type', formatEnumLabel(project.propertyType)),
    detail('Basic rate', formatRate(project.basicRateMin, project.basicRateMax)),
    detail('E+M charges', formatEmCharges(project)),
    detail('PLC', formatPlc(project)),
    detail('Plot sizes', formatProjectPlotSizes(project)),
    detail('Budget', formatProjectBudget(project)),
    detail('Payment terms', project.paymentTerms && formatEnumLabel(project.paymentTerms)),
    project.description ? `\n${project.description.trim()}` : null,
    brochure ? `\n*Brochure:* ${brochure}` : null,
    '',
    'Happy to answer any questions or arrange a site visit.',
    `— ${APP_NAME}`,
  ]

  return lines.filter((line) => line !== null).join('\n')
}

/**
 * wa.me click-to-chat link: opens the user's own WhatsApp (app or web) with
 * the message typed in. Without a number, WhatsApp asks which chat to use.
 */
export function whatsAppShareLink(phone: string, text: string): string {
  // wa.me wants the number with its country code and nothing else; a bare
  // 10-digit (Indian) mobile gets +91.
  let digits = phone.replace(/\D/g, '').replace(/^0+/, '')
  if (digits.length === 10) digits = `91${digits}`
  return `https://wa.me/${digits}?text=${encodeURIComponent(text)}`
}

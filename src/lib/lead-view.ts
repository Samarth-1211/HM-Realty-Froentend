import { LEAD_PROGRESS_STAGE_LABELS } from '@/lib/constants'
import { formatEnumLabel } from '@/lib/utils'
import { LeadStatus, VisitStatus, type Lead, type LeadProjectRef } from '@/types'

/** The stage an in-progress lead is at ("Site visit done", or the note typed for "Other"); '' otherwise. */
export function progressStageLabel(lead: Pick<Lead, 'status' | 'progressStage' | 'progressStageNote'>): string {
  if (lead.status !== LeadStatus.IN_PROGRESS || !lead.progressStage) return ''
  return lead.progressStage === 'OTHER' ? lead.progressStageNote || 'Other' : LEAD_PROGRESS_STAGE_LABELS[lead.progressStage]
}

/** "In Progress · Site visit done" — the status, plus the stage when the lead is in progress. */
export function leadStageLabel(lead: Pick<Lead, 'status' | 'progressStage' | 'progressStageNote'>): string {
  const stage = progressStageLabel(lead)
  return stage ? `${formatEnumLabel(lead.status)} · ${stage}` : formatEnumLabel(lead.status)
}

/** The lead's main project first, then the ones it's also interested in. */
export function leadProjects(lead: Pick<Lead, 'project' | 'interestedProjects'>): LeadProjectRef[] {
  return [...(lead.project ? [lead.project] : []), ...(lead.interestedProjects ?? [])]
}

/** Where the lead's projects are, each place once. */
export function leadLocations(lead: Pick<Lead, 'project' | 'interestedProjects'>): string[] {
  return [...new Set(leadProjects(lead).map((p) => p.location?.trim() ?? '').filter(Boolean))]
}

export function matchesLeadProject(lead: Pick<Lead, 'project' | 'interestedProjects'>, projectId: string): boolean {
  return !projectId || leadProjects(lead).some((p) => p.id === projectId)
}

export function matchesLeadLocation(lead: Pick<Lead, 'project' | 'interestedProjects'>, location: string): boolean {
  return !location || leadLocations(lead).includes(location)
}

/** A visit that's booked and still to happen (or overdue), as opposed to done or called off. */
export function bookedVisitAt(lead: Pick<Lead, 'siteVisitDate' | 'visitStatus'>): string | null {
  if (!lead.siteVisitDate) return null
  return lead.visitStatus === VisitStatus.SCHEDULED || lead.visitStatus === VisitStatus.RESCHEDULED ? lead.siteVisitDate : null
}

export interface LeadCount {
  key: string
  label: string
  count: number
}

/**
 * How many leads fall under each project and each location. A lead
 * interested in several projects counts under each of them. Most leads first.
 */
export function countLeadsByProject(leads: Pick<Lead, 'project' | 'interestedProjects'>[]): LeadCount[] {
  const counts = new Map<string, LeadCount>()
  for (const lead of leads) {
    for (const p of leadProjects(lead)) {
      const entry = counts.get(p.id) ?? { key: p.id, label: p.name, count: 0 }
      entry.count++
      counts.set(p.id, entry)
    }
  }
  return sortCounts([...counts.values()])
}

export function countLeadsByLocation(leads: Pick<Lead, 'project' | 'interestedProjects'>[]): LeadCount[] {
  const counts = new Map<string, LeadCount>()
  for (const lead of leads) {
    for (const location of leadLocations(lead)) {
      const entry = counts.get(location) ?? { key: location, label: location, count: 0 }
      entry.count++
      counts.set(location, entry)
    }
  }
  return sortCounts([...counts.values()])
}

function sortCounts(counts: LeadCount[]): LeadCount[] {
  return counts.sort((a, b) => b.count - a.count || a.label.localeCompare(b.label))
}

import { EmChargesStatus, PlotSizeMode, type Project } from '@/types'

/** Mirrors computeBudgetRange in the backend's project-pricing.util.ts, which is authoritative. */
export function computeBudgetRange(input: {
  basicRateMin: number | null
  basicRateMax: number | null
  plotSizeMode: PlotSizeMode
  plotAreas: number[]
  plotAreaMin: number | null
  plotAreaMax: number | null
}): { min: number; max: number } | null {
  const rateMin = input.basicRateMin ?? input.basicRateMax
  const rateMax = input.basicRateMax ?? input.basicRateMin
  if (rateMin === null || rateMax === null) return null

  const areas = (
    input.plotSizeMode === PlotSizeMode.RANGE ? [input.plotAreaMin, input.plotAreaMax] : input.plotAreas
  ).filter((a): a is number => a !== null && a > 0)
  if (areas.length === 0) return null

  return {
    min: Math.round(rateMin * Math.min(...areas)),
    max: Math.round(rateMax * Math.max(...areas)),
  }
}

export const EM_CHARGES_STATUS_LABELS: Record<EmChargesStatus, string> = {
  AMOUNT: 'Amount',
  NA: 'NA',
  OTHERS: 'Others',
}

const rupees = new Intl.NumberFormat('en-IN', { maximumFractionDigits: 0 })
const plain = new Intl.NumberFormat('en-IN', { maximumFractionDigits: 2, useGrouping: false })

/** Indian short form: 3995000 → "39.95L", 12400000 → "1.24CR", below a lakh → "₹85,000". */
export function formatIndianShort(value: number): string {
  // Round to 2 decimals of a lakh first, so 99,99,999 becomes 1.00CR rather than 100.00L.
  const lakhs = Math.round(value / 1_000) / 100
  if (lakhs >= 100) return `${(Math.round(value / 100_000) / 100).toFixed(2)}CR`
  if (lakhs >= 1) return `${lakhs.toFixed(2)}L`
  return `₹${rupees.format(value)}`
}

export function formatBudgetRange(min: number | null, max: number | null): string {
  if (min === null && max === null) return '—'
  if (min === null || max === null || min === max) return formatIndianShort((min ?? max)!)
  return `${formatIndianShort(min)} – ${formatIndianShort(max)}`
}

function toNumber(value: string | number | null | undefined): number | null {
  if (value === null || value === undefined || value === '') return null
  const n = Number(value)
  return Number.isNaN(n) ? null : n
}

/** "850 (17×50) sq.ft", or "850 sq.ft" without both dimensions. */
export function formatPlotSize(size: { areaSqft: number; widthFt: number | null; lengthFt: number | null }) {
  const dims = size.widthFt && size.lengthFt ? ` (${plain.format(size.widthFt)}×${plain.format(size.lengthFt)})` : ''
  return `${plain.format(size.areaSqft)}${dims} sq.ft`
}

export function formatProjectPlotSizes(project: Project): string {
  if (project.plotSizeMode === PlotSizeMode.RANGE) {
    const min = project.plotAreaMin
    const max = project.plotAreaMax
    if (min === null) return '—'
    return min === max || max === null ? `${plain.format(min)} sq.ft` : `${plain.format(min)}–${plain.format(max)} sq.ft`
  }
  const sizes = project.plotSizes ?? []
  return sizes.length ? sizes.map(formatPlotSize).join(', ') : '—'
}

/** "₹4,700/sq.ft" or "₹5,300–6,000/sq.ft". */
export function formatRate(min: string | number | null, max: string | number | null): string {
  const lo = toNumber(min)
  const hi = toNumber(max)
  if (lo === null && hi === null) return '—'
  if (lo === null || hi === null || lo === hi) return `₹${rupees.format((lo ?? hi)!)}/sq.ft`
  return `₹${rupees.format(lo)}–${rupees.format(hi)}/sq.ft`
}

export function formatProjectBudget(project: Pick<Project, 'budgetMin' | 'budgetMax'>): string {
  return formatBudgetRange(toNumber(project.budgetMin), toNumber(project.budgetMax))
}

export function formatPlc(project: Project): string {
  if (project.plcNa) return 'NA'
  const lo = toNumber(project.plcMinPercent)
  const hi = toNumber(project.plcMaxPercent)
  if (lo === null && hi === null) return '—'
  return lo === null || hi === null || lo === hi ? `${plain.format((lo ?? hi)!)}%` : `${plain.format(lo)}–${plain.format(hi)}%`
}

export function formatEmCharges(project: Project): string {
  switch (project.emChargesStatus) {
    case EmChargesStatus.AMOUNT:
      return formatRate(project.emCharges, project.emCharges)
    case EmChargesStatus.NA:
      return 'NA'
    case EmChargesStatus.OTHERS:
      return project.emChargesNote ?? 'Others'
    default:
      return '—'
  }
}

export function formatGuidelineRate(project: Project): string {
  if (project.guidelineRateNa) return 'NA'
  if (project.guidelineRate === null) return '—'
  return `${project.guidelineRateApprox ? '≈ ' : ''}${formatRate(project.guidelineRate, project.guidelineRate)}`
}

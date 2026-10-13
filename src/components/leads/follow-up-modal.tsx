import { useEffect, useState, type FormEvent, type ReactNode } from 'react'
import { Modal } from '@/components/ui/modal'
import { Field, Input, Label } from '@/components/ui/input'
import { Select, Textarea } from '@/components/ui/select'
import { Button } from '@/components/ui/button'
import { useUpdateLeadFollowUp } from '@/hooks/queries/use-leads'
import {
  BOOKING_STATUS_LABELS,
  LEAD_PURPOSE_LABELS,
  LEAD_TEMPERATURE_LABELS,
  VISIT_STATUS_LABELS,
} from '@/lib/constants'
import { cn, splitPhoneList, toDatetimeLocal } from '@/lib/utils'
import { BookingStatus, LeadPurpose, LeadTemperature, VisitStatus, type Lead } from '@/types'

const TEMPERATURE_OPTIONS = Object.values(LeadTemperature)
const PURPOSE_OPTIONS = Object.values(LeadPurpose)
const VISIT_STATUS_OPTIONS = Object.values(VisitStatus)
const BOOKING_STATUS_OPTIONS = Object.values(BookingStatus)

/** A value that is either one number or a from–to range, as typed into the form. */
interface RangeInput {
  isRange: boolean
  min: string
  max: string
}

function toRangeInput(min: string | number | null | undefined, max: string | number | null | undefined): RangeInput {
  const lo = min != null ? Number(min) : null
  const hi = max != null ? Number(max) : null
  return { isRange: hi !== null && hi !== lo, min: lo !== null ? String(lo) : '', max: hi !== null ? String(hi) : '' }
}

/** The numbers to save: a single value fills both ends. */
function rangeValues(input: RangeInput): { min: number | null; max: number | null } {
  const min = input.min ? Number(input.min) : null
  return { min, max: input.isRange ? (input.max ? Number(input.max) : null) : min }
}

const sameRange = (a: RangeInput, b: RangeInput) => a.isRange === b.isRange && a.min === b.min && a.max === b.max

export function FollowUpModal({ open, onClose, lead }: { open: boolean; onClose: () => void; lead: Lead }) {
  const update = useUpdateLeadFollowUp()

  const [alternatePhones, setAlternatePhones] = useState('')
  const [leadTemperature, setLeadTemperature] = useState<LeadTemperature | ''>('')
  const [purpose, setPurpose] = useState<LeadPurpose | ''>('')
  const [budget, setBudget] = useState<RangeInput>(toRangeInput(null, null))
  const [plotSize, setPlotSize] = useState<RangeInput>(toRangeInput(null, null))
  const [lastContactedAt, setLastContactedAt] = useState('')
  const [nextFollowUpAt, setNextFollowUpAt] = useState('')
  const [siteVisitDate, setSiteVisitDate] = useState('')
  const [visitStatus, setVisitStatus] = useState<VisitStatus | ''>('')
  const [mainObjection, setMainObjection] = useState('')
  const [bookingProbability, setBookingProbability] = useState('')
  const [bookingStatus, setBookingStatus] = useState<BookingStatus | ''>('')
  const [bookingValue, setBookingValue] = useState('')
  const [lostNurtureReason, setLostNurtureReason] = useState('')
  const [remarks, setRemarks] = useState('')

  useEffect(() => {
    if (!open) return
    setAlternatePhones((lead.alternatePhones ?? []).join(', '))
    setLeadTemperature(lead.leadTemperature ?? '')
    setPurpose(lead.purpose ?? '')
    setBudget(toRangeInput(lead.budgetMin, lead.budgetMax))
    setPlotSize(toRangeInput(lead.plotSizeSqFt, lead.plotSizeMaxSqFt))
    setLastContactedAt(toDatetimeLocal(lead.lastContactedAt))
    setNextFollowUpAt(toDatetimeLocal(lead.nextFollowUpAt))
    setSiteVisitDate(toDatetimeLocal(lead.siteVisitDate))
    setVisitStatus(lead.visitStatus ?? '')
    setMainObjection(lead.mainObjection ?? '')
    setBookingProbability(lead.bookingProbability != null ? String(lead.bookingProbability) : '')
    setBookingStatus(lead.bookingStatus ?? '')
    setBookingValue(lead.bookingValue ?? '')
    setLostNurtureReason(lead.lostNurtureReason ?? '')
    setRemarks(lead.remarks ?? '')
  }, [open, lead])

  const alternatePhoneList = splitPhoneList(alternatePhones)
  const alternatePhonesError = alternatePhoneList.some((p) => !/^\+?[0-9]{7,15}$/.test(p))
    ? 'Enter valid numbers, separated by commas'
    : undefined

  const budgetValues = rangeValues(budget)
  const budgetError =
    budgetValues.min !== null && budgetValues.max !== null && budgetValues.min > budgetValues.max
      ? '"To" must be at least "From"'
      : undefined

  const plotValues = rangeValues(plotSize)
  const plotSizeError = !plotSize.isRange
    ? undefined
    : plotValues.max !== null && plotValues.min === null
      ? 'Enter the smallest size too'
      : plotValues.min !== null && plotValues.max !== null && plotValues.min > plotValues.max
        ? '"To" must be at least "From"'
        : undefined

  const onSubmit = (e: FormEvent) => {
    e.preventDefault()
    if (alternatePhonesError || budgetError || plotSizeError) return

    // Sent only when touched, so saving other fields never rewrites them.
    const budgetChanged = !sameRange(budget, toRangeInput(lead.budgetMin, lead.budgetMax))
    const plotSizeChanged = !sameRange(plotSize, toRangeInput(lead.plotSizeSqFt, lead.plotSizeMaxSqFt))

    update.mutate(
      {
        id: lead.id,
        payload: {
          alternatePhones: alternatePhoneList,
          leadTemperature: leadTemperature || undefined,
          purpose: purpose || undefined,
          ...(budgetChanged ? { budgetMin: budgetValues.min, budgetMax: budgetValues.max } : {}),
          ...(plotSizeChanged
            ? { plotSizeSqFt: plotValues.min, plotSizeMaxSqFt: plotSize.isRange ? plotValues.max : null }
            : {}),
          lastContactedAt: lastContactedAt ? new Date(lastContactedAt).toISOString() : undefined,
          nextFollowUpAt: nextFollowUpAt ? new Date(nextFollowUpAt).toISOString() : undefined,
          siteVisitDate: siteVisitDate ? new Date(siteVisitDate).toISOString() : undefined,
          visitStatus: visitStatus || undefined,
          mainObjection: mainObjection.trim() || undefined,
          bookingProbability: bookingProbability ? Number(bookingProbability) : undefined,
          bookingStatus: bookingStatus || undefined,
          bookingValue: bookingValue ? Number(bookingValue) : undefined,
          lostNurtureReason: lostNurtureReason.trim() || undefined,
          remarks: remarks.trim() || undefined,
        },
      },
      { onSuccess: onClose },
    )
  }

  return (
    <Modal open={open} onClose={onClose} title="Follow-up & booking details" subtitle={lead.fullName} size="lg">
      <form onSubmit={onSubmit} className="flex flex-col gap-4">
        <Field label="Other numbers" error={alternatePhonesError} hint={`Main number: ${lead.phone}. Separate extra numbers with commas.`}>
          <Input value={alternatePhones} onChange={(e) => setAlternatePhones(e.target.value)} placeholder="9123456789, 9000000001" />
        </Field>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <Field label="Lead temperature">
            <Select value={leadTemperature} onChange={(e) => setLeadTemperature(e.target.value as LeadTemperature)}>
              <option value="">Not set</option>
              {TEMPERATURE_OPTIONS.map((t) => (
                <option key={t} value={t}>
                  {LEAD_TEMPERATURE_LABELS[t]}
                </option>
              ))}
            </Select>
          </Field>

          <Field label="Purpose">
            <Select value={purpose} onChange={(e) => setPurpose(e.target.value as LeadPurpose)}>
              <option value="">Not set</option>
              {PURPOSE_OPTIONS.map((p) => (
                <option key={p} value={p}>
                  {LEAD_PURPOSE_LABELS[p]}
                </option>
              ))}
            </Select>
          </Field>

          <RangeField label="Budget (₹)" value={budget} onChange={setBudget} error={budgetError} />

          <RangeField label="Plot size (sq ft)" value={plotSize} onChange={setPlotSize} error={plotSizeError} />

          <Field label="Last contacted">
            <Input type="datetime-local" value={lastContactedAt} onChange={(e) => setLastContactedAt(e.target.value)} />
          </Field>

          <Field label="Next follow-up">
            <Input type="datetime-local" value={nextFollowUpAt} onChange={(e) => setNextFollowUpAt(e.target.value)} />
          </Field>

          <Field label="Site visit date">
            <Input type="datetime-local" value={siteVisitDate} onChange={(e) => setSiteVisitDate(e.target.value)} />
          </Field>

          <Field label="Visit status">
            <Select value={visitStatus} onChange={(e) => setVisitStatus(e.target.value as VisitStatus)}>
              <option value="">Not set</option>
              {VISIT_STATUS_OPTIONS.map((v) => (
                <option key={v} value={v}>
                  {VISIT_STATUS_LABELS[v]}
                </option>
              ))}
            </Select>
          </Field>

          <Field label="Booking probability (%)">
            <Input type="number" min="0" max="100" value={bookingProbability} onChange={(e) => setBookingProbability(e.target.value)} />
          </Field>

          <Field label="Booking status">
            <Select value={bookingStatus} onChange={(e) => setBookingStatus(e.target.value as BookingStatus)}>
              <option value="">Not set</option>
              {BOOKING_STATUS_OPTIONS.map((b) => (
                <option key={b} value={b}>
                  {BOOKING_STATUS_LABELS[b]}
                </option>
              ))}
            </Select>
          </Field>

          <Field label="Booking value (₹)">
            <Input type="number" min="0" value={bookingValue} onChange={(e) => setBookingValue(e.target.value)} />
          </Field>
        </div>

        <Field label="Main objection">
          <Textarea value={mainObjection} onChange={(e) => setMainObjection(e.target.value)} placeholder="e.g. Price is above their budget" />
        </Field>

        <Field label="Lost / nurture reason">
          <Textarea value={lostNurtureReason} onChange={(e) => setLostNurtureReason(e.target.value)} placeholder="Why this lead was lost, or why it's being nurtured" />
        </Field>

        <Field label="Remarks">
          <Textarea value={remarks} onChange={(e) => setRemarks(e.target.value)} placeholder="Any other notes" />
        </Field>

        <div className="flex justify-end gap-2 pt-2">
          <Button type="button" variant="ghost" onClick={onClose} disabled={update.isPending}>
            Cancel
          </Button>
          <Button type="submit" loading={update.isPending}>
            Save
          </Button>
        </div>
      </form>
    </Modal>
  )
}

/** A number field with a "Range" button that turns it into a from–to pair. */
function RangeField({
  label,
  value,
  onChange,
  error,
}: {
  label: string
  value: RangeInput
  onChange: (value: RangeInput) => void
  error?: string
}) {
  const input = (key: 'min' | 'max', placeholder?: string): ReactNode => (
    <Input
      type="number"
      min="0"
      step="any"
      value={value[key]}
      onChange={(e) => onChange({ ...value, [key]: e.target.value })}
      placeholder={placeholder}
      error={!!error}
      aria-label={placeholder ? `${label} — ${placeholder.toLowerCase()}` : label}
    />
  )

  return (
    <div className="flex flex-col">
      <div className="mb-1.5 flex items-center justify-between gap-2">
        <Label className="mb-0">{label}</Label>
        <button
          type="button"
          aria-pressed={value.isRange}
          onClick={() => onChange({ ...value, isRange: !value.isRange })}
          title={value.isRange ? 'Switch back to a single value' : 'Enter a from–to range instead'}
          className={cn(
            'rounded-md px-2 py-0.5 text-xs font-medium ring-1 ring-inset transition-colors',
            value.isRange
              ? 'bg-brand-600 text-white ring-brand-600'
              : 'bg-white text-slate-600 ring-slate-200 hover:bg-slate-50',
          )}
        >
          Range
        </button>
      </div>
      {value.isRange ? (
        <div className="grid grid-cols-2 gap-2">
          {input('min', 'From')}
          {input('max', 'To')}
        </div>
      ) : (
        input('min')
      )}
      {error && <p className="mt-1 text-xs font-medium text-rose-600">{error}</p>}
    </div>
  )
}

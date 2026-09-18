import { useEffect, useState, type FormEvent } from 'react'
import { Modal } from '@/components/ui/modal'
import { Field, Input } from '@/components/ui/input'
import { Select, Textarea } from '@/components/ui/select'
import { Button } from '@/components/ui/button'
import { useUpdateLeadFollowUp } from '@/hooks/queries/use-leads'
import {
  BOOKING_STATUS_LABELS,
  LEAD_PURPOSE_LABELS,
  LEAD_TEMPERATURE_LABELS,
  VISIT_STATUS_LABELS,
} from '@/lib/constants'
import { toDatetimeLocal } from '@/lib/utils'
import { BookingStatus, LeadPurpose, LeadTemperature, VisitStatus, type Lead } from '@/types'

const TEMPERATURE_OPTIONS = Object.values(LeadTemperature)
const PURPOSE_OPTIONS = Object.values(LeadPurpose)
const VISIT_STATUS_OPTIONS = Object.values(VisitStatus)
const BOOKING_STATUS_OPTIONS = Object.values(BookingStatus)

export function FollowUpModal({ open, onClose, lead }: { open: boolean; onClose: () => void; lead: Lead }) {
  const update = useUpdateLeadFollowUp()

  const [leadTemperature, setLeadTemperature] = useState<LeadTemperature | ''>('')
  const [purpose, setPurpose] = useState<LeadPurpose | ''>('')
  const [plotSizeSqFt, setPlotSizeSqFt] = useState('')
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
    setLeadTemperature(lead.leadTemperature ?? '')
    setPurpose(lead.purpose ?? '')
    setPlotSizeSqFt(lead.plotSizeSqFt != null ? String(lead.plotSizeSqFt) : '')
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

  const onSubmit = (e: FormEvent) => {
    e.preventDefault()

    update.mutate(
      {
        id: lead.id,
        payload: {
          leadTemperature: leadTemperature || undefined,
          purpose: purpose || undefined,
          plotSizeSqFt: plotSizeSqFt ? Number(plotSizeSqFt) : undefined,
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

          <Field label="Plot size (sq ft)">
            <Input type="number" min="0" value={plotSizeSqFt} onChange={(e) => setPlotSizeSqFt(e.target.value)} />
          </Field>

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

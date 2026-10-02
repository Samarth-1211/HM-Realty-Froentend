import { useEffect } from 'react'
import { zodResolver } from '@hookform/resolvers/zod'
import { useForm } from 'react-hook-form'
import { z } from 'zod'
import { Modal } from '@/components/ui/modal'
import { Field, Input } from '@/components/ui/input'
import { Select } from '@/components/ui/select'
import { Button } from '@/components/ui/button'
import { useUpdateLead } from '@/hooks/queries/use-leads'
import { useProjects } from '@/hooks/queries/use-projects'
import type { UpdateLeadDetailsPayload } from '@/api/leads.api'
import { formatLeadNumber, splitPhoneList } from '@/lib/utils'
import type { Lead } from '@/types'

const PHONE = /^\+?[0-9]{7,15}$/
const amount = z
  .string()
  .optional()
  .refine((v) => !v || (/^\d+(\.\d{1,2})?$/.test(v) && Number(v) >= 0), 'Enter an amount in ₹')

const schema = z
  .object({
    fullName: z.string().trim().min(1, 'Required'),
    phone: z.string().min(1, 'Required').regex(PHONE, 'Enter a valid phone number'),
    alternatePhones: z
      .string()
      .optional()
      .refine((v) => splitPhoneList(v ?? '').every((p) => PHONE.test(p)), 'Enter valid numbers, separated by commas'),
    email: z.string().email('Enter a valid email').optional().or(z.literal('')),
    projectId: z.string().optional(),
    propertyInterest: z.string().optional(),
    unitType: z.string().optional(),
    city: z.string().optional(),
    budgetMin: amount,
    budgetMax: amount,
    referredByName: z.string().optional(),
    referredByEmail: z.string().email('Enter a valid email').optional().or(z.literal('')),
    referredByPhone: z.string().regex(PHONE, 'Enter a valid phone number').optional().or(z.literal('')),
  })
  .refine((v) => !v.budgetMin || !v.budgetMax || Number(v.budgetMin) <= Number(v.budgetMax), {
    path: ['budgetMax'],
    message: 'Must be at least the minimum',
  })
type FormValues = z.infer<typeof schema>

function toForm(lead: Lead): FormValues {
  return {
    fullName: lead.fullName,
    phone: lead.phone,
    alternatePhones: (lead.alternatePhones ?? []).join(', '),
    email: lead.email ?? '',
    projectId: lead.projectId ?? '',
    propertyInterest: lead.propertyInterest ?? '',
    unitType: lead.unitType ?? '',
    city: lead.city ?? '',
    budgetMin: lead.budgetMin != null ? String(Number(lead.budgetMin)) : '',
    budgetMax: lead.budgetMax != null ? String(Number(lead.budgetMax)) : '',
    referredByName: lead.referredByName ?? '',
    referredByEmail: lead.referredByEmail ?? '',
    referredByPhone: lead.referredByPhone ?? '',
  }
}

/** Only the fields that changed — blanks become `null` so the server clears them. */
function changedFields(before: FormValues, after: FormValues): UpdateLeadDetailsPayload {
  const payload: UpdateLeadDetailsPayload = {}
  const text = (v: string | undefined) => (v?.trim() ? v.trim() : null)
  const num = (v: string | undefined) => (v ? Number(v) : null)

  if (after.fullName.trim() !== before.fullName) payload.fullName = after.fullName.trim()
  if (after.phone !== before.phone) payload.phone = after.phone
  if (after.alternatePhones !== before.alternatePhones) payload.alternatePhones = splitPhoneList(after.alternatePhones ?? '')
  if (after.email !== before.email) payload.email = text(after.email)
  if (after.projectId !== before.projectId) payload.projectId = after.projectId || null
  if (after.propertyInterest !== before.propertyInterest) payload.propertyInterest = text(after.propertyInterest)
  if (after.unitType !== before.unitType) payload.unitType = text(after.unitType)
  if (after.city !== before.city) payload.city = text(after.city)
  if (after.budgetMin !== before.budgetMin) payload.budgetMin = num(after.budgetMin)
  if (after.budgetMax !== before.budgetMax) payload.budgetMax = num(after.budgetMax)
  if (after.referredByName !== before.referredByName) payload.referredByName = text(after.referredByName)
  if (after.referredByEmail !== before.referredByEmail) payload.referredByEmail = text(after.referredByEmail)
  if (after.referredByPhone !== before.referredByPhone) payload.referredByPhone = text(after.referredByPhone)
  return payload
}

/**
 * Edits a lead's own details. Admins can edit any lead; Managers the
 * manually added and Excel-uploaded leads in their team. The Admins are
 * notified of what changed.
 */
export function LeadEditModal({ lead, onClose }: { lead: Lead | null; onClose: () => void }) {
  const update = useUpdateLead()
  const { data: projects } = useProjects(!!lead)

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<FormValues>({ resolver: zodResolver(schema) })

  useEffect(() => {
    if (lead) reset(toForm(lead))
  }, [lead, reset])

  if (!lead) return null
  const initial = toForm(lead)

  const onSubmit = (values: FormValues) => {
    const payload = changedFields(initial, values)
    if (Object.keys(payload).length === 0) {
      onClose()
      return
    }
    update.mutate({ id: lead.id, payload }, { onSuccess: onClose })
  }

  // The lead's current project stays selectable even if it's no longer in the list.
  const projectOptions = [
    ...(projects ?? []).map((p) => ({ id: p.id, name: p.name })),
    ...(lead.project && !(projects ?? []).some((p) => p.id === lead.project!.id) ? [lead.project] : []),
  ]

  return (
    <Modal
      open
      onClose={onClose}
      title={`Edit ${lead.fullName}`}
      subtitle={`${formatLeadNumber(lead.leadNumber)} · Admins are notified of what you change`}
      size="md"
    >
      <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-4">
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <Field label="Full name" error={errors.fullName?.message} required>
            <Input {...register('fullName')} />
          </Field>
          <Field label="Phone" error={errors.phone?.message} required>
            <Input {...register('phone')} inputMode="tel" />
          </Field>
          <Field label="Other numbers" error={errors.alternatePhones?.message} hint="Separate with commas.">
            <Input {...register('alternatePhones')} inputMode="tel" />
          </Field>
          <Field label="Email" error={errors.email?.message}>
            <Input {...register('email')} type="email" />
          </Field>
          <Field label="Project">
            <Select {...register('projectId')}>
              <option value="">No project</option>
              {projectOptions.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.name}
                </option>
              ))}
            </Select>
          </Field>
          <Field label="Property interest" error={errors.propertyInterest?.message}>
            <Input {...register('propertyInterest')} />
          </Field>
          <Field label="Unit type" error={errors.unitType?.message}>
            <Input {...register('unitType')} placeholder="e.g. 3BHK, 200 sq. yd. plot" />
          </Field>
          <Field label="City" error={errors.city?.message}>
            <Input {...register('city')} />
          </Field>
          <Field label="Budget from (₹)" error={errors.budgetMin?.message}>
            <Input {...register('budgetMin')} inputMode="decimal" />
          </Field>
          <Field label="Budget up to (₹)" error={errors.budgetMax?.message}>
            <Input {...register('budgetMax')} inputMode="decimal" />
          </Field>
        </div>

        <div className="rounded-xl border border-slate-100 p-3.5">
          <p className="mb-3 text-sm font-medium text-slate-600">Reference</p>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
            <Field label="Referrer name" error={errors.referredByName?.message}>
              <Input {...register('referredByName')} />
            </Field>
            <Field label="Referrer email" error={errors.referredByEmail?.message}>
              <Input {...register('referredByEmail')} type="email" />
            </Field>
            <Field label="Referrer phone" error={errors.referredByPhone?.message}>
              <Input {...register('referredByPhone')} inputMode="tel" />
            </Field>
          </div>
        </div>

        <div className="flex justify-end gap-2 pt-1">
          <Button type="button" variant="ghost" onClick={onClose}>
            Cancel
          </Button>
          <Button type="submit" loading={update.isPending}>
            Save changes
          </Button>
        </div>
      </form>
    </Modal>
  )
}

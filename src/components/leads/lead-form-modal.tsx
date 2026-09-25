import { useEffect, useState } from 'react'
import { useNavigate } from '@tanstack/react-router'
import { zodResolver } from '@hookform/resolvers/zod'
import { useForm } from 'react-hook-form'
import { ChevronDown, ChevronRight } from 'lucide-react'
import { z } from 'zod'
import { Modal } from '@/components/ui/modal'
import { Field, Input } from '@/components/ui/input'
import { Select } from '@/components/ui/select'
import { Button } from '@/components/ui/button'
import { useCreateLead } from '@/hooks/queries/use-leads'
import { useUsers } from '@/hooks/queries/use-users'
import { useAuthStore } from '@/store/auth-store'
import { ASSIGNER_ROLES, STAFF_ROLES } from '@/lib/constants'

const schema = z.object({
  fullName: z.string().min(1, 'Required'),
  phone: z
    .string()
    .min(1, 'Required')
    .regex(/^\+?[0-9]{7,15}$/, 'Enter a valid phone number'),
  email: z.string().email('Enter a valid email').optional().or(z.literal('')),
  propertyInterest: z.string().optional(),
  assignedToId: z.string().optional(),
  referredByName: z.string().optional(),
  referredByEmail: z.string().email('Enter a valid email').optional().or(z.literal('')),
  referredByPhone: z
    .string()
    .regex(/^\+?[0-9]{7,15}$/, 'Enter a valid phone number')
    .optional()
    .or(z.literal('')),
})
type FormValues = z.infer<typeof schema>

export function LeadFormModal({ open, onClose }: { open: boolean; onClose: () => void }) {
  const currentUser = useAuthStore((s) => s.user)
  const canAssign = currentUser && ASSIGNER_ROLES.includes(currentUser.role)
  const { data: users } = useUsers(!!canAssign)
  const create = useCreateLead()
  const navigate = useNavigate()
  const [showReference, setShowReference] = useState(false)

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<FormValues>({ resolver: zodResolver(schema) })

  useEffect(() => {
    if (open) {
      reset({
        fullName: '',
        phone: '',
        email: '',
        propertyInterest: '',
        assignedToId: '',
        referredByName: '',
        referredByEmail: '',
        referredByPhone: '',
      })
      setShowReference(false)
    }
  }, [open, reset])

  const onSubmit = (values: FormValues) => {
    create.mutate(
      {
        fullName: values.fullName,
        phone: values.phone,
        email: values.email || undefined,
        propertyInterest: values.propertyInterest || undefined,
        assignedToId: values.assignedToId || undefined,
        referredByName: values.referredByName || undefined,
        referredByEmail: values.referredByEmail || undefined,
        referredByPhone: values.referredByPhone || undefined,
      },
      {
        onSuccess: (lead) => {
          onClose()
          // Phone number already belonged to a lead — take the user to it.
          if (lead.deduplicated) navigate({ to: '/leads/$leadId', params: { leadId: lead.id } })
        },
      },
    )
  }

  const candidates = (users ?? []).filter((u) => STAFF_ROLES.includes(u.role) && u.isActive)

  return (
    <Modal open={open} onClose={onClose} title="Add lead" subtitle="Capture a walk-in or manually sourced lead" size="sm">
      <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-4">
        <Field label="Full name" error={errors.fullName?.message} required>
          <Input {...register('fullName')} placeholder="Ravi Kumar" />
        </Field>
        <Field label="Phone" error={errors.phone?.message} required hint="e.g. +919876543210">
          <Input {...register('phone')} placeholder="+919876543210" />
        </Field>
        <Field label="Email" error={errors.email?.message}>
          <Input {...register('email')} placeholder="ravi.kumar@example.com" />
        </Field>
        <Field label="Property interest" error={errors.propertyInterest?.message}>
          <Input {...register('propertyInterest')} placeholder="3BHK Apartment in Bandra" />
        </Field>
        {canAssign && (
          <Field label="Assign to" hint="Leave blank to auto-allocate to the least-loaded agent">
            <Select {...register('assignedToId')}>
              <option value="">Auto-allocate</option>
              {candidates.map((u) => (
                <option key={u.id} value={u.id}>
                  {u.firstName} {u.lastName} ({u.role})
                </option>
              ))}
            </Select>
          </Field>
        )}

        <div className="rounded-xl border border-slate-100">
          <button
            type="button"
            onClick={() => setShowReference((v) => !v)}
            className="flex w-full items-center gap-1.5 px-3.5 py-2.5 text-left text-sm font-medium text-slate-600"
          >
            {showReference ? <ChevronDown className="size-4" /> : <ChevronRight className="size-4" />}
            Reference (optional)
          </button>
          {showReference && (
            <div className="flex flex-col gap-4 border-t border-slate-100 p-3.5">
              <p className="text-xs text-slate-400">Who referred this lead in? Shown on the lead's detail page.</p>
              <Field label="Referrer name" error={errors.referredByName?.message}>
                <Input {...register('referredByName')} placeholder="Suresh Mehta" />
              </Field>
              <Field label="Referrer email" error={errors.referredByEmail?.message}>
                <Input {...register('referredByEmail')} placeholder="suresh.mehta@example.com" />
              </Field>
              <Field label="Referrer phone" error={errors.referredByPhone?.message}>
                <Input {...register('referredByPhone')} placeholder="+919876500000" />
              </Field>
            </div>
          )}
        </div>

        <div className="flex justify-end gap-2 pt-2">
          <Button type="button" variant="ghost" onClick={onClose}>
            Cancel
          </Button>
          <Button type="submit" loading={create.isPending}>
            Add lead
          </Button>
        </div>
      </form>
    </Modal>
  )
}

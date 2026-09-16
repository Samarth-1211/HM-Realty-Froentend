import { useEffect } from 'react'
import { zodResolver } from '@hookform/resolvers/zod'
import { useForm } from 'react-hook-form'
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
})
type FormValues = z.infer<typeof schema>

export function LeadFormModal({ open, onClose }: { open: boolean; onClose: () => void }) {
  const currentUser = useAuthStore((s) => s.user)
  const canAssign = currentUser && ASSIGNER_ROLES.includes(currentUser.role)
  const { data: users } = useUsers(!!canAssign)
  const create = useCreateLead()

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<FormValues>({ resolver: zodResolver(schema) })

  useEffect(() => {
    if (open) reset({ fullName: '', phone: '', email: '', propertyInterest: '', assignedToId: '' })
  }, [open, reset])

  const onSubmit = (values: FormValues) => {
    create.mutate(
      {
        fullName: values.fullName,
        phone: values.phone,
        email: values.email || undefined,
        propertyInterest: values.propertyInterest || undefined,
        assignedToId: values.assignedToId || undefined,
      },
      { onSuccess: onClose },
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

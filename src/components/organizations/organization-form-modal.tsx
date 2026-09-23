import { useEffect } from 'react'
import { zodResolver } from '@hookform/resolvers/zod'
import { useForm } from 'react-hook-form'
import { z } from 'zod'
import { Modal } from '@/components/ui/modal'
import { Field, Input } from '@/components/ui/input'
import { Select } from '@/components/ui/select'
import { Button } from '@/components/ui/button'
import { useCreateOrganization, useUpdateOrganization } from '@/hooks/queries/use-organizations'
import { SubscriptionPlan } from '@/types'
import { formatEnumLabel } from '@/lib/utils'
import type { Organization } from '@/types'

const orgFields = {
  name: z.string().min(1, 'Required'),
  contactEmail: z.string().min(1, 'Required').email('Enter a valid email'),
  contactPhone: z.string().optional(),
  address: z.string().optional(),
  gstNumber: z.string().optional(),
  plan: z.enum(Object.values(SubscriptionPlan) as [string, ...string[]]).optional(),
  maxUsers: z.coerce.number().int().min(1).optional(),
  maxLeadsPerMonth: z.coerce.number().int().min(1).optional(),
}

const baseSchema = z.object({
  ...orgFields,
  adminFirstName: z.string().optional(),
  adminLastName: z.string().optional(),
  adminEmail: z.string().optional(),
  adminPassword: z.string().optional(),
})

// The first admin is mandatory when creating — they are the recipient of the
// welcome + verification email, and the organization stays pending until they
// click its link. Editing an existing org never touches its admins, so the
// same fields are skipped there (the block isn't even rendered).
const schemaFor = (isEdit: boolean) =>
  baseSchema.superRefine((values, ctx) => {
    if (isEdit) return

    const required = [
      ['adminFirstName', values.adminFirstName, 'Required'],
      ['adminLastName', values.adminLastName, 'Required'],
      ['adminEmail', values.adminEmail, 'Required'],
    ] as const
    for (const [path, value, message] of required) {
      if (!value?.trim()) ctx.addIssue({ code: z.ZodIssueCode.custom, path: [path], message })
    }

    if (values.adminEmail?.trim() && !z.string().email().safeParse(values.adminEmail).success) {
      ctx.addIssue({ code: z.ZodIssueCode.custom, path: ['adminEmail'], message: 'Enter a valid email' })
    }
    if ((values.adminPassword ?? '').length < 8) {
      ctx.addIssue({ code: z.ZodIssueCode.custom, path: ['adminPassword'], message: 'Min 8 characters' })
    }
  })

type FormValues = z.input<typeof baseSchema>
type FormOutput = z.output<typeof baseSchema>

export function OrganizationFormModal({
  open,
  onClose,
  organization,
}: {
  open: boolean
  onClose: () => void
  organization?: Organization | null
}) {
  const isEdit = !!organization
  const create = useCreateOrganization()
  const update = useUpdateOrganization()

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<FormValues, unknown, FormOutput>({ resolver: zodResolver(schemaFor(isEdit)) })

  useEffect(() => {
    if (open) {
      reset(
        organization
          ? {
              name: organization.name,
              contactEmail: organization.contactEmail,
              contactPhone: organization.contactPhone ?? '',
              address: organization.address ?? '',
              gstNumber: organization.gstNumber ?? '',
              plan: organization.plan,
              maxUsers: organization.maxUsers,
              maxLeadsPerMonth: organization.maxLeadsPerMonth,
            }
          : { plan: SubscriptionPlan.TRIAL },
      )
    }
  }, [open, organization, reset])

  const onSubmit = (values: FormOutput) => {
    if (isEdit) {
      update.mutate(
        {
          id: organization.id,
          payload: {
            name: values.name,
            contactEmail: values.contactEmail,
            contactPhone: values.contactPhone || undefined,
            address: values.address || undefined,
            gstNumber: values.gstNumber || undefined,
            plan: values.plan as typeof SubscriptionPlan[keyof typeof SubscriptionPlan],
            maxUsers: values.maxUsers,
            maxLeadsPerMonth: values.maxLeadsPerMonth,
          },
        },
        { onSuccess: onClose },
      )
    } else {
      create.mutate(
        {
          name: values.name,
          contactEmail: values.contactEmail,
          contactPhone: values.contactPhone || undefined,
          address: values.address || undefined,
          gstNumber: values.gstNumber || undefined,
          plan: values.plan as typeof SubscriptionPlan[keyof typeof SubscriptionPlan],
          maxUsers: values.maxUsers,
          maxLeadsPerMonth: values.maxLeadsPerMonth,
          // Non-null: schemaFor(false) rejects the submit unless all four are set.
          admin: {
            adminEmail: values.adminEmail!,
            adminPassword: values.adminPassword!,
            adminFirstName: values.adminFirstName!,
            adminLastName: values.adminLastName!,
          },
        },
        { onSuccess: onClose },
      )
    }
  }

  const isPending = create.isPending || update.isPending

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={isEdit ? 'Edit organization' : 'New organization'}
      subtitle={isEdit ? organization?.name : 'Onboard a new tenant onto the platform'}
      size="lg"
    >
      <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-4">
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <Field label="Organization name" error={errors.name?.message} required>
            <Input {...register('name')} placeholder="Aakash Real Estate" />
          </Field>
          <Field label="Contact email" error={errors.contactEmail?.message} required>
            <Input {...register('contactEmail')} placeholder="contact@aakashrealty.com" />
          </Field>
          <Field label="Contact phone" error={errors.contactPhone?.message}>
            <Input {...register('contactPhone')} placeholder="+91 98765 43210" />
          </Field>
          <Field label="GST number" error={errors.gstNumber?.message}>
            <Input {...register('gstNumber')} placeholder="23AAAAA0000A1Z5" />
          </Field>
          <Field label="Plan" error={errors.plan?.message} className="sm:col-span-2">
            <Select {...register('plan')}>
              {Object.values(SubscriptionPlan).map((p) => (
                <option key={p} value={p}>
                  {formatEnumLabel(p)}
                </option>
              ))}
            </Select>
          </Field>
          <Field label="Address" className="sm:col-span-2">
            <Input {...register('address')} placeholder="MG Road, Indore, MP" />
          </Field>
          <Field label="Max users" error={errors.maxUsers?.message}>
            <Input type="number" min={1} {...register('maxUsers')} placeholder="20" />
          </Field>
          <Field label="Max leads / month" error={errors.maxLeadsPerMonth?.message}>
            <Input type="number" min={1} {...register('maxLeadsPerMonth')} placeholder="500" />
          </Field>
        </div>

        {!isEdit && (
          <div className="rounded-xl border border-dashed border-slate-200 p-4">
            <p className="mb-3 text-xs font-semibold uppercase tracking-wide text-slate-400">
              First admin
            </p>
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <Field label="Admin first name" error={errors.adminFirstName?.message} required>
                <Input {...register('adminFirstName')} placeholder="Aakash" />
              </Field>
              <Field label="Admin last name" error={errors.adminLastName?.message} required>
                <Input {...register('adminLastName')} placeholder="Sharma" />
              </Field>
              <Field label="Admin email" error={errors.adminEmail?.message} required>
                <Input {...register('adminEmail')} placeholder="admin@aakashrealty.com" />
              </Field>
              <Field label="Admin temporary password" error={errors.adminPassword?.message} required>
                <Input type="password" {...register('adminPassword')} placeholder="Min 8 characters" />
              </Field>
            </div>
            <p className="mt-3 text-xs text-slate-400">
              The admin is emailed their credentials and a verification link the moment you create the
              organization — it stays pending until they verify.
            </p>
          </div>
        )}

        <div className="flex justify-end gap-2 pt-2">
          <Button type="button" variant="ghost" onClick={onClose}>
            Cancel
          </Button>
          <Button type="submit" loading={isPending}>
            {isEdit ? 'Save changes' : 'Create organization'}
          </Button>
        </div>
      </form>
    </Modal>
  )
}

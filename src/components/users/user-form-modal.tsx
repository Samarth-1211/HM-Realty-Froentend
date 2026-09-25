import { useEffect } from 'react'
import { zodResolver } from '@hookform/resolvers/zod'
import { useForm } from 'react-hook-form'
import { z } from 'zod'
import { Modal } from '@/components/ui/modal'
import { Field, Input } from '@/components/ui/input'
import { Select } from '@/components/ui/select'
import { Button } from '@/components/ui/button'
import { useCreateUser } from '@/hooks/queries/use-users'
import { CREATION_MATRIX } from '@/lib/constants'
import { formatRoleLabel } from '@/lib/utils'
import type { UserRole } from '@/types'

const schema = z.object({
  firstName: z.string().min(1, 'Required'),
  lastName: z.string().min(1, 'Required'),
  email: z.string().min(1, 'Required').email('Enter a valid email'),
  phone: z
    .string()
    .trim()
    .min(1, 'Required')
    .regex(/^\+?[0-9]{7,15}$/, 'Enter a valid mobile number'),
  password: z.string().min(8, 'Min 8 characters'),
  role: z.string().min(1, 'Required'),
})
type FormValues = z.infer<typeof schema>

export function UserFormModal({
  open,
  onClose,
  actorRole,
}: {
  open: boolean
  onClose: () => void
  actorRole: UserRole
}) {
  const create = useCreateUser()
  const allowedRoles = CREATION_MATRIX[actorRole]

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<FormValues>({ resolver: zodResolver(schema), defaultValues: { role: allowedRoles[0] } })

  useEffect(() => {
    if (open) reset({ firstName: '', lastName: '', email: '', phone: '', password: '', role: allowedRoles[0] })
  }, [open, reset, allowedRoles])

  const onSubmit = (values: FormValues) => {
    create.mutate({ ...values, role: values.role as UserRole }, { onSuccess: onClose })
  }

  return (
    <Modal open={open} onClose={onClose} title="New user" subtitle="Create a user within your organization" size="sm">
      <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-4">
        <Field label="First name" error={errors.firstName?.message} required>
          <Input {...register('firstName')} />
        </Field>
        <Field label="Last name" error={errors.lastName?.message} required>
          <Input {...register('lastName')} />
        </Field>
        <Field label="Email" error={errors.email?.message} required>
          <Input {...register('email')} />
        </Field>
        <Field label="Mobile number" error={errors.phone?.message} required>
          <Input type="tel" placeholder="+919876543210" {...register('phone')} />
        </Field>
        <Field label="Password" error={errors.password?.message} required hint="Minimum 8 characters">
          <Input type="password" {...register('password')} />
        </Field>
        <Field label="Role" error={errors.role?.message} required>
          <Select {...register('role')}>
            {allowedRoles.map((r) => (
              <option key={r} value={r}>
                {formatRoleLabel(r)}
              </option>
            ))}
          </Select>
        </Field>
        <div className="flex justify-end gap-2 pt-2">
          <Button type="button" variant="ghost" onClick={onClose}>
            Cancel
          </Button>
          <Button type="submit" loading={create.isPending}>
            Create user
          </Button>
        </div>
      </form>
    </Modal>
  )
}

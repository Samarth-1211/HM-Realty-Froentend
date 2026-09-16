import { useEffect } from 'react'
import { zodResolver } from '@hookform/resolvers/zod'
import { useForm } from 'react-hook-form'
import { z } from 'zod'
import { Modal } from '@/components/ui/modal'
import { Field, Input } from '@/components/ui/input'
import { Select } from '@/components/ui/select'
import { Button } from '@/components/ui/button'
import { useCreateTeamMember } from '@/hooks/queries/use-team'
import { STAFF_ROLES } from '@/lib/constants'
import { formatRoleLabel } from '@/lib/utils'

const schema = z.object({
  firstName: z.string().min(1, 'Required'),
  lastName: z.string().min(1, 'Required'),
  email: z.string().min(1, 'Required').email('Enter a valid email'),
  password: z.string().min(8, 'Min 8 characters'),
  role: z.enum(['AGENT', 'PRESALES', 'POSTSALES']),
})
type FormValues = z.infer<typeof schema>

export function TeamMemberCreateModal({ open, onClose }: { open: boolean; onClose: () => void }) {
  const create = useCreateTeamMember()

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<FormValues>({ resolver: zodResolver(schema), defaultValues: { role: 'AGENT' } })

  useEffect(() => {
    if (open) reset({ firstName: '', lastName: '', email: '', password: '', role: 'AGENT' })
  }, [open, reset])

  const onSubmit = (values: FormValues) => {
    create.mutate(values, { onSuccess: onClose })
  }

  return (
    <Modal open={open} onClose={onClose} title="New team member" subtitle="Add a presales, postsales or agent" size="sm">
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
        <Field label="Password" error={errors.password?.message} required hint="Minimum 8 characters">
          <Input type="password" {...register('password')} />
        </Field>
        <Field label="Role" error={errors.role?.message} required>
          <Select {...register('role')}>
            {STAFF_ROLES.map((r) => (
              <option key={r} value={r}>
                {formatRoleLabel(r)}
              </option>
            ))}
          </Select>
        </Field>
        <p className="text-xs text-slate-400">
          You can assign this member to a project afterwards from their detail view.
        </p>
        <div className="flex justify-end gap-2 pt-2">
          <Button type="button" variant="ghost" onClick={onClose}>
            Cancel
          </Button>
          <Button type="submit" loading={create.isPending}>
            Add member
          </Button>
        </div>
      </form>
    </Modal>
  )
}

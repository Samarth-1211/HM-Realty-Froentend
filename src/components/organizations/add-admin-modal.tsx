import { zodResolver } from '@hookform/resolvers/zod'
import { useForm } from 'react-hook-form'
import { z } from 'zod'
import { Modal } from '@/components/ui/modal'
import { Field, Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { useAddOrgAdmin } from '@/hooks/queries/use-organizations'

const schema = z.object({
  adminFirstName: z.string().min(1, 'Required'),
  adminLastName: z.string().min(1, 'Required'),
  adminEmail: z.string().min(1, 'Required').email('Enter a valid email'),
  adminPassword: z.string().min(8, 'Min 8 characters'),
})
type FormValues = z.infer<typeof schema>

export function AddAdminModal({
  open,
  onClose,
  organizationId,
  organizationName,
}: {
  open: boolean
  onClose: () => void
  organizationId: string
  organizationName: string
}) {
  const addAdmin = useAddOrgAdmin()
  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<FormValues>({ resolver: zodResolver(schema) })

  const onSubmit = (values: FormValues) => {
    addAdmin.mutate(
      { id: organizationId, payload: values },
      {
        onSuccess: () => {
          reset()
          onClose()
        },
      },
    )
  }

  return (
    <Modal open={open} onClose={onClose} title="Add admin" subtitle={organizationName} size="sm">
      <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-4">
        <Field label="First name" error={errors.adminFirstName?.message} required>
          <Input {...register('adminFirstName')} />
        </Field>
        <Field label="Last name" error={errors.adminLastName?.message} required>
          <Input {...register('adminLastName')} />
        </Field>
        <Field label="Email" error={errors.adminEmail?.message} required>
          <Input {...register('adminEmail')} />
        </Field>
        <Field label="Password" error={errors.adminPassword?.message} required hint="Minimum 8 characters">
          <Input type="password" {...register('adminPassword')} />
        </Field>
        <div className="flex justify-end gap-2 pt-2">
          <Button type="button" variant="ghost" onClick={onClose}>
            Cancel
          </Button>
          <Button type="submit" loading={addAdmin.isPending}>
            Add admin
          </Button>
        </div>
      </form>
    </Modal>
  )
}

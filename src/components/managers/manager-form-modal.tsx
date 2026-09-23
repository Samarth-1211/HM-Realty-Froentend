import { useEffect, useMemo } from 'react'
import { zodResolver } from '@hookform/resolvers/zod'
import { useForm } from 'react-hook-form'
import { z } from 'zod'
import { Modal } from '@/components/ui/modal'
import { Field, Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { useCreateManager, useUpdateManager } from '@/hooks/queries/use-managers'
import type { ManagerSummary } from '@/types'

interface FormValues {
  firstName: string
  lastName: string
  email: string
  password: string | undefined
}

function buildSchema(isEdit: boolean) {
  return z.object({
    firstName: z.string().min(1, 'Required'),
    lastName: z.string().min(1, 'Required'),
    email: z.string().min(1, 'Required').email('Enter a valid email'),
    password: isEdit ? z.string().optional() : z.string().min(8, 'Min 8 characters'),
  })
}

export function ManagerFormModal({
  open,
  onClose,
  manager,
}: {
  open: boolean
  onClose: () => void
  manager?: ManagerSummary | null
}) {
  const isEdit = !!manager
  const create = useCreateManager()
  const update = useUpdateManager()
  const schema = useMemo(() => buildSchema(isEdit), [isEdit])

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<FormValues>({ resolver: zodResolver(schema) })

  useEffect(() => {
    if (open) {
      reset(
        manager
          ? { firstName: manager.firstName, lastName: manager.lastName, email: manager.email, password: '' }
          : { firstName: '', lastName: '', email: '', password: '' },
      )
    }
  }, [open, manager, reset])

  const onSubmit = (values: FormValues) => {
    if (isEdit && manager) {
      update.mutate(
        { id: manager.id, payload: { firstName: values.firstName, lastName: values.lastName, email: values.email } },
        { onSuccess: onClose },
      )
    } else {
      create.mutate(
        { firstName: values.firstName, lastName: values.lastName, email: values.email, password: values.password! },
        { onSuccess: onClose },
      )
    }
  }

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={isEdit ? 'Edit manager' : 'New manager'}
      subtitle={isEdit ? `${manager?.firstName} ${manager?.lastName}` : 'Managers build and run their own sales team'}
      size="sm"
    >
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
        {!isEdit && (
          <Field
            label="Temporary password"
            error={errors.password?.message}
            required
            hint="Minimum 8 characters — the manager will verify their account via an emailed link before they can sign in"
          >
            <Input type="password" {...register('password')} />
          </Field>
        )}
        <div className="flex justify-end gap-2 pt-2">
          <Button type="button" variant="ghost" onClick={onClose}>
            Cancel
          </Button>
          <Button type="submit" loading={create.isPending || update.isPending}>
            {isEdit ? 'Save changes' : 'Create manager'}
          </Button>
        </div>
      </form>
    </Modal>
  )
}

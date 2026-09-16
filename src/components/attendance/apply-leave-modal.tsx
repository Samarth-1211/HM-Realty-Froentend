import { zodResolver } from '@hookform/resolvers/zod'
import { useForm } from 'react-hook-form'
import { z } from 'zod'
import { Modal } from '@/components/ui/modal'
import { Field, Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/select'
import { Button } from '@/components/ui/button'
import { useApplyLeave } from '@/hooks/queries/use-leave'

const schema = z
  .object({
    startDate: z.string().min(1, 'Required'),
    endDate: z.string().min(1, 'Required'),
    reason: z.string().min(1, 'Required'),
  })
  .refine((v) => v.endDate >= v.startDate, { message: 'End date must be on or after start date', path: ['endDate'] })
type FormValues = z.infer<typeof schema>

export function ApplyLeaveModal({ open, onClose }: { open: boolean; onClose: () => void }) {
  const applyLeave = useApplyLeave()
  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<FormValues>({ resolver: zodResolver(schema) })

  const onSubmit = (values: FormValues) => {
    applyLeave.mutate(values, {
      onSuccess: () => {
        reset()
        onClose()
      },
    })
  }

  return (
    <Modal open={open} onClose={onClose} title="Apply for leave" subtitle="Sent to your Manager for approval" size="sm">
      <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-4">
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <Field label="From" error={errors.startDate?.message} required>
            <Input type="date" {...register('startDate')} />
          </Field>
          <Field label="To" error={errors.endDate?.message} required>
            <Input type="date" {...register('endDate')} />
          </Field>
        </div>
        <Field label="Reason" error={errors.reason?.message} required>
          <Textarea placeholder="e.g. Family function" {...register('reason')} />
        </Field>
        <div className="flex justify-end gap-2 pt-1">
          <Button type="button" variant="ghost" onClick={onClose}>
            Cancel
          </Button>
          <Button type="submit" loading={applyLeave.isPending}>
            Submit request
          </Button>
        </div>
      </form>
    </Modal>
  )
}

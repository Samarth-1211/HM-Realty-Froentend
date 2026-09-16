import { useEffect } from 'react'
import { zodResolver } from '@hookform/resolvers/zod'
import { Controller, useForm } from 'react-hook-form'
import { z } from 'zod'
import { Modal } from '@/components/ui/modal'
import { Field, Input } from '@/components/ui/input'
import { Select } from '@/components/ui/select'
import { Button } from '@/components/ui/button'
import { useSetTarget } from '@/hooks/queries/use-targets'
import { TargetMetric } from '@/types'

const schema = z.object({
  metric: z.nativeEnum(TargetMetric),
  targetValue: z.coerce.number().int().min(1, 'Must be at least 1'),
})
type FormValues = z.input<typeof schema>
type FormOutput = z.output<typeof schema>

export function SetTargetModal({
  open,
  onClose,
  employee,
}: {
  open: boolean
  onClose: () => void
  employee: { userId: string; fullName: string } | null
}) {
  const now = new Date()
  const setTarget = useSetTarget()
  const {
    register,
    handleSubmit,
    control,
    reset,
    formState: { errors },
  } = useForm<FormValues, unknown, FormOutput>({
    resolver: zodResolver(schema),
    defaultValues: { metric: TargetMetric.CONVERSIONS, targetValue: 10 },
  })

  useEffect(() => {
    if (open) reset({ metric: TargetMetric.CONVERSIONS, targetValue: 10 })
  }, [open, reset])

  const onSubmit = (values: FormOutput) => {
    if (!employee) return
    setTarget.mutate(
      {
        userId: employee.userId,
        periodYear: now.getFullYear(),
        periodMonth: now.getMonth() + 1,
        metric: values.metric,
        targetValue: values.targetValue,
      },
      { onSuccess: onClose },
    )
  }

  return (
    <Modal
      open={open}
      onClose={onClose}
      title="Set monthly target"
      subtitle={employee ? `For ${employee.fullName} — ${new Intl.DateTimeFormat('en-IN', { month: 'long', year: 'numeric' }).format(now)}` : undefined}
      size="sm"
    >
      <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-4">
        <Field label="Metric" required>
          <Controller
            control={control}
            name="metric"
            render={({ field }) => (
              <Select value={field.value} onChange={(e) => field.onChange(e.target.value)}>
                <option value={TargetMetric.CONVERSIONS}>Conversions</option>
                <option value={TargetMetric.CALLS}>Calls (coming soon)</option>
              </Select>
            )}
          />
        </Field>
        <Field label="Target value" error={errors.targetValue?.message} required>
          <Input type="number" min={1} {...register('targetValue')} />
        </Field>
        <div className="flex justify-end gap-2 pt-1">
          <Button type="button" variant="ghost" onClick={onClose}>
            Cancel
          </Button>
          <Button type="submit" loading={setTarget.isPending}>
            Save target
          </Button>
        </div>
      </form>
    </Modal>
  )
}

import { useEffect } from 'react'
import { zodResolver } from '@hookform/resolvers/zod'
import { useForm, Controller } from 'react-hook-form'
import { z } from 'zod'
import { Modal } from '@/components/ui/modal'
import { Field, Input } from '@/components/ui/input'
import { Select, Textarea } from '@/components/ui/select'
import { MultiSelect } from '@/components/ui/multi-select'
import { Toggle } from '@/components/ui/toggle'
import { Button } from '@/components/ui/button'
import { useCreateProject, useUpdateProject } from '@/hooks/queries/use-projects'
import { LEAD_SOURCE_OPTIONS, PlotSizeUnit, type LeadSource, type Project } from '@/types'
import { formatEnumLabel } from '@/lib/utils'

const schema = z.object({
  name: z.string().min(1, 'Required'),
  description: z.string().optional(),
  location: z.string().optional(),
  price: z.coerce.number().min(0).optional(),
  plotSize: z.coerce.number().min(0).optional(),
  plotSizeUnit: z.string().optional(),
  activePlatforms: z.array(z.string()).optional(),
  isActive: z.boolean().optional(),
})
type FormValues = z.input<typeof schema>
type FormOutput = z.output<typeof schema>

export function ProjectFormModal({
  open,
  onClose,
  project,
}: {
  open: boolean
  onClose: () => void
  project?: Project | null
}) {
  const isEdit = !!project
  const create = useCreateProject()
  const update = useUpdateProject()

  const {
    register,
    handleSubmit,
    reset,
    control,
    formState: { errors },
  } = useForm<FormValues, unknown, FormOutput>({ resolver: zodResolver(schema) })

  useEffect(() => {
    if (open) {
      reset(
        project
          ? {
              name: project.name,
              description: project.description ?? '',
              location: project.location ?? '',
              price: project.price ? Number(project.price) : undefined,
              plotSize: project.plotSize ?? undefined,
              plotSizeUnit: project.plotSizeUnit ?? undefined,
              activePlatforms: project.activePlatforms ?? [],
              isActive: project.isActive,
            }
          : { activePlatforms: [], isActive: true },
      )
    }
  }, [open, project, reset])

  const onSubmit = (values: FormOutput) => {
    const payload = {
      name: values.name,
      description: values.description || undefined,
      location: values.location || undefined,
      price: values.price,
      plotSize: values.plotSize,
      plotSizeUnit: values.plotSizeUnit as PlotSizeUnit | undefined,
      activePlatforms: values.activePlatforms as LeadSource[] | undefined,
      isActive: values.isActive,
    }
    if (isEdit && project) {
      update.mutate({ id: project.id, payload }, { onSuccess: onClose })
    } else {
      create.mutate(payload, { onSuccess: onClose })
    }
  }

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={isEdit ? 'Edit project' : 'New project'}
      subtitle={isEdit ? project?.name : 'Add a property project to your organization'}
      size="lg"
    >
      <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-4">
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <Field label="Project name" error={errors.name?.message} required className="sm:col-span-2">
            <Input {...register('name')} placeholder="Sunrise Meadows Phase 2" />
          </Field>
          <Field label="Location">
            <Input {...register('location')} placeholder="Bicholi Mardana, Indore" />
          </Field>
          <Field label="Price (₹)">
            <Input type="number" min={0} {...register('price')} placeholder="4500000" />
          </Field>
          <Field label="Plot size">
            <Input type="number" min={0} {...register('plotSize')} placeholder="1200" />
          </Field>
          <Field label="Plot size unit">
            <Select {...register('plotSizeUnit')}>
              <option value="">Select unit</option>
              {Object.values(PlotSizeUnit).map((u) => (
                <option key={u} value={u}>
                  {u}
                </option>
              ))}
            </Select>
          </Field>
          <Field label="Description" className="sm:col-span-2">
            <Textarea {...register('description')} placeholder="3BHK residential plots near the ring road" />
          </Field>
          <Field label="Active platforms" className="sm:col-span-2" hint="Portals this project is being marketed on">
            <Controller
              control={control}
              name="activePlatforms"
              render={({ field }) => (
                <MultiSelect
                  options={LEAD_SOURCE_OPTIONS}
                  value={field.value ?? []}
                  onChange={field.onChange}
                  formatLabel={formatEnumLabel}
                  placeholder="Select platforms…"
                />
              )}
            />
          </Field>
          <Controller
            control={control}
            name="isActive"
            render={({ field }) => (
              <Toggle checked={field.value ?? true} onChange={field.onChange} label="Project is active" />
            )}
          />
        </div>

        <div className="flex justify-end gap-2 pt-2">
          <Button type="button" variant="ghost" onClick={onClose}>
            Cancel
          </Button>
          <Button type="submit" loading={create.isPending || update.isPending}>
            {isEdit ? 'Save changes' : 'Create project'}
          </Button>
        </div>
      </form>
    </Modal>
  )
}

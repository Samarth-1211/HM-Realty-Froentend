import { type ComponentProps, type ReactNode, useEffect } from 'react'
import { zodResolver } from '@hookform/resolvers/zod'
import { useForm, Controller, useFieldArray, useWatch, type Control } from 'react-hook-form'
import { Plus, Trash2 } from 'lucide-react'
import { z } from 'zod'
import { Modal } from '@/components/ui/modal'
import { Field, Input } from '@/components/ui/input'
import { Select, Textarea } from '@/components/ui/select'
import { MultiSelect } from '@/components/ui/multi-select'
import { Toggle } from '@/components/ui/toggle'
import { Button } from '@/components/ui/button'
import { useCreateProject, useUpdateProject } from '@/hooks/queries/use-projects'
import type { CreateProjectPayload } from '@/api/projects.api'
import {
  EmChargesStatus,
  LEAD_SOURCE_OPTIONS,
  PaymentTerms,
  PlotSizeMode,
  PropertyType,
  type LeadSource,
  type Project,
} from '@/types'
import { cn, formatEnumLabel } from '@/lib/utils'
import {
  EM_CHARGES_STATUS_LABELS,
  computeBudgetRange,
  formatBudgetRange,
  formatPlotSize,
} from '@/lib/project-pricing'

const PLC_PRESETS = [
  { min: 5, max: 10 },
  { min: 10, max: 15 },
]

/** Blank → null; anything else → a number (NaN when it isn't one). */
const num = (value: string | undefined) => (value === undefined || value.trim() === '' ? null : Number(value))

/** Blank, invalid or non-positive → null. */
const positiveNum = (value: string) => {
  const n = num(value)
  return n !== null && n > 0 ? n : null
}

const plotSizeSchema = z.object({ areaSqft: z.string(), widthFt: z.string(), lengthFt: z.string() })

// Numeric inputs are kept as strings so "blank" and "0" stay distinguishable;
// the cross-field rules below mirror the backend's validation.
const schema = z
  .object({
    name: z.string().trim().min(1, 'Required'),
    zone: z.string().trim().min(1, 'Required'),
    location: z.string().trim().min(1, 'Required'),
    landmark: z.string(),
    propertyType: z.enum(PropertyType),
    basicRateMin: z.string(),
    basicRateIsRange: z.boolean(),
    basicRateMax: z.string(),
    emChargesStatus: z.enum(EmChargesStatus),
    emCharges: z.string(),
    emChargesNote: z.string(),
    plcNa: z.boolean(),
    plcMinPercent: z.string(),
    plcMaxPercent: z.string(),
    guidelineRate: z.string(),
    guidelineRateApprox: z.boolean(),
    guidelineRateNa: z.boolean(),
    plotSizeMode: z.enum(PlotSizeMode),
    plotSizes: z.array(plotSizeSchema),
    plotAreaMin: z.string(),
    plotAreaMax: z.string(),
    budgetIsManual: z.boolean(),
    budgetMin: z.string(),
    budgetMax: z.string(),
    paymentTerms: z.union([z.enum(PaymentTerms), z.literal('')]),
    remarks: z.string(),
    sourceAgentName: z.string(),
    rateListDate: z.string(),
    description: z.string(),
    activePlatforms: z.array(z.string()),
    isActive: z.boolean(),
  })
  .superRefine((v, ctx) => {
    const issue = (path: (string | number)[], message: string) => ctx.addIssue({ code: 'custom', path, message })

    /** Optional positive number; returns its value, or null when blank or invalid. */
    const positive = (path: (string | number)[], raw: string, required = false) => {
      const n = num(raw)
      if (n === null) {
        if (required) issue(path, 'Required')
        return null
      }
      if (!(n > 0)) {
        issue(path, 'Must be a positive number')
        return null
      }
      return n
    }
    const ordered = (path: string, min: number | null, max: number | null) => {
      if (min !== null && max !== null && min > max) issue([path], 'Must not be less than the minimum')
    }

    const rateMin = positive(['basicRateMin'], v.basicRateMin, v.basicRateIsRange)
    if (v.basicRateIsRange) ordered('basicRateMax', rateMin, positive(['basicRateMax'], v.basicRateMax, true))

    if (v.emChargesStatus === EmChargesStatus.AMOUNT) positive(['emCharges'], v.emCharges)
    if (v.emChargesStatus === EmChargesStatus.OTHERS && !v.emChargesNote.trim()) issue(['emChargesNote'], 'Required')

    if (!v.plcNa) {
      const percent = (path: string, raw: string) => {
        const n = num(raw)
        if (n !== null && !(n >= 0 && n <= 100)) {
          issue([path], 'Must be between 0 and 100')
          return null
        }
        return n
      }
      ordered('plcMaxPercent', percent('plcMinPercent', v.plcMinPercent), percent('plcMaxPercent', v.plcMaxPercent))
    }

    if (!v.guidelineRateNa) positive(['guidelineRate'], v.guidelineRate)

    if (v.plotSizeMode === PlotSizeMode.LIST) {
      if (v.plotSizes.length === 0) issue(['plotSizes'], 'Add at least one plot size')
      v.plotSizes.forEach((s, i) => {
        positive(['plotSizes', i, 'areaSqft'], s.areaSqft, true)
        positive(['plotSizes', i, 'widthFt'], s.widthFt)
        positive(['plotSizes', i, 'lengthFt'], s.lengthFt)
      })
    } else {
      const min = positive(['plotAreaMin'], v.plotAreaMin, true)
      ordered('plotAreaMax', min, positive(['plotAreaMax'], v.plotAreaMax, true))
    }

    if (v.budgetIsManual) {
      const min = positive(['budgetMin'], v.budgetMin, true)
      ordered('budgetMax', min, positive(['budgetMax'], v.budgetMax))
    }
  })

type FormValues = z.infer<typeof schema>

const EMPTY_PLOT_SIZE = { areaSqft: '', widthFt: '', lengthFt: '' }

const str = (value: string | number | null | undefined) => (value === null || value === undefined ? '' : String(value))

function toFormValues(project: Project | null | undefined): FormValues {
  const plotSizes = project?.plotSizes?.map((s) => ({
    areaSqft: str(s.areaSqft),
    widthFt: str(s.widthFt),
    lengthFt: str(s.lengthFt),
  }))
  return {
    name: project?.name ?? '',
    zone: project?.zone ?? '',
    location: project?.location ?? '',
    landmark: project?.landmark ?? '',
    propertyType: project?.propertyType ?? PropertyType.PLOT,
    basicRateMin: str(project?.basicRateMin),
    basicRateIsRange: !!project?.basicRateMax && Number(project.basicRateMax) !== Number(project.basicRateMin),
    basicRateMax: str(project?.basicRateMax),
    emChargesStatus: project?.emChargesStatus ?? EmChargesStatus.AMOUNT,
    emCharges: str(project?.emCharges),
    emChargesNote: project?.emChargesNote ?? '',
    plcNa: project?.plcNa ?? false,
    plcMinPercent: str(project?.plcMinPercent),
    plcMaxPercent: str(project?.plcMaxPercent),
    guidelineRate: str(project?.guidelineRate),
    guidelineRateApprox: project?.guidelineRateApprox ?? false,
    guidelineRateNa: project?.guidelineRateNa ?? false,
    plotSizeMode: project?.plotSizeMode ?? PlotSizeMode.LIST,
    plotSizes: plotSizes?.length ? plotSizes : [EMPTY_PLOT_SIZE],
    plotAreaMin: str(project?.plotAreaMin),
    plotAreaMax: str(project?.plotAreaMax),
    budgetIsManual: project?.budgetIsManual ?? false,
    budgetMin: project?.budgetIsManual ? str(project.budgetMin) : '',
    budgetMax: project?.budgetIsManual ? str(project.budgetMax) : '',
    paymentTerms: project?.paymentTerms ?? '',
    remarks: project?.remarks ?? '',
    sourceAgentName: project?.sourceAgentName ?? '',
    rateListDate: project?.rateListDate?.slice(0, 10) ?? '',
    description: project?.description ?? '',
    activePlatforms: project?.activePlatforms ?? [],
    isActive: project?.isActive ?? true,
  }
}

function toPayload(v: FormValues): CreateProjectPayload {
  const isList = v.plotSizeMode === PlotSizeMode.LIST
  const emAmount = num(v.emCharges)
  const rateMin = num(v.basicRateMin)
  return {
    name: v.name,
    zone: v.zone,
    location: v.location,
    landmark: v.landmark.trim() || null,
    propertyType: v.propertyType,
    basicRateMin: rateMin,
    basicRateMax: v.basicRateIsRange ? num(v.basicRateMax) : rateMin,
    // "Amount" with nothing typed means E+M simply wasn't given.
    emChargesStatus:
      v.emChargesStatus === EmChargesStatus.AMOUNT && emAmount === null ? null : v.emChargesStatus,
    emCharges: v.emChargesStatus === EmChargesStatus.AMOUNT ? emAmount : null,
    emChargesNote: v.emChargesStatus === EmChargesStatus.OTHERS ? v.emChargesNote.trim() : null,
    plcNa: v.plcNa,
    plcMinPercent: v.plcNa ? null : num(v.plcMinPercent),
    plcMaxPercent: v.plcNa ? null : num(v.plcMaxPercent),
    guidelineRate: v.guidelineRateNa ? null : num(v.guidelineRate),
    guidelineRateApprox: !v.guidelineRateNa && v.guidelineRateApprox,
    guidelineRateNa: v.guidelineRateNa,
    plotSizeMode: v.plotSizeMode,
    plotSizes: isList
      ? v.plotSizes.map((s) => ({ areaSqft: Number(s.areaSqft), widthFt: num(s.widthFt), lengthFt: num(s.lengthFt) }))
      : [],
    plotAreaMin: isList ? null : num(v.plotAreaMin),
    plotAreaMax: isList ? null : num(v.plotAreaMax),
    budgetIsManual: v.budgetIsManual,
    budgetMin: v.budgetIsManual ? num(v.budgetMin) : null,
    budgetMax: v.budgetIsManual ? (num(v.budgetMax) ?? num(v.budgetMin)) : null,
    paymentTerms: v.paymentTerms || null,
    remarks: v.remarks.trim() || null,
    sourceAgentName: v.sourceAgentName.trim() || null,
    rateListDate: v.rateListDate || null,
    description: v.description.trim() || null,
    activePlatforms: v.activePlatforms as LeadSource[],
    isActive: v.isActive,
  }
}

/** The budget the backend will calculate from the current form values. */
function useCalculatedBudget(control: Control<FormValues>) {
  const [rateMin, isRange, rateMax, mode, plotSizes, areaMin, areaMax] = useWatch({
    control,
    name: ['basicRateMin', 'basicRateIsRange', 'basicRateMax', 'plotSizeMode', 'plotSizes', 'plotAreaMin', 'plotAreaMax'],
  })
  const min = positiveNum(rateMin)
  const max = isRange ? positiveNum(rateMax) : min
  const perPlot =
    mode === PlotSizeMode.LIST
      ? plotSizes.flatMap((s) => {
          const area = positiveNum(s.areaSqft)
          if (area === null || min === null) return []
          const size = { areaSqft: area, widthFt: positiveNum(s.widthFt), lengthFt: positiveNum(s.lengthFt) }
          return [{ label: formatPlotSize(size), budget: formatBudgetRange(Math.round(min * area), Math.round((max ?? min) * area)) }]
        })
      : []
  const range = computeBudgetRange({
    basicRateMin: min,
    basicRateMax: max,
    plotSizeMode: mode,
    plotAreas: plotSizes.map((s) => positiveNum(s.areaSqft)).filter((a): a is number => a !== null),
    plotAreaMin: positiveNum(areaMin),
    plotAreaMax: positiveNum(areaMax),
  })
  return { range, perPlot }
}

function FormSection({ title, children }: { title: string; children: ReactNode }) {
  return (
    <section className="flex flex-col gap-4 border-t border-slate-100 pt-4 first:border-t-0 first:pt-0">
      <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">{title}</p>
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">{children}</div>
    </section>
  )
}

function Checkbox({ label, ...props }: { label: string } & ComponentProps<'input'>) {
  return (
    <label className="flex cursor-pointer items-center gap-2 text-sm text-slate-600">
      <input type="checkbox" className="size-4 rounded border-slate-300" {...props} />
      {label}
    </label>
  )
}

function Chip({ active, onClick, children }: { active: boolean; onClick: () => void; children: ReactNode }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        'rounded-full px-3 py-1.5 text-xs font-medium ring-1 ring-inset transition-colors',
        active ? 'bg-brand-50 text-brand-700 ring-brand-600/30' : 'bg-white text-slate-500 ring-slate-200 hover:bg-slate-50',
      )}
    >
      {children}
    </button>
  )
}

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
    setValue,
    getValues,
    formState: { errors },
  } = useForm<FormValues>({ resolver: zodResolver(schema), defaultValues: toFormValues(null) })
  const plotSizes = useFieldArray({ control, name: 'plotSizes' })

  useEffect(() => {
    if (open) reset(toFormValues(project))
  }, [open, project, reset])

  const [basicRateIsRange, emChargesStatus, plcNa, plcMin, plcMax, guidelineRateNa, plotSizeMode, budgetIsManual, budgetMin, budgetMax] =
    useWatch({
      control,
      name: ['basicRateIsRange', 'emChargesStatus', 'plcNa', 'plcMinPercent', 'plcMaxPercent', 'guidelineRateNa', 'plotSizeMode', 'budgetIsManual', 'budgetMin', 'budgetMax'],
    })
  const calculated = useCalculatedBudget(control)

  /** Width × length fills in the area; the area stays editable afterwards. */
  const fillArea = (index: number) => {
    const width = num(getValues(`plotSizes.${index}.widthFt`))
    const length = num(getValues(`plotSizes.${index}.lengthFt`))
    if (width && length && width > 0 && length > 0) {
      setValue(`plotSizes.${index}.areaSqft`, String(Math.round(width * length * 100) / 100), { shouldValidate: true })
    }
  }

  const setBudgetManual = (manual: boolean) => {
    setValue('budgetIsManual', manual)
    // Start the override from the calculated figures so only the difference needs typing.
    if (manual && !getValues('budgetMin') && calculated.range) {
      setValue('budgetMin', String(calculated.range.min))
      setValue('budgetMax', String(calculated.range.max))
    }
  }

  const onSubmit = (values: FormValues) => {
    const payload = toPayload(values)
    if (isEdit && project) {
      update.mutate({ id: project.id, payload }, { onSuccess: onClose })
    } else {
      create.mutate(payload, { onSuccess: onClose })
    }
  }

  const manualMin = positiveNum(budgetMin)
  const manualMax = positiveNum(budgetMax)
  const manualBudgetPreview = formatBudgetRange(
    manualMin === null ? null : Math.round(manualMin),
    manualMax === null ? null : Math.round(manualMax),
  )

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={isEdit ? 'Edit project' : 'New project'}
      subtitle={isEdit ? project?.name : 'Add a project from an agent\'s rate list'}
      size="lg"
    >
      <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-5">
        <FormSection title="Basic info">
          <Field label="Project name" error={errors.name?.message} required className="sm:col-span-2">
            <Input {...register('name')} error={!!errors.name} placeholder="Sunrise Meadows Phase 2" />
          </Field>
          <Field label="Zone / Area" error={errors.zone?.message} required hint="As written in the agent's list">
            <Input {...register('zone')} error={!!errors.zone} placeholder="Super Corridor" />
          </Field>
          <Field label="Location" error={errors.location?.message} required>
            <Input {...register('location')} error={!!errors.location} placeholder="Bicholi Mardana" />
          </Field>
          <Field label="Landmark">
            <Input {...register('landmark')} placeholder="Near Bombay Hospital" />
          </Field>
          <Field label="Property type">
            <Select {...register('propertyType')}>
              {Object.values(PropertyType).map((t) => (
                <option key={t} value={t}>
                  {formatEnumLabel(t)}
                </option>
              ))}
            </Select>
          </Field>
        </FormSection>

        <FormSection title="Pricing">
          <div className="flex flex-col gap-2 sm:col-span-2">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium text-slate-700">Basic rate (₹ per sq.ft)</span>
              <Controller
                control={control}
                name="basicRateIsRange"
                render={({ field }) => <Toggle checked={field.value} onChange={field.onChange} label="Range" />}
              />
            </div>
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <Field error={errors.basicRateMin?.message}>
                <Input
                  type="number"
                  step="any"
                  min={0}
                  {...register('basicRateMin')}
                  error={!!errors.basicRateMin}
                  placeholder={basicRateIsRange ? 'From, e.g. 5300' : '4700'}
                />
              </Field>
              {basicRateIsRange && (
                <Field error={errors.basicRateMax?.message}>
                  <Input
                    type="number"
                    step="any"
                    min={0}
                    {...register('basicRateMax')}
                    error={!!errors.basicRateMax}
                    placeholder="To, e.g. 6000"
                  />
                </Field>
              )}
            </div>
          </div>

          <Field label="E+M charges (₹ per sq.ft)" error={errors.emCharges?.message ?? errors.emChargesNote?.message}>
            <div className="flex gap-2">
              <div className="w-32 shrink-0">
                <Select {...register('emChargesStatus')}>
                  {Object.values(EmChargesStatus).map((s) => (
                    <option key={s} value={s}>
                      {EM_CHARGES_STATUS_LABELS[s]}
                    </option>
                  ))}
                </Select>
              </div>
              <div className="min-w-0 flex-1">
                {emChargesStatus === EmChargesStatus.AMOUNT && (
                  <Input type="number" step="any" min={0} {...register('emCharges')} error={!!errors.emCharges} placeholder="150" />
                )}
                {emChargesStatus === EmChargesStatus.OTHERS && (
                  <Input {...register('emChargesNote')} error={!!errors.emChargesNote} placeholder="e.g. Included in basic rate" />
                )}
              </div>
            </div>
          </Field>

          <Field label="Guideline rate (₹ per sq.ft)" error={errors.guidelineRate?.message} hint="Government / collector rate">
            <div className="flex items-center gap-3">
              <div className="min-w-0 flex-1">
                <Input
                  type="number"
                  step="any"
                  min={0}
                  {...register('guidelineRate')}
                  error={!!errors.guidelineRate}
                  disabled={guidelineRateNa}
                  placeholder={guidelineRateNa ? 'NA' : '2800'}
                />
              </div>
              <Checkbox label="Approx." disabled={guidelineRateNa} {...register('guidelineRateApprox')} />
              <Checkbox label="NA" {...register('guidelineRateNa')} />
            </div>
          </Field>

          <Field
            label="PLC % (preferential location charges)"
            error={errors.plcMinPercent?.message ?? errors.plcMaxPercent?.message}
            className="sm:col-span-2"
          >
            <div className="flex flex-col gap-2">
              <div className="flex flex-wrap gap-2">
                {PLC_PRESETS.map((p) => (
                  <Chip
                    key={p.min}
                    active={!plcNa && num(plcMin) === p.min && num(plcMax) === p.max}
                    onClick={() => {
                      setValue('plcNa', false)
                      setValue('plcMinPercent', String(p.min), { shouldValidate: true })
                      setValue('plcMaxPercent', String(p.max), { shouldValidate: true })
                    }}
                  >
                    {p.min}–{p.max}%
                  </Chip>
                ))}
                <Chip active={plcNa} onClick={() => setValue('plcNa', !plcNa, { shouldValidate: true })}>
                  NA
                </Chip>
              </div>
              {!plcNa && (
                <div className="flex items-center gap-2">
                  <Input type="number" step="any" min={0} max={100} {...register('plcMinPercent')} error={!!errors.plcMinPercent} placeholder="Min %" />
                  <span className="text-sm text-slate-400">to</span>
                  <Input type="number" step="any" min={0} max={100} {...register('plcMaxPercent')} error={!!errors.plcMaxPercent} placeholder="Max %" />
                </div>
              )}
            </div>
          </Field>
        </FormSection>

        <FormSection title="Plot sizes & budget">
          <div className="flex flex-col gap-2 sm:col-span-2">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium text-slate-700">
                Plot sizes<span className="text-rose-500"> *</span>
              </span>
              <Toggle
                checked={plotSizeMode === PlotSizeMode.RANGE}
                onChange={(on) => setValue('plotSizeMode', on ? PlotSizeMode.RANGE : PlotSizeMode.LIST)}
                label="Size range only"
              />
            </div>

            {plotSizeMode === PlotSizeMode.LIST ? (
              <div className="flex flex-col gap-2">
                {plotSizes.fields.map((row, i) => {
                  const rowErrors = errors.plotSizes?.[i]
                  return (
                    <div key={row.id} className="flex flex-col gap-1">
                      <div className="flex items-center gap-2">
                        <Input
                          type="number"
                          step="any"
                          min={0}
                          aria-label="Width (ft)"
                          placeholder="Width"
                          error={!!rowErrors?.widthFt}
                          {...register(`plotSizes.${i}.widthFt`, { onChange: () => fillArea(i) })}
                        />
                        <span className="text-sm text-slate-400">×</span>
                        <Input
                          type="number"
                          step="any"
                          min={0}
                          aria-label="Length (ft)"
                          placeholder="Length"
                          error={!!rowErrors?.lengthFt}
                          {...register(`plotSizes.${i}.lengthFt`, { onChange: () => fillArea(i) })}
                        />
                        <span className="text-sm text-slate-400">=</span>
                        <Input
                          type="number"
                          step="any"
                          min={0}
                          aria-label="Area (sq.ft)"
                          placeholder="Area"
                          error={!!rowErrors?.areaSqft}
                          {...register(`plotSizes.${i}.areaSqft`)}
                        />
                        <Button
                          type="button"
                          variant="ghost"
                          size="icon"
                          className="shrink-0"
                          aria-label="Remove plot size"
                          disabled={plotSizes.fields.length === 1}
                          onClick={() => plotSizes.remove(i)}
                        >
                          <Trash2 className="size-4" />
                        </Button>
                      </div>
                      {(rowErrors?.areaSqft || rowErrors?.widthFt || rowErrors?.lengthFt) && (
                        <p className="text-xs font-medium text-rose-600">
                          {rowErrors.areaSqft?.message ?? rowErrors.widthFt?.message ?? rowErrors.lengthFt?.message}
                        </p>
                      )}
                    </div>
                  )
                })}
                {errors.plotSizes?.root?.message && (
                  <p className="text-xs font-medium text-rose-600">{errors.plotSizes.root.message}</p>
                )}
                <div>
                  <Button type="button" variant="secondary" size="sm" onClick={() => plotSizes.append(EMPTY_PLOT_SIZE)}>
                    <Plus className="size-4" />
                    Add plot size
                  </Button>
                </div>
                <p className="text-xs text-slate-400">Width × length (ft) fills in the area (sq.ft) automatically; you can still edit it.</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <Field error={errors.plotAreaMin?.message} hint="Smallest plot, sq.ft">
                  <Input type="number" step="any" min={0} {...register('plotAreaMin')} error={!!errors.plotAreaMin} placeholder="1150" />
                </Field>
                <Field error={errors.plotAreaMax?.message} hint="Largest plot, sq.ft">
                  <Input type="number" step="any" min={0} {...register('plotAreaMax')} error={!!errors.plotAreaMax} placeholder="2000" />
                </Field>
              </div>
            )}
          </div>

          <div className="flex flex-col gap-3 rounded-xl bg-slate-50 p-4 sm:col-span-2">
            <div className="flex items-center justify-between gap-3">
              <div>
                <p className="text-sm font-medium text-slate-700">Budget</p>
                <p className="text-xs text-slate-400">
                  {budgetIsManual ? 'Entered manually (lump-sum price)' : 'Basic rate × plot area'}
                </p>
              </div>
              <Toggle checked={budgetIsManual} onChange={setBudgetManual} label="Manual override" />
            </div>

            {budgetIsManual ? (
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <Field label="From (₹)" error={errors.budgetMin?.message}>
                  <Input type="number" step="1" min={0} {...register('budgetMin')} error={!!errors.budgetMin} placeholder="13500000" />
                </Field>
                <Field label="To (₹)" error={errors.budgetMax?.message} hint="Leave blank for a single price">
                  <Input type="number" step="1" min={0} {...register('budgetMax')} error={!!errors.budgetMax} placeholder="14500000" />
                </Field>
                <p className="text-lg font-semibold text-slate-900 sm:col-span-2">{manualBudgetPreview}</p>
              </div>
            ) : calculated.range ? (
              <div className="flex flex-col gap-1.5">
                <p className="text-lg font-semibold text-slate-900">
                  {formatBudgetRange(calculated.range.min, calculated.range.max)}
                </p>
                {calculated.perPlot.length > 1 && (
                  <ul className="flex flex-col gap-0.5 text-xs text-slate-500">
                    {calculated.perPlot.map((p, i) => (
                      <li key={i}>
                        {p.label} → {p.budget}
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            ) : (
              <p className="text-sm text-slate-400">Enter a basic rate and plot sizes to calculate the budget.</p>
            )}
          </div>
        </FormSection>

        <FormSection title="Other">
          <Field label="Payment terms">
            <Select {...register('paymentTerms')}>
              <option value="">Not specified</option>
              {Object.values(PaymentTerms).map((t) => (
                <option key={t} value={t}>
                  {formatEnumLabel(t)}
                </option>
              ))}
            </Select>
          </Field>
          <div className="hidden sm:block" />
          <Field label="Remarks" className="sm:col-span-2">
            <Textarea {...register('remarks')} className="min-h-20" placeholder="25% on booking, balance in 90 days" />
          </Field>
          <Field label="Source (agent / broker)">
            <Input {...register('sourceAgentName')} placeholder="Sharma Properties" />
          </Field>
          <Field label="Rate list date">
            <Input type="date" {...register('rateListDate')} />
          </Field>
          <Field label="Description" className="sm:col-span-2">
            <Textarea {...register('description')} className="min-h-20" placeholder="3BHK residential plots near the ring road" />
          </Field>
          <Field label="Active platforms" className="sm:col-span-2" hint="Portals this project is being marketed on">
            <Controller
              control={control}
              name="activePlatforms"
              render={({ field }) => (
                <MultiSelect
                  options={LEAD_SOURCE_OPTIONS}
                  value={field.value}
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
            render={({ field }) => <Toggle checked={field.value} onChange={field.onChange} label="Project is active" />}
          />
        </FormSection>

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

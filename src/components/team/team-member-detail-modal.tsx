import { useEffect, useState } from 'react'
import { zodResolver } from '@hookform/resolvers/zod'
import { Controller, useForm } from 'react-hook-form'
import { z } from 'zod'
import { FolderKanban, MapPin } from 'lucide-react'
import { Modal } from '@/components/ui/modal'
import { Field, Input } from '@/components/ui/input'
import { Toggle } from '@/components/ui/toggle'
import { Button } from '@/components/ui/button'
import { Spinner } from '@/components/ui/spinner'
import { useAssignTeamMemberProject, useTeamMember, useUpdateTeamMember } from '@/hooks/queries/use-team'
import { formatCurrency } from '@/lib/utils'

const schema = z.object({
  firstName: z.string().min(1, 'Required'),
  lastName: z.string().min(1, 'Required'),
  isActive: z.boolean(),
})
type FormValues = z.infer<typeof schema>

export function TeamMemberDetailModal({
  open,
  onClose,
  memberId,
}: {
  open: boolean
  onClose: () => void
  memberId: string | null
}) {
  const { data: member, isLoading } = useTeamMember(open ? (memberId ?? undefined) : undefined)
  const update = useUpdateTeamMember()
  const assignProject = useAssignTeamMemberProject()
  const [projectId, setProjectId] = useState('')

  const {
    register,
    handleSubmit,
    reset,
    control,
    formState: { errors },
  } = useForm<FormValues>({ resolver: zodResolver(schema) })

  useEffect(() => {
    if (member) reset({ firstName: member.firstName, lastName: member.lastName, isActive: member.isActive })
  }, [member, reset])

  const onSubmit = (values: FormValues) => {
    if (!member) return
    update.mutate({ id: member.id, payload: values })
  }

  return (
    <Modal open={open} onClose={onClose} title="Team member" subtitle={member ? member.email : undefined} size="md">
      {isLoading || !member ? (
        <div className="flex justify-center py-10">
          <Spinner />
        </div>
      ) : (
        <div className="flex flex-col gap-6">
          <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-4">
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <Field label="First name" error={errors.firstName?.message} required>
                <Input {...register('firstName')} />
              </Field>
              <Field label="Last name" error={errors.lastName?.message} required>
                <Input {...register('lastName')} />
              </Field>
            </div>
            <Controller
              control={control}
              name="isActive"
              render={({ field }) => (
                <Toggle checked={field.value} onChange={field.onChange} label="Active" />
              )}
            />
            <div className="flex justify-end">
              <Button type="submit" size="sm" loading={update.isPending}>
                Save changes
              </Button>
            </div>
          </form>

          <div className="border-t border-slate-100 pt-4">
            <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-slate-400">
              Project assignments
            </p>
            <div className="flex flex-col gap-2">
              {member.projectAssignments.length === 0 && (
                <p className="text-sm text-slate-400">Not assigned to any project yet.</p>
              )}
              {member.projectAssignments.map((pa) => (
                <div key={pa.id} className="flex items-center gap-3 rounded-xl bg-slate-50 px-3 py-2.5">
                  <FolderKanban className="size-4 shrink-0 text-brand-600" />
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-medium text-slate-800">{pa.project.name}</p>
                    <p className="flex items-center gap-1 truncate text-xs text-slate-400">
                      <MapPin className="size-3" />
                      {pa.project.location ?? '—'} · {formatCurrency(pa.project.price)}
                    </p>
                  </div>
                </div>
              ))}
            </div>

            <div className="mt-3 flex gap-2">
              <Input
                placeholder="Paste a project ID to assign…"
                value={projectId}
                onChange={(e) => setProjectId(e.target.value)}
              />
              <Button
                variant="secondary"
                disabled={!projectId}
                loading={assignProject.isPending}
                onClick={() => assignProject.mutate({ id: member.id, projectId }, { onSuccess: () => setProjectId('') })}
              >
                Assign
              </Button>
            </div>
            <p className="mt-1.5 text-xs text-slate-400">
              Ask your Admin for the project ID — managers don't have a full project directory yet.
            </p>
          </div>
        </div>
      )}
    </Modal>
  )
}

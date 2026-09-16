import { useEffect } from 'react'
import { zodResolver } from '@hookform/resolvers/zod'
import { useForm } from 'react-hook-form'
import { z } from 'zod'
import { BadgeCheck, Briefcase, Calendar, IdCard, UserCog } from 'lucide-react'
import { PageHeader } from '@/components/ui/page-header'
import { Card, CardBody, CardHeader } from '@/components/ui/card'
import { Field, Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Avatar } from '@/components/ui/avatar'
import { PageLoader } from '@/components/ui/spinner'
import { useEmployeeProfile, useUpdateMyProfile } from '@/hooks/queries/use-employees'
import { useAuthStore } from '@/store/auth-store'
import { cleanPayload, formatDate, formatRoleLabel } from '@/lib/utils'

const schema = z.object({
  phone: z.string().optional().or(z.literal('')),
  photoUrl: z.string().optional().or(z.literal('')),
})
type FormValues = z.infer<typeof schema>

export function ProfilePage() {
  const user = useAuthStore((s) => s.user)
  const { data: profile, isLoading } = useEmployeeProfile(user?.id)
  const updateProfile = useUpdateMyProfile()

  const {
    register,
    handleSubmit,
    reset,
  } = useForm<FormValues>({ resolver: zodResolver(schema) })

  useEffect(() => {
    if (profile) reset({ phone: profile.phone ?? '', photoUrl: profile.photoUrl ?? '' })
  }, [profile, reset])

  if (isLoading || !profile) return <PageLoader label="Loading your profile…" />

  const onSubmit = (values: FormValues) => updateProfile.mutate(cleanPayload(values))

  const infoRows = [
    { icon: Briefcase, label: 'Role', value: formatRoleLabel(profile.role) },
    { icon: UserCog, label: 'Reporting manager', value: profile.managerName ?? '—' },
    { icon: Calendar, label: 'Joining date', value: formatDate(profile.joiningDate) },
    { icon: IdCard, label: 'Employee code', value: profile.employeeCode ?? 'Not assigned yet' },
  ]

  return (
    <div>
      <PageHeader title="My Profile" description="Your details as visible to your Manager and Admin." />

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-5">
        <Card className="lg:col-span-2">
          <CardBody className="flex flex-col items-center gap-3 py-8 text-center">
            <Avatar firstName={profile.fullName.split(' ')[0] ?? ''} lastName={profile.fullName.split(' ')[1] ?? ''} size="lg" />
            <div>
              <p className="text-base font-semibold text-slate-900">{profile.fullName}</p>
              <p className="text-sm text-slate-400">{profile.email}</p>
            </div>
            <Badge variant={profile.isActive ? 'success' : 'neutral'}>
              <BadgeCheck className="size-3.5" />
              {profile.isActive ? 'Active' : 'Inactive'}
            </Badge>
          </CardBody>
        </Card>

        <Card className="lg:col-span-3">
          <CardHeader title="Employment details" />
          <CardBody className="flex flex-col gap-3">
            {infoRows.map((row) => (
              <div key={row.label} className="flex items-start gap-3">
                <row.icon className="mt-0.5 size-4 shrink-0 text-slate-400" />
                <div>
                  <p className="text-xs text-slate-400">{row.label}</p>
                  <p className="text-sm font-medium text-slate-700">{row.value}</p>
                </div>
              </div>
            ))}
          </CardBody>
        </Card>

        <Card className="lg:col-span-5">
          <CardHeader title="Contact details" subtitle="Editable by you" />
          <CardBody>
            <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-4">
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <Field label="Phone number">
                  <Input placeholder="+919876543210" {...register('phone')} />
                </Field>
                <Field label="Profile photo URL">
                  <Input placeholder="https://…" {...register('photoUrl')} />
                </Field>
              </div>
              <div className="flex justify-end">
                <Button type="submit" size="sm" loading={updateProfile.isPending}>
                  Save changes
                </Button>
              </div>
            </form>
          </CardBody>
        </Card>
      </div>
    </div>
  )
}

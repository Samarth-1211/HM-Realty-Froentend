import { useEffect } from 'react'
import { zodResolver } from '@hookform/resolvers/zod'
import { useForm } from 'react-hook-form'
import { z } from 'zod'
import { BadgeCheck, Briefcase, Calendar, IdCard, ShieldAlert, UserCog } from 'lucide-react'
import { PageHeader } from '@/components/ui/page-header'
import { Card, CardBody, CardHeader } from '@/components/ui/card'
import { Field, Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Avatar } from '@/components/ui/avatar'
import { PageLoader } from '@/components/ui/spinner'
import {
  useChangeMyEmail,
  useChangeMyPassword,
  useEmployeeProfile,
  useUpdateMyProfile,
} from '@/hooks/queries/use-employees'
import { useAuthStore } from '@/store/auth-store'
import { cleanPayload, formatDate, formatRoleLabel } from '@/lib/utils'

const schema = z.object({
  firstName: z.string().min(1, 'Required'),
  lastName: z.string().min(1, 'Required'),
  phone: z.string().optional().or(z.literal('')),
  photoUrl: z.string().optional().or(z.literal('')),
})
type FormValues = z.infer<typeof schema>

const emailSchema = z.object({
  newEmail: z.string().min(1, 'Required').email('Enter a valid email'),
  currentPassword: z.string().min(1, 'Required'),
})
type EmailFormValues = z.infer<typeof emailSchema>

const passwordSchema = z
  .object({
    currentPassword: z.string().min(1, 'Required'),
    newPassword: z.string().min(8, 'Minimum 8 characters'),
    confirmPassword: z.string().min(1, 'Required'),
  })
  .refine((v) => v.newPassword === v.confirmPassword, {
    message: 'Passwords do not match',
    path: ['confirmPassword'],
  })
type PasswordFormValues = z.infer<typeof passwordSchema>

export function ProfilePage() {
  const user = useAuthStore((s) => s.user)
  const { data: profile, isLoading } = useEmployeeProfile(user?.id)
  const updateProfile = useUpdateMyProfile()
  const changeEmail = useChangeMyEmail()
  const changePassword = useChangeMyPassword()

  const {
    register,
    handleSubmit,
    reset,
  } = useForm<FormValues>({ resolver: zodResolver(schema) })

  const emailForm = useForm<EmailFormValues>({ resolver: zodResolver(emailSchema) })
  const passwordForm = useForm<PasswordFormValues>({ resolver: zodResolver(passwordSchema) })

  useEffect(() => {
    if (profile) {
      reset({
        firstName: profile.fullName.split(' ')[0] ?? '',
        lastName: profile.fullName.split(' ').slice(1).join(' ') ?? '',
        phone: profile.phone ?? '',
        photoUrl: profile.photoUrl ?? '',
      })
    }
  }, [profile, reset])

  if (isLoading || !profile) return <PageLoader label="Loading your profile…" />

  const onSubmit = (values: FormValues) => updateProfile.mutate(cleanPayload(values))

  const onChangeEmail = (values: EmailFormValues) =>
    changeEmail.mutate(values, { onSuccess: () => emailForm.reset() })

  const onChangePassword = (values: PasswordFormValues) =>
    changePassword.mutate(
      { currentPassword: values.currentPassword, newPassword: values.newPassword },
      { onSuccess: () => passwordForm.reset() },
    )

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
            <div className="flex flex-wrap justify-center gap-2">
              <Badge variant={profile.isActive ? 'success' : 'neutral'}>
                <BadgeCheck className="size-3.5" />
                {profile.isActive ? 'Active' : 'Inactive'}
              </Badge>
              {!profile.isVerified && (
                <Badge variant="warning">
                  <ShieldAlert className="size-3.5" />
                  Unverified
                </Badge>
              )}
              {profile.isTemporaryPassword && <Badge variant="warning">Using temporary password</Badge>}
            </div>
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
                <Field label="First name">
                  <Input {...register('firstName')} />
                </Field>
                <Field label="Last name">
                  <Input {...register('lastName')} />
                </Field>
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

        <Card className="lg:col-span-2">
          <CardHeader
            title="Change email"
            subtitle="Requires your current password. We'll send a verification link to the new address."
          />
          <CardBody>
            <form onSubmit={emailForm.handleSubmit(onChangeEmail)} className="flex flex-col gap-4">
              <Field label="New email" error={emailForm.formState.errors.newEmail?.message} required>
                <Input type="email" {...emailForm.register('newEmail')} />
              </Field>
              <Field label="Current password" error={emailForm.formState.errors.currentPassword?.message} required>
                <Input type="password" {...emailForm.register('currentPassword')} />
              </Field>
              <div className="flex justify-end">
                <Button type="submit" size="sm" loading={changeEmail.isPending}>
                  Update email
                </Button>
              </div>
            </form>
          </CardBody>
        </Card>

        <Card className="lg:col-span-3">
          <CardHeader title="Change password" subtitle="You'll stay signed in on this device" />
          <CardBody>
            <form onSubmit={passwordForm.handleSubmit(onChangePassword)} className="flex flex-col gap-4">
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
                <Field label="Current password" error={passwordForm.formState.errors.currentPassword?.message} required>
                  <Input type="password" {...passwordForm.register('currentPassword')} />
                </Field>
                <Field label="New password" error={passwordForm.formState.errors.newPassword?.message} required hint="Minimum 8 characters">
                  <Input type="password" {...passwordForm.register('newPassword')} />
                </Field>
                <Field label="Confirm new password" error={passwordForm.formState.errors.confirmPassword?.message} required>
                  <Input type="password" {...passwordForm.register('confirmPassword')} />
                </Field>
              </div>
              <div className="flex justify-end">
                <Button type="submit" size="sm" loading={changePassword.isPending}>
                  Update password
                </Button>
              </div>
            </form>
          </CardBody>
        </Card>
      </div>
    </div>
  )
}

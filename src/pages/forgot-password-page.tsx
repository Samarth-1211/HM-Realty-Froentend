import { useState } from 'react'
import { useNavigate } from '@tanstack/react-router'
import { zodResolver } from '@hookform/resolvers/zod'
import { useForm } from 'react-hook-form'
import { z } from 'zod'
import { toast } from 'sonner'
import { ArrowLeft, KeyRound, Lock, Mail } from 'lucide-react'
import { AuthPageShell } from '@/components/auth/auth-page-shell'
import { Button } from '@/components/ui/button'
import { Field, Input } from '@/components/ui/input'
import { useForgotPassword, useResetPassword } from '@/hooks/use-auth'

const emailSchema = z.object({
  email: z.string().min(1, 'Email is required').email('Enter a valid email address'),
})
type EmailFormValues = z.infer<typeof emailSchema>

const resetSchema = z.object({
  otp: z.string().min(6, 'Enter the 6-digit code').max(6, 'Enter the 6-digit code'),
  newPassword: z.string().min(8, 'Minimum 8 characters'),
})
type ResetFormValues = z.infer<typeof resetSchema>

export function ForgotPasswordPage() {
  const navigate = useNavigate()
  const [email, setEmail] = useState<string | null>(null)
  const forgotPassword = useForgotPassword()
  const resetPassword = useResetPassword()

  const emailForm = useForm<EmailFormValues>({ resolver: zodResolver(emailSchema) })
  const resetForm = useForm<ResetFormValues>({ resolver: zodResolver(resetSchema) })

  const requestOtp = (values: EmailFormValues) => {
    forgotPassword.mutate(values.email, {
      onSuccess: () => {
        setEmail(values.email)
        toast.success('If that email exists, a code has been sent to it.')
      },
    })
  }

  const submitReset = (values: ResetFormValues) => {
    if (!email) return
    resetPassword.mutate(
      { email, otp: values.otp, newPassword: values.newPassword },
      {
        onSuccess: () => {
          toast.success('Password reset — please sign in with your new password.')
          navigate({ to: '/login' })
        },
      },
    )
  }

  if (!email) {
    return (
      <AuthPageShell title="Forgot password" description="Enter your registered email — we'll send you a one-time code.">
        <form onSubmit={emailForm.handleSubmit(requestOtp)} className="flex flex-col gap-4">
          <Field label="Email address" error={emailForm.formState.errors.email?.message} required>
            <Input
              type="email"
              placeholder="you@company.com"
              leftIcon={<Mail className="size-4" />}
              error={!!emailForm.formState.errors.email}
              {...emailForm.register('email')}
            />
          </Field>
          <Button type="submit" size="lg" loading={forgotPassword.isPending} className="mt-2 w-full">
            Send reset code
          </Button>
          <button
            type="button"
            onClick={() => navigate({ to: '/login' })}
            className="mt-2 flex items-center justify-center gap-1 text-sm text-slate-500 hover:text-slate-700"
          >
            <ArrowLeft className="size-4" />
            Back to login
          </button>
        </form>
      </AuthPageShell>
    )
  }

  return (
    <AuthPageShell title="Enter your code" description={`We sent a 6-digit code to ${email}. It's valid for 10 minutes.`}>
      <form onSubmit={resetForm.handleSubmit(submitReset)} className="flex flex-col gap-4">
        <Field label="OTP code" error={resetForm.formState.errors.otp?.message} required>
          <Input
            placeholder="123456"
            leftIcon={<KeyRound className="size-4" />}
            error={!!resetForm.formState.errors.otp}
            {...resetForm.register('otp')}
          />
        </Field>
        <Field label="New password" error={resetForm.formState.errors.newPassword?.message} required hint="Minimum 8 characters">
          <Input
            type="password"
            leftIcon={<Lock className="size-4" />}
            error={!!resetForm.formState.errors.newPassword}
            {...resetForm.register('newPassword')}
          />
        </Field>
        <Button type="submit" size="lg" loading={resetPassword.isPending} className="mt-2 w-full">
          Reset password
        </Button>
        <button
          type="button"
          onClick={() => forgotPassword.mutate(email, { onSuccess: () => toast.success('A new code has been sent.') })}
          className="mt-1 text-center text-sm text-brand-600 hover:text-brand-700"
        >
          Resend code
        </button>
        <button
          type="button"
          onClick={() => setEmail(null)}
          className="flex items-center justify-center gap-1 text-sm text-slate-500 hover:text-slate-700"
        >
          <ArrowLeft className="size-4" />
          Use a different email
        </button>
      </form>
    </AuthPageShell>
  )
}

import { useState } from 'react'
import { zodResolver } from '@hookform/resolvers/zod'
import { useForm } from 'react-hook-form'
import { z } from 'zod'
import { Eye, EyeOff, Lock, Mail, ShieldAlert } from 'lucide-react'
import { useSuperAdminLogin } from '@/hooks/use-auth'
import { Button } from '@/components/ui/button'
import { Field, Input } from '@/components/ui/input'

const schema = z.object({
  email: z.string().min(1, 'Email is required').email('Enter a valid email address'),
  password: z.string().min(6, 'Password must be at least 6 characters'),
})

type FormValues = z.infer<typeof schema>

export function SuperAdminLoginPage() {
  const [showPassword, setShowPassword] = useState(false)
  const login = useSuperAdminLogin()

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<FormValues>({ resolver: zodResolver(schema) })

  return (
    <div className="flex min-h-dvh items-center justify-center bg-slate-950 px-6 py-10">
      <div className="w-full max-w-sm rounded-2xl border border-slate-800 bg-slate-900 p-8 shadow-2xl">
        <div className="flex items-center gap-2 text-amber-400">
          <ShieldAlert className="size-5" />
          <span className="text-xs font-semibold uppercase tracking-wide">Restricted access</span>
        </div>
        <h2 className="mt-2 text-2xl font-bold text-white">Super Admin portal</h2>
        <p className="mt-1 text-sm text-slate-400">
          This console is for authorized platform administrators only.
        </p>

        <form className="mt-8 flex flex-col gap-4" onSubmit={handleSubmit((v) => login.mutate(v))}>
          <Field label="Email address" error={errors.email?.message} required>
            <Input
              type="email"
              placeholder="you@company.com"
              leftIcon={<Mail className="size-4" />}
              error={!!errors.email}
              {...register('email')}
            />
          </Field>

          <Field label="Password" error={errors.password?.message} required>
            <Input
              type={showPassword ? 'text' : 'password'}
              placeholder="••••••••"
              leftIcon={<Lock className="size-4" />}
              error={!!errors.password}
              rightIcon={
                <button
                  type="button"
                  onClick={() => setShowPassword((s) => !s)}
                  className="pointer-events-auto text-slate-500 hover:text-slate-300"
                >
                  {showPassword ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
                </button>
              }
              {...register('password')}
            />
          </Field>

          <Button type="submit" size="lg" loading={login.isPending} className="mt-2 w-full">
            Sign in
          </Button>
        </form>
      </div>
    </div>
  )
}

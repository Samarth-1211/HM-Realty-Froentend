import { useState } from 'react'
import { zodResolver } from '@hookform/resolvers/zod'
import { useForm } from 'react-hook-form'
import { z } from 'zod'
import { motion } from 'framer-motion'
import { Building2, Eye, EyeOff, KeyRound, Lock, Mail, ShieldCheck, Sparkles, TrendingUp, Users } from 'lucide-react'
import { useLogin } from '@/hooks/use-auth'
import { Button } from '@/components/ui/button'
import { Field, Input } from '@/components/ui/input'

const schema = z.object({
  email: z.string().min(1, 'Email is required').email('Enter a valid email address'),
  password: z.string().min(6, 'Password must be at least 6 characters'),
})

type FormValues = z.infer<typeof schema>

const DEMO_ACCOUNTS = [
  { label: 'Super Admin', email: 'superadmin@demorealty.com', password: 'SuperAdmin@123' },
  { label: 'Admin', email: 'admin@demorealty.com', password: 'Admin@123' },
]

export function LoginPage() {
  const [showPassword, setShowPassword] = useState(false)
  const login = useLogin()

  const {
    register,
    handleSubmit,
    setValue,
    formState: { errors },
  } = useForm<FormValues>({ resolver: zodResolver(schema) })

  const fillDemo = (email: string, password: string) => {
    setValue('email', email, { shouldValidate: true })
    setValue('password', password, { shouldValidate: true })
  }

  return (
    <div className="relative flex min-h-dvh overflow-hidden bg-brand-950">
      {/* Animated brand panel */}
      <div className="relative hidden w-1/2 flex-col justify-between overflow-hidden bg-gradient-to-br from-brand-800 via-brand-700 to-brand-900 p-12 text-white lg:flex">
        <div className="pointer-events-none absolute inset-0 overflow-hidden">
          <div className="absolute -left-20 top-10 size-72 animate-blob rounded-full bg-brand-400/30 blur-3xl" />
          <div className="absolute right-0 top-1/3 size-80 animate-blob rounded-full bg-teal-300/20 blur-3xl [animation-delay:2s]" />
          <div className="absolute bottom-0 left-1/4 size-72 animate-blob rounded-full bg-emerald-300/20 blur-3xl [animation-delay:4s]" />
        </div>

        <motion.div
          initial={{ opacity: 0, y: -12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="relative z-10 flex items-center gap-3"
        >
          <div className="flex size-11 items-center justify-center rounded-2xl bg-white/10 ring-1 ring-white/20 backdrop-blur">
            <Building2 className="size-6" />
          </div>
          <div>
            <p className="text-lg font-bold leading-tight">Real Estate CRM</p>
            <p className="text-xs text-brand-200">Sales &amp; lead command center</p>
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.15 }}
          className="relative z-10 max-w-md"
        >
          <h1 className="text-4xl font-bold leading-tight tracking-tight">
            Every lead, every team,
            <br />
            one clear pipeline.
          </h1>
          <p className="mt-4 text-sm leading-relaxed text-brand-100">
            From the first webhook to a closed deal — manage organizations, teams and leads with
            live data across every role.
          </p>

          <div className="mt-10 flex flex-col gap-4">
            {[
              { icon: Sparkles, text: 'Auto-allocates inbound leads to the least-loaded agent' },
              { icon: Users, text: 'Role-aware workspaces for Admins, Managers and Sales staff' },
              { icon: TrendingUp, text: 'Live workload and conversion reporting' },
            ].map((item, i) => (
              <motion.div
                key={item.text}
                initial={{ opacity: 0, x: -12 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.4, delay: 0.3 + i * 0.1 }}
                className="flex items-center gap-3 text-sm text-brand-50"
              >
                <span className="flex size-8 shrink-0 items-center justify-center rounded-lg bg-white/10 ring-1 ring-white/10">
                  <item.icon className="size-4" />
                </span>
                {item.text}
              </motion.div>
            ))}
          </div>
        </motion.div>

        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.6 }}
          className="relative z-10 text-xs text-brand-300"
        >
          © {new Date().getFullYear()} Real Estate CRM. All rights reserved.
        </motion.p>
      </div>

      {/* Form panel */}
      <div className="flex w-full flex-1 items-center justify-center bg-slate-50 px-6 py-10 sm:px-10">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
          className="w-full max-w-sm"
        >
          <div className="mb-8 flex items-center gap-3 lg:hidden">
            <div className="flex size-10 items-center justify-center rounded-xl bg-brand-600 text-white">
              <Building2 className="size-5" />
            </div>
            <p className="text-lg font-bold text-slate-900">Real Estate CRM</p>
          </div>

          <div className="flex items-center gap-2 text-brand-600">
            <ShieldCheck className="size-5" />
            <span className="text-xs font-semibold uppercase tracking-wide">Secure sign in</span>
          </div>
          <h2 className="mt-2 text-2xl font-bold text-slate-900">Welcome back</h2>
          <p className="mt-1 text-sm text-slate-500">Sign in to access your workspace.</p>

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
                    className="pointer-events-auto text-slate-400 hover:text-slate-600"
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

          <div className="mt-8 rounded-2xl border border-brand-100 bg-brand-50/50 p-4">
            <div className="flex items-center gap-1.5 text-xs font-semibold text-brand-700">
              <KeyRound className="size-3.5" />
              Demo accounts
            </div>
            <div className="mt-2.5 flex flex-col gap-1.5">
              {DEMO_ACCOUNTS.map((acc) => (
                <button
                  key={acc.email}
                  type="button"
                  onClick={() => fillDemo(acc.email, acc.password)}
                  className="flex items-center justify-between rounded-xl bg-white px-3 py-2 text-left text-xs ring-1 ring-inset ring-brand-100 transition-colors hover:ring-brand-300"
                >
                  <span className="font-medium text-slate-700">{acc.label}</span>
                  <span className="text-slate-400">{acc.email}</span>
                </button>
              ))}
            </div>
          </div>
        </motion.div>
      </div>
    </div>
  )
}

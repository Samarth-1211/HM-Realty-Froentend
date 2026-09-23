import { useEffect, useRef, useState } from 'react'
import { useNavigate, useSearch } from '@tanstack/react-router'
import { CheckCircle2, XCircle } from 'lucide-react'
import { AuthPageShell } from '@/components/auth/auth-page-shell'
import { Button } from '@/components/ui/button'
import { Spinner } from '@/components/ui/spinner'
import { useVerifyEmail } from '@/hooks/use-auth'
import { extractErrorMessage } from '@/lib/api-client'

export function VerifyEmailPage() {
  const { token } = useSearch({ strict: false }) as { token?: string }
  const navigate = useNavigate()
  const verifyEmail = useVerifyEmail()
  const [error, setError] = useState<string | null>(null)
  const attempted = useRef(false)

  useEffect(() => {
    if (attempted.current) return
    attempted.current = true

    if (!token) {
      setError('This verification link is missing its token.')
      return
    }

    verifyEmail.mutate(token, {
      onError: (err) => setError(extractErrorMessage(err)),
    })
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [token])

  return (
    <AuthPageShell title="Verify your account" description="Confirming your verification link.">
      <div className="flex flex-col items-center gap-4 rounded-2xl border border-slate-100 bg-white p-8 text-center shadow-sm">
        {verifyEmail.isPending && (
          <>
            <Spinner className="size-8" />
            <p className="text-sm text-slate-500">Verifying your account…</p>
          </>
        )}

        {verifyEmail.isSuccess && (
          <>
            <CheckCircle2 className="size-10 text-emerald-500" />
            <p className="text-sm font-medium text-slate-800">Your account is verified.</p>
            <p className="text-sm text-slate-500">You can now sign in with your credentials.</p>
            <Button className="mt-2 w-full" onClick={() => navigate({ to: '/login' })}>
              Go to login
            </Button>
          </>
        )}

        {error && !verifyEmail.isPending && (
          <>
            <XCircle className="size-10 text-red-500" />
            <p className="text-sm font-medium text-slate-800">Verification failed</p>
            <p className="text-sm text-slate-500">{error}</p>
            <p className="text-xs text-slate-400">
              If your link expired, ask your administrator to resend a new verification email.
            </p>
            <Button className="mt-2 w-full" variant="ghost" onClick={() => navigate({ to: '/login' })}>
              Back to login
            </Button>
          </>
        )}
      </div>
    </AuthPageShell>
  )
}

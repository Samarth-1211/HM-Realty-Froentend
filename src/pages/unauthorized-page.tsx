import { ShieldAlert } from 'lucide-react'
import { ButtonLink } from '@/components/ui/button-link'

export function UnauthorizedPage() {
  return (
    <div className="flex min-h-dvh flex-col items-center justify-center gap-4 bg-slate-50 px-6 text-center">
      <div className="flex size-16 items-center justify-center rounded-2xl bg-rose-50 text-rose-600">
        <ShieldAlert className="size-8" />
      </div>
      <h1 className="text-2xl font-bold text-slate-900">Access restricted</h1>
      <p className="max-w-sm text-sm text-slate-500">
        Your role doesn't have permission to view this page. If you think this is a mistake,
        contact your organization's admin.
      </p>
      <ButtonLink to="/dashboard">Back to dashboard</ButtonLink>
    </div>
  )
}

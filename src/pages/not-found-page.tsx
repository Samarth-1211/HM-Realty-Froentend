import { CompassIcon } from 'lucide-react'
import { ButtonLink } from '@/components/ui/button-link'

export function NotFoundPage() {
  return (
    <div className="flex min-h-dvh flex-col items-center justify-center gap-4 bg-slate-50 px-6 text-center">
      <div className="flex size-16 items-center justify-center rounded-2xl bg-brand-50 text-brand-600">
        <CompassIcon className="size-8" />
      </div>
      <h1 className="text-2xl font-bold text-slate-900">Page not found</h1>
      <p className="max-w-sm text-sm text-slate-500">
        The page you're looking for doesn't exist or may have moved.
      </p>
      <ButtonLink to="/dashboard">Back to dashboard</ButtonLink>
    </div>
  )
}

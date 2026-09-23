import type { ReactNode } from 'react'
import { motion } from 'framer-motion'
import { APP_NAME } from '@/lib/constants'
import hmRealtyLogo from '@/assets/hm-realty-logo.jpg'

export function AuthPageShell({
  title,
  description,
  children,
}: {
  title: string
  description: string
  children: ReactNode
}) {
  return (
    <div className="flex min-h-dvh items-center justify-center bg-slate-50 px-6 py-10">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
        className="w-full max-w-sm"
      >
        <div className="mb-8 flex items-center gap-3">
          <div className="flex size-10 items-center justify-center overflow-hidden rounded-xl bg-brand-950">
            <img src={hmRealtyLogo} alt={APP_NAME} className="size-full object-cover" />
          </div>
          <p className="text-lg font-bold text-slate-900">{APP_NAME}</p>
        </div>

        <h2 className="text-2xl font-bold text-slate-900">{title}</h2>
        <p className="mt-1 text-sm text-slate-500">{description}</p>

        <div className="mt-8">{children}</div>
      </motion.div>
    </div>
  )
}

import { useMemo, useState } from 'react'
import { motion } from 'framer-motion'
import { CheckCircle2, PlugZap, ShieldCheck } from 'lucide-react'
import { PageHeader } from '@/components/ui/page-header'
import { PageLoader } from '@/components/ui/spinner'
import { Button } from '@/components/ui/button'
import { PlatformIcon } from '@/components/integrations/platform-icon'
import { IntegrationModal } from '@/components/integrations/integration-modal'
import { usePlatformIntegrations } from '@/hooks/queries/use-platform-integrations'
import { useAuthStore } from '@/store/auth-store'
import { PLATFORM_CATALOG, type PlatformMeta } from '@/lib/platform-catalog'
import { formatDateTime } from '@/lib/utils'
import { UserRole, type LeadSource, type PlatformIntegration } from '@/types'

type DialogState =
  | { type: 'none' }
  | { type: 'connect'; platform: LeadSource }
  | { type: 'manage'; integration: PlatformIntegration }

export function IntegrationsPage() {
  const user = useAuthStore((s) => s.user)
  const canEdit = user?.role === UserRole.ADMIN || user?.role === UserRole.SUPER_ADMIN
  const { data: integrations, isLoading } = usePlatformIntegrations()
  const [dialog, setDialog] = useState<DialogState>({ type: 'none' })

  const byPlatform = useMemo(() => {
    const map = new Map<string, PlatformIntegration>()
    for (const i of integrations ?? []) map.set(i.platform, i)
    return map
  }, [integrations])

  const connectedCount = byPlatform.size
  const categories = ['Property Portals', 'Ads & Social'] as const

  if (isLoading) return <PageLoader label="Loading integrations…" />

  return (
    <div>
      <PageHeader
        title="Integrations"
        description={
          canEdit
            ? 'Connect property portals and ad platforms so their leads land here automatically.'
            : 'Where your organization’s leads come from — view-only.'
        }
      />

      <div className="mb-6 grid grid-cols-1 gap-4 sm:grid-cols-3">
        <SummaryTile
          icon={PlugZap}
          label="Connected platforms"
          value={connectedCount}
          tone="brand"
        />
        <SummaryTile
          icon={CheckCircle2}
          label="Active"
          value={[...byPlatform.values()].filter((i) => i.isActive).length}
          tone="emerald"
        />
        <SummaryTile
          icon={ShieldCheck}
          label="Your access"
          value={canEdit ? 'Full access' : 'View only'}
          tone="sky"
        />
      </div>

      {categories.map((category) => (
        <div key={category} className="mb-8">
          <h3 className="mb-3 text-sm font-semibold text-slate-700">{category}</h3>
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {PLATFORM_CATALOG.filter((p) => p.category === category).map((platform, i) => (
              <PlatformCard
                key={platform.value}
                platform={platform}
                integration={byPlatform.get(platform.value)}
                canEdit={canEdit}
                delay={i * 0.03}
                onConnect={() => setDialog({ type: 'connect', platform: platform.value as LeadSource })}
                onManage={(integration) => setDialog({ type: 'manage', integration })}
              />
            ))}
          </div>
        </div>
      ))}

      {dialog.type === 'connect' && (
        <IntegrationModal
          open
          onClose={() => setDialog({ type: 'none' })}
          mode="connect"
          platform={dialog.platform}
          canEdit={canEdit}
        />
      )}
      {dialog.type === 'manage' && (
        <IntegrationModal
          open
          onClose={() => setDialog({ type: 'none' })}
          mode="manage"
          integration={dialog.integration}
          canEdit={canEdit}
        />
      )}
    </div>
  )
}

function SummaryTile({
  icon: Icon,
  label,
  value,
  tone,
}: {
  icon: typeof PlugZap
  label: string
  value: string | number
  tone: 'brand' | 'emerald' | 'sky'
}) {
  const tones = { brand: 'bg-brand-50 text-brand-600', emerald: 'bg-emerald-50 text-emerald-600', sky: 'bg-sky-50 text-sky-600' }
  return (
    <div className="flex items-center gap-3 rounded-2xl border border-slate-100 bg-white p-4 shadow-sm shadow-slate-200/50">
      <div className={`flex size-10 shrink-0 items-center justify-center rounded-xl ${tones[tone]}`}>
        <Icon className="size-5" />
      </div>
      <div>
        <p className="text-xs font-medium uppercase tracking-wide text-slate-400">{label}</p>
        <p className="text-lg font-bold text-slate-900">{value}</p>
      </div>
    </div>
  )
}

function PlatformCard({
  platform,
  integration,
  canEdit,
  delay,
  onConnect,
  onManage,
}: {
  platform: PlatformMeta
  integration?: PlatformIntegration
  canEdit: boolean
  delay: number
  onConnect: () => void
  onManage: (integration: PlatformIntegration) => void
}) {
  const connected = !!integration

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3, delay }}
      className="group flex flex-col gap-3 rounded-2xl border border-slate-100 bg-white p-4 shadow-sm shadow-slate-200/50 transition-shadow hover:shadow-md"
    >
      <div className="flex items-start justify-between">
        <PlatformIcon platform={platform} />
        {connected && (
          <span
            className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[11px] font-semibold ring-1 ring-inset ${
              integration.isActive
                ? 'bg-emerald-50 text-emerald-700 ring-emerald-600/20'
                : 'bg-slate-100 text-slate-500 ring-slate-400/20'
            }`}
          >
            <span className="size-1.5 rounded-full bg-current" />
            {integration.isActive ? 'Connected' : 'Paused'}
          </span>
        )}
      </div>
      <div>
        <p className="text-sm font-semibold text-slate-800">{platform.label}</p>
        <p className="mt-0.5 text-xs text-slate-400">
          {connected
            ? integration.lastReceivedAt
              ? `Last lead ${formatDateTime(integration.lastReceivedAt)}`
              : integration.rmName || 'No leads received yet'
            : 'Not connected'}
        </p>
      </div>
      {connected ? (
        <Button variant="secondary" size="sm" onClick={() => onManage(integration)} className="mt-auto">
          {canEdit ? 'Manage' : 'View'}
        </Button>
      ) : canEdit ? (
        <Button size="sm" onClick={onConnect} className="mt-auto">
          Connect
        </Button>
      ) : (
        <span className="mt-auto text-xs text-slate-300">Not connected</span>
      )}
    </motion.div>
  )
}

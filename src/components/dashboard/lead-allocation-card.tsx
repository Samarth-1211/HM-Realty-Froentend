import { useState, type ReactNode } from 'react'
import { Bot, FolderKanban, MessageCircle, type LucideIcon } from 'lucide-react'
import { Card, CardBody, CardHeader } from '@/components/ui/card'
import { Toggle } from '@/components/ui/toggle'
import { Badge } from '@/components/ui/badge'
import { ConfirmDialog } from '@/components/ui/confirm-dialog'
import { Spinner } from '@/components/ui/spinner'
import {
  useLeadAllocationSettings,
  useUpdateAutoAllocation,
  useUpdateLeadAllocationMode,
  useUpdatePlatformProjectRouting,
} from '@/hooks/queries/use-lead-allocation'

type PendingChange = { setting: 'autopilot' | 'projectWise' | 'projectWisePlatforms'; value: boolean }

const CONFIRM_COPY: Record<PendingChange['setting'], Record<'on' | 'off', { title: string; description: string; confirmLabel: string }>> = {
  autopilot: {
    on: {
      title: 'Turn AutoPilot on?',
      description: 'New leads will be automatically assigned to your team via round-robin as soon as they come in.',
      confirmLabel: 'Enable AutoPilot',
    },
    off: {
      title: 'Turn AutoPilot off?',
      description: 'New leads will no longer be auto-assigned. They will stay unassigned until a manager assigns them manually.',
      confirmLabel: 'Switch to manual',
    },
  },
  projectWisePlatforms: {
    on: {
      title: 'Turn project-wise routing on for platform leads?',
      description:
        'A lead from a portal or ad platform that names a project — in its project name, property interest or message — will go only to the managers assigned to that project. Leads that name no project keep rotating across all managers.',
      confirmLabel: 'Enable for platform leads',
    },
    off: {
      title: 'Turn project-wise routing off for platform leads?',
      description:
        'Platform leads will still be tagged with their project, but every one will rotate across all managers instead of the project’s own managers.',
      confirmLabel: 'Turn off',
    },
  },
  projectWise: {
    on: {
      title: 'Turn project-wise routing on for WhatsApp leads?',
      description:
        'A WhatsApp lead for a project will go only to the managers assigned to that project. A lead from an ad that is not linked to a project yet will wait unassigned until you link it on the WhatsApp Ads page.',
      confirmLabel: 'Enable project-wise routing',
    },
    off: {
      title: 'Turn project-wise routing off for WhatsApp leads?',
      description:
        'Leads will still be tagged with their project, but every new WhatsApp lead will rotate across all managers instead of the project’s own managers.',
      confirmLabel: 'Turn off',
    },
  },
}

export function LeadAllocationCard() {
  const { data: settings, isLoading } = useLeadAllocationSettings()
  const updateAutoAllocation = useUpdateAutoAllocation()
  const updateMode = useUpdateLeadAllocationMode()
  const updatePlatformRouting = useUpdatePlatformProjectRouting()
  const [pending, setPending] = useState<PendingChange | null>(null)

  const autoAllocationEnabled = settings?.autoAllocationEnabled ?? true
  const projectWise = settings?.mode === 'PROJECT_WISE'
  const projectWisePlatforms = settings?.projectWisePlatformLeads ?? false
  const saving = updateAutoAllocation.isPending || updateMode.isPending || updatePlatformRouting.isPending

  const handleConfirm = () => {
    if (!pending) return
    const onSettled = () => setPending(null)
    if (pending.setting === 'autopilot') updateAutoAllocation.mutate(pending.value, { onSettled })
    else if (pending.setting === 'projectWisePlatforms') updatePlatformRouting.mutate(pending.value, { onSettled })
    else updateMode.mutate(pending.value ? 'PROJECT_WISE' : 'ORG_WIDE', { onSettled })
  }

  const confirm = pending ? CONFIRM_COPY[pending.setting][pending.value ? 'on' : 'off'] : null

  return (
    <Card>
      <CardHeader
        title="Lead allocation"
        subtitle="Control how new leads are assigned to your team"
        action={
          <Badge variant={autoAllocationEnabled ? 'success' : 'neutral'}>
            {autoAllocationEnabled ? 'AutoPilot on' : 'Manual mode'}
          </Badge>
        }
      />
      <CardBody>
        {isLoading ? (
          <div className="flex items-center gap-2 text-sm text-slate-500">
            <Spinner className="size-4" /> Loading settings…
          </div>
        ) : (
          <div className="flex flex-col gap-5">
            <SettingRow
              icon={Bot}
              title="AutoPilot allocation"
              description="When on, every new lead is automatically assigned to your team on a fair round-robin rotation. When off, new leads stay unassigned until a manager assigns them manually."
            >
              <Toggle
                checked={autoAllocationEnabled}
                onChange={(value) => setPending({ setting: 'autopilot', value })}
                disabled={saving}
              />
            </SettingRow>
            <SettingRow
              icon={MessageCircle}
              title="Project-wise routing — WhatsApp leads"
              description="When on, a WhatsApp lead that came from a project’s ad (or names the project) goes only to the managers assigned to that project. When off, WhatsApp leads rotate across all managers."
            >
              <Toggle
                checked={projectWise}
                onChange={(value) => setPending({ setting: 'projectWise', value })}
                disabled={saving}
              />
            </SettingRow>
            <SettingRow
              icon={FolderKanban}
              title="Project-wise routing — platform leads"
              description="When on, a lead from a portal or ad platform that names a project (its name or one of its keywords) goes only to the managers assigned to that project. When off, platform leads rotate across all managers."
            >
              <Toggle
                checked={projectWisePlatforms}
                onChange={(value) => setPending({ setting: 'projectWisePlatforms', value })}
                disabled={saving}
              />
            </SettingRow>
          </div>
        )}
      </CardBody>

      {pending && confirm && (
        <ConfirmDialog
          open
          onClose={() => setPending(null)}
          onConfirm={handleConfirm}
          loading={saving}
          title={confirm.title}
          description={confirm.description}
          confirmLabel={confirm.confirmLabel}
          variant={pending.value ? 'primary' : 'danger'}
        />
      )}
    </Card>
  )
}

function SettingRow({
  icon: Icon,
  title,
  description,
  children,
}: {
  icon: LucideIcon
  title: string
  description: string
  children: ReactNode
}) {
  return (
    <div className="flex items-start justify-between gap-4">
      <div className="flex items-start gap-3">
        <div className="flex size-10 shrink-0 items-center justify-center rounded-full bg-brand-50 text-brand-600">
          <Icon className="size-5" />
        </div>
        <div>
          <p className="text-sm font-medium text-slate-900">{title}</p>
          <p className="mt-0.5 max-w-md text-xs text-slate-500">{description}</p>
        </div>
      </div>
      {children}
    </div>
  )
}

import { useState } from 'react'
import { Bot } from 'lucide-react'
import { Card, CardBody, CardHeader } from '@/components/ui/card'
import { Toggle } from '@/components/ui/toggle'
import { Badge } from '@/components/ui/badge'
import { ConfirmDialog } from '@/components/ui/confirm-dialog'
import { Spinner } from '@/components/ui/spinner'
import { useLeadAllocationSettings, useUpdateAutoAllocation } from '@/hooks/queries/use-lead-allocation'

export function LeadAllocationCard() {
  const { data: settings, isLoading } = useLeadAllocationSettings()
  const updateAutoAllocation = useUpdateAutoAllocation()
  const [pendingValue, setPendingValue] = useState<boolean | null>(null)

  const autoAllocationEnabled = settings?.autoAllocationEnabled ?? true

  const handleToggle = (next: boolean) => {
    setPendingValue(next)
  }

  const handleConfirm = () => {
    if (pendingValue === null) return
    updateAutoAllocation.mutate(pendingValue, {
      onSettled: () => setPendingValue(null),
    })
  }

  return (
    <Card>
      <CardHeader
        title="Lead allocation"
        subtitle="Control how new leads are assigned to your presales team"
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
          <div className="flex items-start justify-between gap-4">
            <div className="flex items-start gap-3">
              <div className="flex size-10 shrink-0 items-center justify-center rounded-full bg-brand-50 text-brand-600">
                <Bot className="size-5" />
              </div>
              <div>
                <p className="text-sm font-medium text-slate-900">AutoPilot allocation</p>
                <p className="mt-0.5 max-w-md text-xs text-slate-500">
                  When on, every new lead is automatically assigned to your presales team on a
                  fair round-robin rotation. When off, new leads stay unassigned until a manager
                  assigns them manually.
                </p>
              </div>
            </div>
            <Toggle
              checked={autoAllocationEnabled}
              onChange={handleToggle}
              disabled={updateAutoAllocation.isPending}
            />
          </div>
        )}
      </CardBody>

      <ConfirmDialog
        open={pendingValue !== null}
        onClose={() => setPendingValue(null)}
        onConfirm={handleConfirm}
        loading={updateAutoAllocation.isPending}
        title={pendingValue ? 'Turn AutoPilot on?' : 'Turn AutoPilot off?'}
        description={
          pendingValue
            ? 'New leads will be automatically assigned to your presales team via round-robin as soon as they come in.'
            : 'New leads will no longer be auto-assigned. They will stay unassigned until a manager assigns them manually.'
        }
        confirmLabel={pendingValue ? 'Enable AutoPilot' : 'Switch to manual'}
        variant={pendingValue ? 'primary' : 'danger'}
      />
    </Card>
  )
}

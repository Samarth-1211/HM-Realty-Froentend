import { useEffect } from 'react'
import { PageHeader } from '@/components/ui/page-header'
import { HealthPanel } from '@/components/whatsapp-debug/health-panel'
import { EventLogPanel } from '@/components/whatsapp-debug/event-log-panel'
import { SendTestPanel } from '@/components/whatsapp-debug/send-test-panel'
import { SimulatePanel } from '@/components/whatsapp-debug/simulate-panel'
import { PipelineTracePanel } from '@/components/whatsapp-debug/pipeline-trace-panel'
import { FrontendConsolePanel } from '@/components/whatsapp-debug/frontend-console-panel'
import { useWhatsAppHealth } from '@/hooks/queries/use-whatsapp-debug'
import { waDebug } from '@/lib/wa-debug-logger'

// Admin/Super Admin only (route guard + server-side RolesGuard). Nothing on
// this page ever receives the access token, App Secret or verify token.
export function WhatsAppDebugPage() {
  const { data: health } = useWhatsAppHealth()

  useEffect(() => waDebug.captureWindowErrors(), [])

  return (
    <div className="flex flex-col gap-5">
      <PageHeader
        title="WhatsApp Debug Console"
        description="Check the Meta setup, watch webhooks arrive live, and trace a message from Meta to the inbox."
      />

      <HealthPanel />

      <div className="grid grid-cols-1 gap-5 xl:grid-cols-2">
        <PipelineTracePanel />
        <div className="flex flex-col gap-5">
          <SendTestPanel />
          <SimulatePanel enabled={health?.simulateEnabled} />
        </div>
      </div>

      <EventLogPanel />
      <FrontendConsolePanel />
    </div>
  )
}

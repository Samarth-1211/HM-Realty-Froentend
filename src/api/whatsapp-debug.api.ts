import { apiClient } from '@/lib/api-client'
import { waDebug } from '@/lib/wa-debug-logger'

export type HealthStatus = 'pass' | 'warn' | 'fail'

export interface WhatsAppHealthCheck {
  id: string
  label: string
  status: HealthStatus
  reason: string
  details?: Record<string, unknown>
}

export interface WhatsAppHealth {
  checkedAt: string
  graphApiVersion: string
  simulateEnabled: boolean
  checks: WhatsAppHealthCheck[]
}

export type WebhookEventFilter = 'all' | 'messages' | 'statuses' | 'errors' | 'invalid-signature'

export interface WebhookEventRow {
  id: string
  receivedAt: string
  eventType: string
  object: string | null
  phoneNumberId: string | null
  signatureValid: boolean | null
  processingStatus: 'PENDING' | 'PROCESSED' | 'IGNORED' | 'FAILED'
  errorMessage: string | null
  processedAt: string | null
}

export interface WebhookEventDetail extends WebhookEventRow {
  rawPayload: unknown
}

export interface GraphCallResult {
  request: { method: string; url: string; headers?: Record<string, string>; body?: unknown; signed?: boolean; payload?: unknown }
  response: { ok?: boolean; status: number; body: unknown }
}

export interface SimulateResult extends GraphCallResult {
  wamid: string
  savedMessageId: string | null
  leadId: string | null
  leadName: string | null
}

export interface PipelineTrace {
  eventId: string | null
  receivedAt: string | null
  leadId?: string | null
  stages: { key: string; label: string; status: HealthStatus | 'skipped'; detail: string }[]
}

export const whatsappDebugApi = {
  health: () =>
    waDebug.track('GET /whatsapp/debug/health', () =>
      apiClient.get<WhatsAppHealth>('/whatsapp/debug/health').then((r) => r.data),
    ),

  subscribeApp: () =>
    waDebug.track('POST /whatsapp/debug/subscribe-app', () =>
      apiClient.post<{ ok: boolean; status: number; body: unknown }>('/whatsapp/debug/subscribe-app').then((r) => r.data),
    ),

  events: (filter: WebhookEventFilter) =>
    waDebug.track('GET /whatsapp/debug/events', () =>
      apiClient.get<WebhookEventRow[]>('/whatsapp/debug/events', { params: { filter } }).then((r) => r.data),
    ),

  event: (id: string) =>
    waDebug.track('GET /whatsapp/debug/events/:id', () =>
      apiClient.get<WebhookEventDetail>(`/whatsapp/debug/events/${id}`).then((r) => r.data),
    ),

  sendTest: (payload: { to: string; type: 'hello_world' | 'text'; text?: string }) =>
    waDebug.track('POST /whatsapp/debug/send-test', () =>
      apiClient.post<GraphCallResult>('/whatsapp/debug/send-test', payload).then((r) => r.data),
    ),

  simulateInbound: (payload: { from?: string; text?: string; name?: string; adId?: string; adHeadline?: string }) =>
    waDebug.track('POST /whatsapp/debug/simulate-inbound', () =>
      apiClient.post<SimulateResult>('/whatsapp/debug/simulate-inbound', payload).then((r) => r.data),
    ),

  trace: () =>
    waDebug.track('GET /whatsapp/debug/trace', () =>
      apiClient.get<PipelineTrace>('/whatsapp/debug/trace').then((r) => r.data),
    ),
}

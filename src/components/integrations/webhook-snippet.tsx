import { KeyRound, Link2, ShieldAlert } from 'lucide-react'
import { CopyButton } from '@/components/ui/copy-button'

// The CRM assigns each lead's ID and received time itself on arrival, so
// neither is part of the format shared with RMs.
const SAMPLE_PAYLOAD = {
  fullName: 'Priya Sharma',
  phone: '+919812345678',
  email: 'priya@example.com',
  projectName: 'Sunrise Meadows Phase 2',
  propertyInterest: '2BHK',
  unitType: '2BHK',
  budgetMin: 3500000,
  budgetMax: 5000000,
  city: 'Indore',
  message: 'Looking for a corner plot',
}

export function WebhookSnippet({
  webhookUrl,
  secret,
}: {
  webhookUrl: string
  secret?: string
}) {
  const secretPlaceholder = secret ?? '<your-webhook-secret>'
  const payloadJson = JSON.stringify(SAMPLE_PAYLOAD, null, 2)
  const curl = `curl -X POST "${webhookUrl}" \\\n  -H "Content-Type: application/json" \\\n  -H "x-webhook-secret: ${secretPlaceholder}" \\\n  -d '${JSON.stringify(SAMPLE_PAYLOAD)}'`

  return (
    <div className="flex flex-col gap-4">
      <div>
        <div className="mb-1.5 flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wide text-slate-400">
          <Link2 className="size-3.5" />
          Webhook URL
        </div>
        <div className="flex items-center gap-2 rounded-xl bg-slate-900 px-3 py-2.5">
          <code className="flex-1 overflow-x-auto whitespace-nowrap font-mono text-xs text-emerald-300">
            {webhookUrl}
          </code>
          <CopyButton value={webhookUrl} className="bg-white/10 text-white hover:bg-white/20" />
        </div>
        <p className="mt-1.5 text-xs text-slate-400">
          Send this URL to the platform's RM — every lead they POST here lands in your Leads inbox.
        </p>
      </div>

      <div>
        <div className="mb-1.5 flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wide text-slate-400">
          <KeyRound className="size-3.5" />
          Webhook secret
        </div>
        {secret ? (
          <div className="flex items-center gap-2 rounded-xl bg-slate-900 px-3 py-2.5">
            <code className="flex-1 overflow-x-auto whitespace-nowrap font-mono text-xs text-amber-300">
              {secret}
            </code>
            <CopyButton value={secret} className="bg-white/10 text-white hover:bg-white/20" />
          </div>
        ) : (
          <div className="rounded-xl border border-dashed border-slate-200 bg-slate-50 px-3 py-2.5 text-xs text-slate-400">
            Hidden — use "Reveal secret" above to fetch it (best-effort: the platform can send this
            as an <code className="rounded bg-slate-200 px-1 py-0.5">x-webhook-secret</code> header,
            but leads are still accepted without it).
          </div>
        )}
        {secret && (
          <p className="mt-1.5 flex items-center gap-1 text-xs text-amber-600">
            <ShieldAlert className="size-3.5 shrink-0" />
            Treat this like a password — anyone with it can post leads to your CRM.
          </p>
        )}
      </div>

      <div>
        <p className="mb-1.5 text-xs font-semibold uppercase tracking-wide text-slate-400">
          Sample payload (JSON)
        </p>
        <div className="relative rounded-xl bg-slate-900 px-3 py-2.5">
          <CopyButton value={payloadJson} className="absolute right-2 top-2 bg-white/10 text-white hover:bg-white/20" />
          <pre className="scrollbar-thin max-h-48 overflow-auto pr-16 font-mono text-[11px] leading-relaxed text-slate-200">
{payloadJson}
          </pre>
        </div>
        <p className="mt-1.5 text-xs text-slate-400">
          Only fullName and phone are required — everything else is optional. Extra fields the platform sends are
          fine: they're kept with the lead, never rejected. The lead ID and received time are assigned automatically
          by the CRM when the lead arrives, and a phone number that's already in the CRM is never saved twice — the
          enquiry is added to the existing lead instead.
        </p>
      </div>

      <div>
        <p className="mb-1.5 text-xs font-semibold uppercase tracking-wide text-slate-400">Try it with curl</p>
        <div className="relative rounded-xl bg-slate-900 px-3 py-2.5">
          <CopyButton value={curl} className="absolute right-2 top-2 bg-white/10 text-white hover:bg-white/20" />
          <pre className="scrollbar-thin max-h-40 overflow-auto pr-16 font-mono text-[11px] leading-relaxed text-slate-200">
{curl}
          </pre>
        </div>
      </div>
    </div>
  )
}

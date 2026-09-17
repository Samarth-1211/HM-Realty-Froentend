import { useNavigate } from '@tanstack/react-router'
import { Sparkles } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { WhatsAppMark } from '@/components/integrations/whatsapp-mark'
import { cn } from '@/lib/utils'

const SAMPLE_INBOX = [
  { name: 'Priya Sharma', snippet: 'Perfect, see you then. Thank you!', time: '10:42 AM', active: true },
  { name: 'Rahul Mehta', snippet: 'Can you send the floor plan again?', time: '9:15 AM', active: false },
  { name: 'Ananya Rao', snippet: 'We are looking for a 2BHK near...', time: 'Yesterday', active: false },
]

const SAMPLE_THREAD: { dir: 'in' | 'out'; text: string; time: string }[] = [
  { dir: 'in', text: 'Hi, I saw your listing for Sunrise Meadows. Is the 3BHK still available?', time: '9:05 AM' },
  { dir: 'out', text: "Hi Priya! Yes, we have a few 3BHK units available. What's your budget range?", time: '9:07 AM' },
  { dir: 'in', text: 'Around 65-85 lakhs. Can we schedule a site visit this weekend?', time: '9:40 AM' },
  { dir: 'out', text: "Absolutely! I'll block Saturday 11 AM for you.", time: '9:42 AM' },
]

/**
 * Purely illustrative — no real data, no API calls. Shown when an org has
 * no CONNECTED WhatsApp integration (or Admin/Super Admin can't be bothered
 * to set one up yet) so the Messaging screen never looks broken or empty;
 * it shows what the feature looks like once real conversations start
 * flowing in.
 */
export function WhatsAppDemoPreview({ canEdit }: { canEdit: boolean }) {
  const navigate = useNavigate()

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-col items-start gap-3 rounded-2xl border border-dashed border-brand-200 bg-brand-50/50 p-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-start gap-3">
          <span className="flex size-9 shrink-0 items-center justify-center rounded-xl bg-brand-100 text-brand-600">
            <Sparkles className="size-4.5" />
          </span>
          <div>
            <p className="text-sm font-semibold text-slate-800">This is a preview, not live data</p>
            <p className="mt-0.5 text-xs text-slate-500">
              WhatsApp isn't connected for your organization yet. Once it is, real conversations from your leads will
              show up here automatically.
            </p>
          </div>
        </div>
        {canEdit ? (
          <Button size="sm" onClick={() => navigate({ to: '/integrations' })} className="shrink-0">
            Connect WhatsApp
          </Button>
        ) : (
          <p className="shrink-0 text-xs text-slate-400">Ask an Admin to connect WhatsApp</p>
        )}
      </div>

      <div className="grid grid-cols-1 overflow-hidden rounded-2xl border border-slate-100 opacity-90 grayscale-[15%] sm:grid-cols-[280px_1fr]">
        <div className="border-b border-slate-100 sm:border-b-0 sm:border-r">
          {SAMPLE_INBOX.map((item) => (
            <div
              key={item.name}
              className={cn('flex items-center gap-3 border-b border-slate-50 px-4 py-3', item.active && 'bg-brand-50/60')}
            >
              <WhatsAppMark size="sm" />
              <div className="min-w-0 flex-1">
                <div className="flex items-center justify-between gap-2">
                  <p className="truncate text-sm font-medium text-slate-700">{item.name}</p>
                  <span className="shrink-0 text-[10px] text-slate-400">{item.time}</span>
                </div>
                <p className="truncate text-xs text-slate-400">{item.snippet}</p>
              </div>
            </div>
          ))}
        </div>

        <div className="flex flex-col bg-[#e5ded8]">
          <div className="space-y-2.5 p-4">
            {SAMPLE_THREAD.map((m, i) => (
              <div key={i} className={cn('flex', m.dir === 'out' ? 'justify-end' : 'justify-start')}>
                <div
                  className={cn(
                    'max-w-[75%] rounded-2xl px-3.5 py-2 text-sm shadow-sm',
                    m.dir === 'out' ? 'rounded-br-sm bg-emerald-600 text-white' : 'rounded-bl-sm bg-white text-slate-700 ring-1 ring-slate-100',
                  )}
                >
                  <p>{m.text}</p>
                  <p className={cn('mt-1 text-right text-[10px]', m.dir === 'out' ? 'text-emerald-100' : 'text-slate-400')}>{m.time}</p>
                </div>
              </div>
            ))}
          </div>
          <div className="mt-auto border-t border-slate-200 bg-white p-3">
            <div className="h-10 rounded-xl bg-slate-100" />
          </div>
        </div>
      </div>
    </div>
  )
}

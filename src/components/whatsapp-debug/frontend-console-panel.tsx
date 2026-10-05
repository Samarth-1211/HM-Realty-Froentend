import { Eraser } from 'lucide-react'
import { Card, CardBody, CardHeader } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { CopyButton } from '@/components/ui/copy-button'
import { useWaDebugLog, waDebug } from '@/lib/wa-debug-logger'
import { cn } from '@/lib/utils'

function stamp(at: number) {
  const d = new Date(at)
  return `${d.toLocaleTimeString('en-IN', { hour12: false })}.${String(d.getMilliseconds()).padStart(3, '0')}`
}

export function FrontendConsolePanel() {
  const entries = useWaDebugLog()

  return (
    <Card>
      <CardHeader
        title="Frontend console"
        subtitle={`WhatsApp events recorded in this browser tab (last 200, ${entries.length} now). Also printed to the browser console as [WA].`}
        action={
          <div className="flex items-center gap-2">
            <CopyButton value={waDebug.asText()} />
            <Button variant="ghost" size="sm" onClick={() => waDebug.clear()}>
              <Eraser className="size-3.5" />
              Clear
            </Button>
          </div>
        }
      />
      <CardBody>
        {entries.length === 0 ? (
          <p className="text-sm text-slate-400">Nothing logged yet.</p>
        ) : (
          <div className="max-h-80 overflow-auto rounded-xl bg-slate-900 p-3 font-mono text-[11px] leading-relaxed">
            {[...entries].reverse().map((e) => (
              <div key={e.id} className="flex gap-2">
                <span className="shrink-0 text-slate-500">{stamp(e.at)}</span>
                <span
                  className={cn(
                    'w-10 shrink-0 uppercase',
                    e.level === 'error' ? 'text-rose-400' : e.level === 'warn' ? 'text-amber-300' : 'text-sky-300',
                  )}
                >
                  {e.level}
                </span>
                <span className="min-w-0 break-words text-slate-200">
                  {e.message}
                  {e.count > 1 && <span className="text-slate-500"> ×{e.count}</span>}
                  {e.data !== undefined && <span className="text-slate-500"> {JSON.stringify(e.data)}</span>}
                </span>
              </div>
            ))}
          </div>
        )}
      </CardBody>
    </Card>
  )
}

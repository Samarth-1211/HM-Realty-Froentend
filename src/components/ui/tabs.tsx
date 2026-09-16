import { cn } from '@/lib/utils'

export function Tabs({
  tabs,
  active,
  onChange,
}: {
  tabs: { value: string; label: string; count?: number }[]
  active: string
  onChange: (value: string) => void
}) {
  return (
    <div className="scrollbar-thin no-scrollbar flex gap-1 overflow-x-auto rounded-xl bg-slate-100 p-1">
      {tabs.map((tab) => (
        <button
          key={tab.value}
          onClick={() => onChange(tab.value)}
          className={cn(
            'flex shrink-0 items-center gap-1.5 rounded-lg px-3.5 py-2 text-sm font-medium transition-colors',
            active === tab.value ? 'bg-white text-brand-700 shadow-sm' : 'text-slate-500 hover:text-slate-700',
          )}
        >
          {tab.label}
          {tab.count !== undefined && (
            <span
              className={cn(
                'rounded-full px-1.5 py-0.5 text-xs',
                active === tab.value ? 'bg-brand-50 text-brand-700' : 'bg-slate-200 text-slate-500',
              )}
            >
              {tab.count}
            </span>
          )}
        </button>
      ))}
    </div>
  )
}

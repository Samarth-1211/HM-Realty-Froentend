import { useState } from 'react'
import { Check, ChevronDown, X } from 'lucide-react'
import { cn } from '@/lib/utils'

export function MultiSelect({
  options,
  value,
  onChange,
  placeholder = 'Select…',
  formatLabel,
}: {
  options: string[]
  value: string[]
  onChange: (value: string[]) => void
  placeholder?: string
  formatLabel?: (option: string) => string
}) {
  const [open, setOpen] = useState(false)

  const toggle = (opt: string) => {
    onChange(value.includes(opt) ? value.filter((v) => v !== opt) : [...value, opt])
  }

  return (
    <div className="relative">
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        className="flex min-h-10 w-full flex-wrap items-center gap-1.5 rounded-xl border-0 bg-white px-3 py-2 text-left text-sm ring-1 ring-inset ring-slate-200 focus:outline-none focus:ring-2 focus:ring-brand-500"
      >
        {value.length === 0 && <span className="text-slate-400">{placeholder}</span>}
        {value.map((v) => (
          <span
            key={v}
            className="inline-flex items-center gap-1 rounded-full bg-brand-50 px-2 py-0.5 text-xs font-medium text-brand-700 ring-1 ring-inset ring-brand-600/20"
          >
            {formatLabel ? formatLabel(v) : v}
            <X
              className="size-3 cursor-pointer"
              onClick={(e) => {
                e.stopPropagation()
                toggle(v)
              }}
            />
          </span>
        ))}
        <ChevronDown className="ml-auto size-4 shrink-0 text-slate-400" />
      </button>
      {open && (
        <>
          <div className="fixed inset-0 z-10" onClick={() => setOpen(false)} />
          <div className="scrollbar-thin absolute z-20 mt-1.5 max-h-56 w-full overflow-y-auto rounded-xl bg-white p-1.5 shadow-lg ring-1 ring-slate-200">
            {options.map((opt) => {
              const selected = value.includes(opt)
              return (
                <button
                  type="button"
                  key={opt}
                  onClick={() => toggle(opt)}
                  className={cn(
                    'flex w-full items-center justify-between rounded-lg px-3 py-2 text-left text-sm hover:bg-brand-50',
                    selected && 'text-brand-700 font-medium',
                  )}
                >
                  {formatLabel ? formatLabel(opt) : opt}
                  {selected && <Check className="size-4" />}
                </button>
              )
            })}
          </div>
        </>
      )}
    </div>
  )
}

import { useState } from 'react'
import { Check, ChevronDown, Search, X } from 'lucide-react'
import { cn } from '@/lib/utils'

export function MultiSelect({
  options,
  value,
  onChange,
  placeholder = 'Select…',
  formatLabel,
  searchable = false,
  searchPlaceholder = 'Search…',
  emptyLabel = 'No options',
}: {
  options: string[]
  value: string[]
  onChange: (value: string[]) => void
  placeholder?: string
  formatLabel?: (option: string) => string
  /** Adds a filter box at the top of the dropdown — use for long option lists. */
  searchable?: boolean
  searchPlaceholder?: string
  emptyLabel?: string
}) {
  const [open, setOpen] = useState(false)
  const [query, setQuery] = useState('')

  const label = (opt: string) => (formatLabel ? formatLabel(opt) : opt)

  const toggle = (opt: string) => {
    onChange(value.includes(opt) ? value.filter((v) => v !== opt) : [...value, opt])
  }

  const needle = query.trim().toLowerCase()
  const visibleOptions = needle ? options.filter((opt) => label(opt).toLowerCase().includes(needle)) : options

  const close = () => {
    setOpen(false)
    setQuery('')
  }

  return (
    <div className="relative">
      <button
        type="button"
        onClick={() => (open ? close() : setOpen(true))}
        className="flex min-h-10 w-full flex-wrap items-center gap-1.5 rounded-xl border-0 bg-white px-3 py-2 text-left text-sm ring-1 ring-inset ring-slate-200 focus:outline-none focus:ring-2 focus:ring-brand-500"
      >
        {value.length === 0 && <span className="text-slate-400">{placeholder}</span>}
        {value.map((v) => (
          <span
            key={v}
            className="inline-flex items-center gap-1 rounded-full bg-brand-50 px-2 py-0.5 text-xs font-medium text-brand-700 ring-1 ring-inset ring-brand-600/20"
          >
            {label(v)}
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
          <div className="fixed inset-0 z-10" onClick={close} />
          <div className="absolute z-20 mt-1.5 w-full overflow-hidden rounded-xl bg-white shadow-lg ring-1 ring-slate-200">
            {searchable && (
              <div className="border-b border-slate-100 p-1.5">
                <div className="relative">
                  <Search className="pointer-events-none absolute left-2.5 top-1/2 size-3.5 -translate-y-1/2 text-slate-400" />
                  <input
                    autoFocus
                    value={query}
                    onChange={(e) => setQuery(e.target.value)}
                    placeholder={searchPlaceholder}
                    className="h-8 w-full rounded-lg bg-slate-50 pl-8 pr-2.5 text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-brand-500"
                  />
                </div>
              </div>
            )}
            <div className="scrollbar-thin max-h-56 overflow-y-auto p-1.5">
              {visibleOptions.length === 0 && (
                <p className="px-3 py-2 text-sm text-slate-400">{needle ? 'No matches' : emptyLabel}</p>
              )}
              {visibleOptions.map((opt) => {
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
                    {label(opt)}
                    {selected && <Check className="size-4" />}
                  </button>
                )
              })}
            </div>
          </div>
        </>
      )}
    </div>
  )
}

import { type ReactNode, useId, useState } from 'react'
import { FileUp, X } from 'lucide-react'
import { toast } from 'sonner'
import { cn, formatFileSize } from '@/lib/utils'

/**
 * Click-or-drop picker for a single file. Checks the extension against
 * `accept` and the size against `maxBytes` before handing the file over —
 * the server checks again, this just saves a pointless upload.
 */
export function FileDropZone({
  accept,
  maxBytes,
  file,
  onFile,
  onClear,
  title,
  hint,
  icon,
  disabled,
}: {
  /** Comma-separated extensions, e.g. ".xlsx,.csv". */
  accept: string
  maxBytes: number
  file: File | null
  onFile: (file: File) => void
  onClear: () => void
  title: string
  hint?: string
  icon?: ReactNode
  disabled?: boolean
}) {
  const inputId = useId()
  const [dragging, setDragging] = useState(false)

  const pick = (candidate: File | undefined) => {
    if (!candidate) return
    const extensions = accept.split(',').map((e) => e.trim().toLowerCase())
    const name = candidate.name.toLowerCase()
    if (!extensions.some((ext) => name.endsWith(ext))) {
      toast.error('That file type isn’t supported', { description: `Choose a ${extensions.join(', ')} file.` })
      return
    }
    if (candidate.size > maxBytes) {
      toast.error('That file is too large', { description: `The limit is ${formatFileSize(maxBytes)}.` })
      return
    }
    onFile(candidate)
  }

  if (file) {
    return (
      <div className="flex items-center gap-3 rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5">
        <span className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-white text-slate-500 ring-1 ring-slate-200">
          {icon ?? <FileUp className="size-4" />}
        </span>
        <div className="min-w-0 flex-1">
          <p className="truncate text-sm font-medium text-slate-800">{file.name}</p>
          <p className="text-xs text-slate-400">{formatFileSize(file.size)}</p>
        </div>
        {!disabled && (
          <button
            type="button"
            onClick={onClear}
            className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-200 hover:text-slate-600"
            aria-label="Remove file"
          >
            <X className="size-4" />
          </button>
        )}
      </div>
    )
  }

  return (
    <label
      htmlFor={inputId}
      onDragOver={(e) => {
        e.preventDefault()
        if (!disabled) setDragging(true)
      }}
      onDragLeave={() => setDragging(false)}
      onDrop={(e) => {
        e.preventDefault()
        setDragging(false)
        if (!disabled) pick(e.dataTransfer.files[0])
      }}
      className={cn(
        'flex cursor-pointer flex-col items-center gap-1.5 rounded-xl border-2 border-dashed px-4 py-6 text-center transition-colors',
        dragging ? 'border-brand-400 bg-brand-50' : 'border-slate-200 hover:border-slate-300 hover:bg-slate-50',
        disabled && 'cursor-not-allowed opacity-60',
      )}
    >
      <span className="flex size-10 items-center justify-center rounded-full bg-slate-100 text-slate-500">
        {icon ?? <FileUp className="size-5" />}
      </span>
      <span className="text-sm font-medium text-slate-700">{title}</span>
      {hint && <span className="text-xs text-slate-400">{hint}</span>}
      <input
        id={inputId}
        type="file"
        accept={accept}
        disabled={disabled}
        className="sr-only"
        onChange={(e) => {
          pick(e.target.files?.[0])
          // Lets the same file be picked again after clearing it.
          e.target.value = ''
        }}
      />
    </label>
  )
}

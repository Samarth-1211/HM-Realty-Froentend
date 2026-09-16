import { type InputHTMLAttributes, type LabelHTMLAttributes, type ReactNode, forwardRef } from 'react'
import { cn } from '@/lib/utils'

export const Label = ({ className, ...props }: LabelHTMLAttributes<HTMLLabelElement>) => (
  <label className={cn('mb-1.5 block text-sm font-medium text-slate-700', className)} {...props} />
)

export interface FieldProps {
  label?: string
  error?: string
  hint?: string
  required?: boolean
  children: ReactNode
  className?: string
}

export const Field = ({ label, error, hint, required, children, className }: FieldProps) => (
  <div className={cn('flex flex-col', className)}>
    {label && (
      <Label>
        {label}
        {required && <span className="text-rose-500"> *</span>}
      </Label>
    )}
    {children}
    {hint && !error && <p className="mt-1 text-xs text-slate-400">{hint}</p>}
    {error && <p className="mt-1 text-xs font-medium text-rose-600">{error}</p>}
  </div>
)

export interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  error?: boolean
  leftIcon?: ReactNode
  rightIcon?: ReactNode
}

export const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ className, error, leftIcon, rightIcon, ...props }, ref) => (
    <div className="relative">
      {leftIcon && (
        <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-400">
          {leftIcon}
        </span>
      )}
      <input
        ref={ref}
        className={cn(
          'h-10 w-full rounded-xl border-0 bg-white px-3.5 text-sm text-slate-900 ring-1 ring-inset ring-slate-200 transition-shadow placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-brand-500',
          leftIcon && 'pl-10',
          rightIcon && 'pr-10',
          error && 'ring-rose-400 focus:ring-rose-500',
          props.disabled && 'cursor-not-allowed bg-slate-50 text-slate-400',
          className,
        )}
        {...props}
      />
      {rightIcon && (
        <span className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400">{rightIcon}</span>
      )}
    </div>
  ),
)
Input.displayName = 'Input'

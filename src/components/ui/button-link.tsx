import { Link, type LinkComponentProps } from '@tanstack/react-router'
import { buttonSizes, buttonVariants } from './button'
import { cn } from '@/lib/utils'

export function ButtonLink({
  className,
  variant = 'primary',
  size = 'md',
  ...props
}: LinkComponentProps & {
  variant?: keyof typeof buttonVariants
  size?: keyof typeof buttonSizes
}) {
  return (
    <Link
      className={cn(
        'inline-flex items-center justify-center rounded-xl font-semibold transition-colors duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-500 focus-visible:ring-offset-2',
        buttonVariants[variant],
        buttonSizes[size],
        className,
      )}
      {...props}
    />
  )
}

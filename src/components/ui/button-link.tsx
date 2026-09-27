import type { AnchorHTMLAttributes } from 'react'
import { Link, type LinkComponentProps } from '@tanstack/react-router'
import { buttonSizes, buttonVariants } from './button'
import { cn } from '@/lib/utils'

const buttonBase =
  'inline-flex items-center justify-center rounded-xl font-semibold transition-colors duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-500 focus-visible:ring-offset-2'

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
        buttonBase,
        buttonVariants[variant],
        buttonSizes[size],
        className,
      )}
      {...props}
    />
  )
}

/** A button-styled plain link, for URLs outside the app (opened in a new tab). */
export function ButtonAnchor({
  className,
  variant = 'primary',
  size = 'md',
  ...props
}: AnchorHTMLAttributes<HTMLAnchorElement> & {
  variant?: keyof typeof buttonVariants
  size?: keyof typeof buttonSizes
}) {
  return (
    <a
      target="_blank"
      rel="noopener noreferrer"
      className={cn(buttonBase, buttonVariants[variant], buttonSizes[size], className)}
      {...props}
    />
  )
}

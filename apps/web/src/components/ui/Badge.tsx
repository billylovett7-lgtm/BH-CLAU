import type { ReactNode } from 'react'

type BadgeVariant = 'default' | 'lime' | 'cyan' | 'blue' | 'purple' | 'success' | 'warning' | 'danger'

interface BadgeProps {
  variant?:  BadgeVariant
  children:  ReactNode
  className?: string
}

export function Badge({ variant = 'default', children, className }: BadgeProps) {
  const classes = ['badge', `badge--${variant}`, className].filter(Boolean).join(' ')
  return <span className={classes}>{children}</span>
}

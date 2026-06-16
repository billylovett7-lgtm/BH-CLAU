import type { ButtonHTMLAttributes, ReactNode } from 'react'
import { Spinner } from './Spinner'

type Variant = 'primary' | 'secondary' | 'ghost' | 'danger'
type Size    = 'sm' | 'md' | 'lg'

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?:  Variant
  size?:     Size
  loading?:  boolean
  iconOnly?: boolean
  children?: ReactNode
}

export function Button({
  variant  = 'secondary',
  size     = 'md',
  loading  = false,
  iconOnly = false,
  children,
  className,
  disabled,
  ...props
}: ButtonProps) {
  const classes = [
    'btn',
    `btn--${variant}`,
    `btn--${size}`,
    iconOnly  ? 'btn--icon'    : '',
    loading   ? 'btn--loading' : '',
    className ?? '',
  ].filter(Boolean).join(' ')

  return (
    <button className={classes} disabled={disabled || loading} {...props}>
      {loading && <Spinner size="xs" />}
      {children}
    </button>
  )
}

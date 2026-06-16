import type { HTMLAttributes, ReactNode } from 'react'

interface CardProps extends HTMLAttributes<HTMLDivElement> {
  padding?:   'none' | 'md' | 'lg'
  hoverable?: boolean
  children:   ReactNode
}

export function Card({
  padding   = 'none',
  hoverable = false,
  children,
  className,
  ...props
}: CardProps) {
  const classes = [
    'card',
    padding   === 'md' ? 'card--padded'    : '',
    padding   === 'lg' ? 'card--padded-lg' : '',
    hoverable ? 'card--hover' : '',
    className ?? '',
  ].filter(Boolean).join(' ')

  return <div className={classes} {...props}>{children}</div>
}

interface CardHeaderProps {
  title:    string
  actions?: ReactNode
}

export function CardHeader({ title, actions }: CardHeaderProps) {
  return (
    <div className="card__header">
      <span className="card__title">{title}</span>
      {actions && <div>{actions}</div>}
    </div>
  )
}

export function CardBody({ children, className }: { children: ReactNode; className?: string }) {
  return <div className={['card__body', className].filter(Boolean).join(' ')}>{children}</div>
}

export function CardFooter({ children }: { children: ReactNode }) {
  return <div className="card__footer">{children}</div>
}

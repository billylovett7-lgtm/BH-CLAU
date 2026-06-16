import * as RadixTooltip from '@radix-ui/react-tooltip'
import type { ReactElement, ReactNode } from 'react'

interface TooltipProps {
  content:    ReactNode
  children:   ReactElement
  side?:      'top' | 'right' | 'bottom' | 'left'
  delayMs?:   number
  disabled?:  boolean
}

export function Tooltip({
  content,
  children,
  side    = 'top',
  delayMs = 400,
  disabled,
}: TooltipProps) {
  if (disabled) return children

  return (
    <RadixTooltip.Provider delayDuration={delayMs}>
      <RadixTooltip.Root>
        <RadixTooltip.Trigger asChild>{children}</RadixTooltip.Trigger>
        <RadixTooltip.Portal>
          <RadixTooltip.Content className="tooltip-content" side={side} sideOffset={6}>
            {content}
            <RadixTooltip.Arrow className="tooltip-arrow" />
          </RadixTooltip.Content>
        </RadixTooltip.Portal>
      </RadixTooltip.Root>
    </RadixTooltip.Provider>
  )
}

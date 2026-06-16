import * as DropdownMenu from '@radix-ui/react-dropdown-menu'
import type { ReactElement, ReactNode } from 'react'

type DropdownSeparator = 'separator'

interface DropdownItemDef {
  label:     string
  icon?:     ReactNode
  onClick?:  () => void
  disabled?: boolean
  danger?:   boolean
  href?:     string
}

type DropdownEntry = DropdownItemDef | DropdownSeparator

interface DropdownProps {
  trigger: ReactElement
  items:   DropdownEntry[]
  align?:  'start' | 'center' | 'end'
  side?:   'top' | 'right' | 'bottom' | 'left'
}

export function Dropdown({
  trigger,
  items,
  align = 'end',
  side  = 'bottom',
}: DropdownProps) {
  return (
    <DropdownMenu.Root>
      <DropdownMenu.Trigger asChild>{trigger}</DropdownMenu.Trigger>
      <DropdownMenu.Portal>
        <DropdownMenu.Content
          className="dropdown-content"
          align={align}
          side={side}
          sideOffset={6}
        >
          {items.map((item, i) => {
            if (item === 'separator') {
              return <DropdownMenu.Separator key={i} className="dropdown-separator" />
            }
            return (
              <DropdownMenu.Item
                key={i}
                disabled={item.disabled}
                onSelect={item.onClick}
                className={[
                  'dropdown-item',
                  item.danger ? 'dropdown-item--danger' : '',
                ].filter(Boolean).join(' ')}
              >
                {item.icon && <span style={{ display: 'flex', alignItems: 'center' }}>{item.icon}</span>}
                {item.label}
              </DropdownMenu.Item>
            )
          })}
        </DropdownMenu.Content>
      </DropdownMenu.Portal>
    </DropdownMenu.Root>
  )
}

// Named re-exports for custom composition
export const DropdownRoot      = DropdownMenu.Root
export const DropdownTrigger   = DropdownMenu.Trigger
export const DropdownContent   = DropdownMenu.Content
export const DropdownItem      = DropdownMenu.Item
export const DropdownSeparator = DropdownMenu.Separator
export const DropdownLabel     = DropdownMenu.Label
export const DropdownPortal    = DropdownMenu.Portal

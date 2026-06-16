import * as RadixTabs from '@radix-ui/react-tabs'
import type { ReactNode } from 'react'

interface TabItem {
  value:     string
  label:     ReactNode
  disabled?: boolean
}

interface TabsProps {
  value?:          string
  defaultValue?:   string
  onValueChange?:  (value: string) => void
  tabs:            TabItem[]
  children:        ReactNode
  className?:      string
}

export function Tabs({
  value,
  defaultValue,
  onValueChange,
  tabs,
  children,
  className,
}: TabsProps) {
  return (
    <RadixTabs.Root
      value={value}
      defaultValue={defaultValue ?? tabs[0]?.value}
      onValueChange={onValueChange}
      className={className}
    >
      <RadixTabs.List className="tabs-list" aria-label="Navigation tabs">
        {tabs.map(tab => (
          <RadixTabs.Trigger
            key={tab.value}
            value={tab.value}
            disabled={tab.disabled}
            className="tabs-trigger"
          >
            {tab.label}
          </RadixTabs.Trigger>
        ))}
      </RadixTabs.List>
      {children}
    </RadixTabs.Root>
  )
}

export function TabPanel({ value, children }: { value: string; children: ReactNode }) {
  return (
    <RadixTabs.Content value={value} className="tabs-content">
      {children}
    </RadixTabs.Content>
  )
}

// Named re-exports for flexibility
export const TabsRoot     = RadixTabs.Root
export const TabsList     = RadixTabs.List
export const TabsTrigger  = RadixTabs.Trigger
export const TabsContent  = RadixTabs.Content

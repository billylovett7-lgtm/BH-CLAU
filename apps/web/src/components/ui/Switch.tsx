import * as RadixSwitch from '@radix-ui/react-switch'

interface SwitchProps {
  checked?:         boolean
  onCheckedChange?: (checked: boolean) => void
  disabled?:        boolean
  label?:           string
  description?:     string
  id?:              string
  className?:       string
}

export function Switch({
  checked,
  onCheckedChange,
  disabled,
  label,
  description,
  id,
  className,
}: SwitchProps) {
  const switchId = id ?? (label ? `switch-${label.toLowerCase().replace(/\s+/g, '-')}` : undefined)

  return (
    <div className={['switch-wrapper', className].filter(Boolean).join(' ')}>
      <RadixSwitch.Root
        id={switchId}
        checked={checked}
        onCheckedChange={onCheckedChange}
        disabled={disabled}
        className="switch-root"
      >
        <RadixSwitch.Thumb className="switch-thumb" />
      </RadixSwitch.Root>
      {(label || description) && (
        <div>
          {label && (
            <label className="switch-label" htmlFor={switchId}>
              {label}
            </label>
          )}
          {description && (
            <p style={{ fontSize: 'var(--text-sm)', color: 'var(--color-text-muted)', marginTop: 2 }}>
              {description}
            </p>
          )}
        </div>
      )}
    </div>
  )
}

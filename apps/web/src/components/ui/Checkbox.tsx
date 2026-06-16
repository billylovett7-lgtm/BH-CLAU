import * as RadixCheckbox from '@radix-ui/react-checkbox'

interface CheckboxProps {
  checked?:          boolean | 'indeterminate'
  onCheckedChange?:  (checked: boolean) => void
  disabled?:         boolean
  label?:            string
  id?:               string
  className?:        string
}

export function Checkbox({
  checked,
  onCheckedChange,
  disabled,
  label,
  id,
  className,
}: CheckboxProps) {
  const checkId = id ?? (label ? `checkbox-${label.toLowerCase().replace(/\s+/g, '-')}` : undefined)

  return (
    <div className={['checkbox-wrapper', className].filter(Boolean).join(' ')}>
      <RadixCheckbox.Root
        id={checkId}
        checked={checked}
        onCheckedChange={val => onCheckedChange?.(val === true)}
        disabled={disabled}
        className="checkbox-root"
      >
        <RadixCheckbox.Indicator className="checkbox-indicator">
          {checked === 'indeterminate' ? <MinusIcon /> : <CheckIcon />}
        </RadixCheckbox.Indicator>
      </RadixCheckbox.Root>
      {label && (
        <label className="checkbox-label" htmlFor={checkId}>
          {label}
        </label>
      )}
    </div>
  )
}

function CheckIcon() {
  return (
    <svg width="10" height="10" viewBox="0 0 10 10" fill="none" aria-hidden>
      <path d="M1.5 5l2.5 2.5 5-5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  )
}

function MinusIcon() {
  return (
    <svg width="10" height="10" viewBox="0 0 10 10" fill="none" aria-hidden>
      <path d="M2 5h6" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
    </svg>
  )
}

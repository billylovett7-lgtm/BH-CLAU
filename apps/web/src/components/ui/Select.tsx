import * as RadixSelect from '@radix-ui/react-select'

interface SelectOption {
  value:     string
  label:     string
  disabled?: boolean
}

interface SelectProps {
  value?:          string
  defaultValue?:   string
  onValueChange?:  (value: string) => void
  placeholder?:    string
  label?:          string
  error?:          string
  hint?:           string
  options:         SelectOption[]
  disabled?:       boolean
  required?:       boolean
  id?:             string
}

export function Select({
  value,
  defaultValue,
  onValueChange,
  placeholder = 'Select…',
  label,
  error,
  hint,
  options,
  disabled,
  required,
  id,
}: SelectProps) {
  const inputId = id ?? (label ? label.toLowerCase().replace(/\s+/g, '-') : undefined)

  return (
    <div className="field">
      {label && (
        <label className="field__label" htmlFor={inputId}>
          {label}
          {required && <span className="field__required" aria-hidden>*</span>}
        </label>
      )}

      <RadixSelect.Root
        value={value}
        defaultValue={defaultValue}
        onValueChange={onValueChange}
        disabled={disabled}
      >
        <RadixSelect.Trigger
          id={inputId}
          className={['select-trigger', error ? 'field__control--error' : ''].filter(Boolean).join(' ')}
          aria-label={label}
        >
          <RadixSelect.Value placeholder={placeholder} className="select-value" />
          <RadixSelect.Icon className="select-icon">
            <ChevronIcon />
          </RadixSelect.Icon>
        </RadixSelect.Trigger>

        <RadixSelect.Portal>
          <RadixSelect.Content className="select-content" position="popper" sideOffset={4}>
            <RadixSelect.Viewport className="select-viewport">
              {options.map(opt => (
                <RadixSelect.Item
                  key={opt.value}
                  value={opt.value}
                  disabled={opt.disabled}
                  className="select-item"
                >
                  <RadixSelect.ItemText>{opt.label}</RadixSelect.ItemText>
                  <RadixSelect.ItemIndicator className="select-item-indicator">
                    <CheckIcon />
                  </RadixSelect.ItemIndicator>
                </RadixSelect.Item>
              ))}
            </RadixSelect.Viewport>
          </RadixSelect.Content>
        </RadixSelect.Portal>
      </RadixSelect.Root>

      {hint  && <span className="field__hint">{hint}</span>}
      {error && <span className="field__error" role="alert">{error}</span>}
    </div>
  )
}

function ChevronIcon() {
  return (
    <svg width="12" height="12" viewBox="0 0 12 12" fill="none" aria-hidden>
      <path d="M2 4l4 4 4-4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  )
}

function CheckIcon() {
  return (
    <svg width="12" height="12" viewBox="0 0 12 12" fill="none" aria-hidden>
      <path d="M2 6l3 3 5-5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  )
}

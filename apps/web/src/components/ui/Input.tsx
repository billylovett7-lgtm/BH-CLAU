import { forwardRef, type InputHTMLAttributes } from 'react'

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?:    string
  error?:    string
  hint?:     string
  required?: boolean
}

export const Input = forwardRef<HTMLInputElement, InputProps>(function Input(
  { label, error, hint, required, className, id, ...props },
  ref,
) {
  const inputId = id ?? (label ? label.toLowerCase().replace(/\s+/g, '-') : undefined)

  return (
    <div className="field">
      {label && (
        <label className="field__label" htmlFor={inputId}>
          {label}
          {required && <span className="field__required" aria-hidden>*</span>}
        </label>
      )}
      <input
        ref={ref}
        id={inputId}
        className={[
          'field__control',
          error ? 'field__control--error' : '',
          className ?? '',
        ].filter(Boolean).join(' ')}
        aria-invalid={error ? 'true' : undefined}
        aria-describedby={
          [error ? `${inputId}-error` : '', hint ? `${inputId}-hint` : '']
            .filter(Boolean).join(' ') || undefined
        }
        {...props}
      />
      {hint  && <span id={`${inputId}-hint`}  className="field__hint">{hint}</span>}
      {error && <span id={`${inputId}-error`} className="field__error" role="alert">{error}</span>}
    </div>
  )
})

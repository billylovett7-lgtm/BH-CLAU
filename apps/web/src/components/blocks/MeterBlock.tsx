import { useState, useRef, useEffect } from 'react'
import type { MeterBlock as MeterBlockType, Block } from '@codex/shared'

interface Props {
  block: MeterBlockType
  onUpdate?: (block: Block) => void
}

export function MeterBlock({ block, onUpdate }: Props) {
  const { label, value, min, max, unit, variant } = block.data
  const pct = Math.min(100, Math.max(0, ((value - min) / (max - min)) * 100))

  const [editing, setEditing] = useState(false)
  const [draft, setDraft]     = useState(String(value))
  const inputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    if (editing) inputRef.current?.focus()
  }, [editing])

  function startEdit() {
    if (!onUpdate) return
    setDraft(String(value))
    setEditing(true)
  }

  function save() {
    if (!onUpdate) return
    const parsed = parseFloat(draft)
    if (!isNaN(parsed)) {
      const clamped = Math.min(max, Math.max(min, parsed))
      onUpdate({ ...block, data: { ...block.data, value: clamped } })
    }
    setEditing(false)
  }

  function handleKeyDown(e: React.KeyboardEvent) {
    if (e.key === 'Enter') { e.preventDefault(); save() }
    if (e.key === 'Escape') { e.preventDefault(); setEditing(false) }
  }

  return (
    <div className="block">
      <div className="block__body">
        <div className="block-meter">
          <span className="block-meter__label">{label}</span>
          <div className="block-meter__track" role="progressbar" aria-valuenow={value} aria-valuemin={min} aria-valuemax={max}>
            <div
              className={['block-meter__fill', variant !== 'progress' ? `block-meter__fill--${variant}` : ''].filter(Boolean).join(' ')}
              style={{ width: `${pct}%` }}
            />
          </div>
          {editing ? (
            <input
              ref={inputRef}
              className="block-meter__input"
              type="number"
              value={draft}
              min={min}
              max={max}
              step={variant === 'loudness' ? 0.1 : 1}
              onChange={e => setDraft(e.target.value)}
              onBlur={save}
              onKeyDown={handleKeyDown}
              aria-label={`${label} value`}
            />
          ) : (
            <span
              className={`block-meter__value${onUpdate ? ' block-meter__value--editable' : ''}`}
              onClick={startEdit}
              role={onUpdate ? 'button' : undefined}
              tabIndex={onUpdate ? 0 : undefined}
              onKeyDown={e => { if (e.key === 'Enter' || e.key === ' ') startEdit() }}
            >
              {value}{unit ? ` ${unit}` : ''}
            </span>
          )}
        </div>
      </div>
    </div>
  )
}

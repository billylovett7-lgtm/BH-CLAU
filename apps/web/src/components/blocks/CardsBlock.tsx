import { useState, useEffect, useRef } from 'react'
import type { CardsBlock as CardsBlockType, Block } from '@codex/shared'

interface Props {
  block: CardsBlockType
  onUpdate?: (block: Block) => void
}

export function CardsBlock({ block, onUpdate }: Props) {
  const [editIdx, setEditIdx] = useState<number | null>(null)
  const [draft, setDraft] = useState('')
  const inputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    if (editIdx !== null) inputRef.current?.focus()
  }, [editIdx])

  function startEdit(i: number) {
    if (!onUpdate) return
    setEditIdx(i)
    setDraft(block.data.cards[i].value)
  }

  function save() {
    if (editIdx === null || !onUpdate) return
    const cards = block.data.cards.map((c, i) =>
      i === editIdx ? { ...c, value: draft } : c
    )
    onUpdate({ ...block, data: { cards } })
    setEditIdx(null)
  }

  function cancel() {
    setEditIdx(null)
    setDraft('')
  }

  function handleKeyDown(e: React.KeyboardEvent) {
    if (e.key === 'Enter') { e.preventDefault(); save() }
    if (e.key === 'Escape') { e.preventDefault(); cancel() }
  }

  return (
    <div className="block">
      {block.title && (
        <div className="block__header">
          <span className="block__title">{block.title}</span>
        </div>
      )}
      <div className="block__body">
        <div className="block-cards__grid">
          {block.data.cards.map((card, i) => (
            <div
              key={i}
              className={[
                'block-card',
                card.variant !== 'default' ? `block-card--${card.variant}` : '',
                onUpdate ? 'block-card--editable' : '',
              ].filter(Boolean).join(' ')}
              onClick={() => startEdit(i)}
              role={onUpdate ? 'button' : undefined}
              tabIndex={onUpdate ? 0 : undefined}
              onKeyDown={e => { if (e.key === 'Enter' || e.key === ' ') startEdit(i) }}
              aria-label={onUpdate ? `Edit ${card.label}` : undefined}
            >
              <span className="block-card__label">{card.label}</span>
              {editIdx === i
                ? (
                  <input
                    ref={inputRef}
                    className="block-card__input"
                    value={draft}
                    onChange={e => setDraft(e.target.value)}
                    onBlur={save}
                    onKeyDown={handleKeyDown}
                    onClick={e => e.stopPropagation()}
                    aria-label={`Edit ${card.label} value`}
                  />
                )
                : <span className="block-card__value">{card.value || <em className="block-card__placeholder">—</em>}</span>
              }
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

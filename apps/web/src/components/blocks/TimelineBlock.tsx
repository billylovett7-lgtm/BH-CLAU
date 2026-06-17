import { useState, useRef, useEffect } from 'react'
import type { TimelineBlock as TimelineBlockType, Block } from '@codex/shared'

interface Props {
  block: TimelineBlockType
  onUpdate?: (block: Block) => void
}

const ENERGY_OPTS = ['', 'low', 'build', 'peak', 'drop', 'breakdown'] as const
type Energy = typeof ENERGY_OPTS[number]

export function TimelineBlock({ block, onUpdate }: Props) {
  const [editIdx, setEditIdx]   = useState<number | null>(null)
  const [draftNotes, setNotes]  = useState('')
  const [draftEnergy, setEnergy] = useState<Energy>('')
  const textareaRef = useRef<HTMLTextAreaElement>(null)

  useEffect(() => {
    if (editIdx !== null) textareaRef.current?.focus()
  }, [editIdx])

  function startEdit(i: number) {
    if (!onUpdate) return
    const s = block.data.sections[i]
    setEditIdx(i)
    setNotes(s.notes ?? '')
    setEnergy((s.energy ?? '') as Energy)
  }

  function save() {
    if (editIdx === null || !onUpdate) return
    const sections = block.data.sections.map((s, i) =>
      i === editIdx
        ? { ...s, notes: draftNotes || undefined, energy: draftEnergy || undefined }
        : s
    )
    onUpdate({ ...block, data: { sections } })
    setEditIdx(null)
  }

  function cancel() { setEditIdx(null) }

  return (
    <div className="block">
      {block.title && (
        <div className="block__header">
          <span className="block__title">{block.title}</span>
        </div>
      )}
      <div className="block__body">
        <div className="block-timeline__sections">
          {block.data.sections.map((section, i) => (
            <div
              key={i}
              className={[
                'block-timeline__section',
                section.energy ? `block-timeline__section--${section.energy}` : '',
                onUpdate ? 'block-timeline__section--editable' : '',
              ].filter(Boolean).join(' ')}
            >
              <div className="block-timeline__bars">
                {section.startBar}–{section.endBar}
              </div>
              <div style={{ flex: 1 }}>
                <div className="block-timeline__label">{section.label}</div>
                {editIdx === i ? (
                  <div className="block-timeline__edit" onClick={e => e.stopPropagation()}>
                    <textarea
                      ref={textareaRef}
                      className="block-timeline__notes-input"
                      value={draftNotes}
                      onChange={e => setNotes(e.target.value)}
                      placeholder="Section notes…"
                      rows={2}
                    />
                    <div className="block-timeline__edit-row">
                      <select
                        className="block-timeline__energy-select"
                        value={draftEnergy}
                        onChange={e => setEnergy(e.target.value as Energy)}
                      >
                        <option value="">No energy tag</option>
                        {ENERGY_OPTS.filter(e => e).map(e => (
                          <option key={e} value={e}>{e}</option>
                        ))}
                      </select>
                      <button type="button" className="block-timeline__save-btn" onClick={save}>Save</button>
                      <button type="button" className="block-timeline__cancel-btn" onClick={cancel}>Cancel</button>
                    </div>
                  </div>
                ) : (
                  <>
                    {section.notes && <div className="block-timeline__notes">{section.notes}</div>}
                    {section.fxEvents.length > 0 && (
                      <div className="block-timeline__notes" style={{ marginTop: 'var(--space-1)', color: 'var(--color-text-faint)' }}>
                        {section.fxEvents.join(' · ')}
                      </div>
                    )}
                    {onUpdate && !section.notes && (
                      <div className="block-timeline__hint">Click to add notes</div>
                    )}
                  </>
                )}
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 'var(--space-1)' }}>
                {section.energy && (
                  <div className="block-timeline__energy">{section.energy}</div>
                )}
                {onUpdate && editIdx !== i && (
                  <button
                    type="button"
                    className="block-timeline__edit-btn"
                    onClick={() => startEdit(i)}
                    aria-label={`Edit ${section.label}`}
                  >
                    Edit
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

import { useState, useRef, useEffect } from 'react'
import type { TextBlock as TextBlockType } from '@codex/shared'
import type { Block } from '@codex/shared'

interface Props {
  block:     TextBlockType
  onUpdate?: (block: Block) => void
}

export function TextBlock({ block, onUpdate }: Props) {
  const [editing, setEditing] = useState(false)
  const [draft,   setDraft]   = useState(block.data.content)
  const textareaRef           = useRef<HTMLTextAreaElement>(null)

  useEffect(() => { setDraft(block.data.content) }, [block.data.content])

  useEffect(() => {
    if (editing && textareaRef.current) {
      textareaRef.current.focus()
      textareaRef.current.setSelectionRange(draft.length, draft.length)
    }
  }, [editing])

  function save() {
    const trimmed = draft.trim()
    if (onUpdate && trimmed !== block.data.content) {
      onUpdate({ ...block, data: { content: trimmed } })
    }
    setEditing(false)
  }

  function handleKeyDown(e: React.KeyboardEvent) {
    if (e.key === 'Escape') { setDraft(block.data.content); setEditing(false) }
    if (e.key === 'Enter' && (e.ctrlKey || e.metaKey)) save()
  }

  if (editing) {
    return (
      <div className="block">
        {block.title && (
          <div className="block__header"><span className="block__title">{block.title}</span></div>
        )}
        <div className="block__body">
          <textarea
            ref={textareaRef}
            className="block-text__editor"
            value={draft}
            onChange={e => setDraft(e.target.value)}
            onBlur={save}
            onKeyDown={handleKeyDown}
            rows={Math.max(3, draft.split('\n').length + 1)}
          />
          <div className="block-text__hint">Ctrl+Enter to save · Esc to cancel</div>
        </div>
      </div>
    )
  }

  return (
    <div
      className={`block${onUpdate ? ' block--editable' : ''}`}
      onClick={() => { if (onUpdate) setEditing(true) }}
      title={onUpdate ? 'Click to edit' : undefined}
    >
      {block.title && (
        <div className="block__header"><span className="block__title">{block.title}</span></div>
      )}
      <div className="block__body">
        <p className="block-text__content">
          {block.data.content || <span style={{ color: 'var(--color-text-faint)', fontStyle: 'italic' }}>Click to add text…</span>}
        </p>
      </div>
    </div>
  )
}

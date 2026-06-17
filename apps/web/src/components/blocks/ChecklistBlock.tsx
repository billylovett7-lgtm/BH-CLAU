import { useState, useRef, useEffect } from 'react'
import type { ChecklistBlock as ChecklistBlockType, Block } from '@codex/shared'

interface Props {
  block:     ChecklistBlockType
  onUpdate?: (block: Block) => void
}

export function ChecklistBlock({ block, onUpdate }: Props) {
  const total     = block.data.items.length
  const completed = block.data.items.filter(i => i.completed).length
  const [editId, setEditId] = useState<string | null>(null)
  const [draft,  setDraft]  = useState('')
  const [adding, setAdding] = useState(false)
  const [newText, setNewText] = useState('')
  const editRef = useRef<HTMLInputElement>(null)
  const addRef  = useRef<HTMLInputElement>(null)

  useEffect(() => { if (editId) editRef.current?.focus() }, [editId])
  useEffect(() => { if (adding) addRef.current?.focus() }, [adding])

  function toggle(itemId: string) {
    if (!onUpdate) return
    const items = block.data.items.map(i =>
      i.id === itemId ? { ...i, completed: !i.completed } : i,
    )
    onUpdate({ ...block, data: { items } })
  }

  function startEdit(id: string, text: string) {
    if (!onUpdate) return
    setEditId(id)
    setDraft(text)
  }

  function saveEdit() {
    if (!onUpdate || !editId) return
    const text = draft.trim()
    if (text) {
      const items = block.data.items.map(i => i.id === editId ? { ...i, text } : i)
      onUpdate({ ...block, data: { items } })
    }
    setEditId(null)
  }

  function deleteItem(id: string) {
    if (!onUpdate) return
    const items = block.data.items.filter(i => i.id !== id)
    onUpdate({ ...block, data: { items } })
  }

  function addItem() {
    const text = newText.trim()
    if (!text || !onUpdate) return
    const items = [...block.data.items, {
      id:        crypto.randomUUID(),
      text,
      completed: false,
      priority:  'medium' as const,
    }]
    onUpdate({ ...block, data: { items } })
    setNewText('')
  }

  function handleAddKeyDown(e: React.KeyboardEvent) {
    if (e.key === 'Enter') { e.preventDefault(); addItem() }
    if (e.key === 'Escape') { setAdding(false); setNewText('') }
  }

  return (
    <div className="block">
      <div className="block__header">
        <span className="block__title">{block.title ?? 'Checklist'}</span>
        <span className="block__type-label">{completed}/{total}</span>
      </div>
      <div className="block__body">
        <ul className="block-checklist__list">
          {block.data.items.map(item => (
            <li
              key={item.id}
              className={['block-checklist__item', item.completed ? 'block-checklist__item--done' : ''].filter(Boolean).join(' ')}
            >
              <div
                className={['block-checklist__check', item.completed ? 'block-checklist__check--done' : ''].filter(Boolean).join(' ')}
                role={onUpdate ? 'checkbox' : undefined}
                aria-checked={onUpdate ? item.completed : undefined}
                tabIndex={onUpdate ? 0 : undefined}
                onClick={() => toggle(item.id)}
                onKeyDown={e => { if (onUpdate && (e.key === ' ' || e.key === 'Enter')) { e.preventDefault(); toggle(item.id) } }}
              >
                {item.completed && (
                  <svg width="9" height="9" viewBox="0 0 9 9" fill="none" aria-hidden>
                    <path d="M1 4.5l2.5 2.5L8 1.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                )}
              </div>

              {editId === item.id
                ? (
                  <input
                    ref={editRef}
                    className="block-checklist__edit-input"
                    value={draft}
                    onChange={e => setDraft(e.target.value)}
                    onBlur={saveEdit}
                    onKeyDown={e => {
                      if (e.key === 'Enter') { e.preventDefault(); saveEdit() }
                      if (e.key === 'Escape') { e.preventDefault(); setEditId(null) }
                    }}
                    onClick={e => e.stopPropagation()}
                  />
                )
                : (
                  <span
                    className="block-checklist__text"
                    onClick={() => onUpdate && startEdit(item.id, item.text)}
                    title={onUpdate ? 'Click to edit' : undefined}
                    style={{ cursor: onUpdate ? 'text' : 'default', flex: 1 }}
                  >
                    {item.text}
                  </span>
                )
              }

              <span className={`block-checklist__priority block-checklist__priority--${item.priority}`}>
                {item.priority}
              </span>

              {onUpdate && (
                <button
                  type="button"
                  className="block-checklist__del"
                  onClick={() => deleteItem(item.id)}
                  aria-label="Remove item"
                >
                  ×
                </button>
              )}
            </li>
          ))}
        </ul>

        {onUpdate && (
          <div className="block-checklist__footer">
            {adding
              ? (
                <div className="block-checklist__add-form">
                  <input
                    ref={addRef}
                    className="block-checklist__add-input"
                    value={newText}
                    onChange={e => setNewText(e.target.value)}
                    onKeyDown={handleAddKeyDown}
                    placeholder="New item…"
                  />
                  <button type="button" className="block-checklist__add-confirm" onClick={addItem} disabled={!newText.trim()}>Add</button>
                  <button type="button" className="block-checklist__add-cancel" onClick={() => { setAdding(false); setNewText('') }}>Cancel</button>
                </div>
              )
              : (
                <button type="button" className="block-checklist__add-btn" onClick={() => setAdding(true)}>
                  + Add item
                </button>
              )
            }
          </div>
        )}
      </div>
    </div>
  )
}

import type { ChecklistBlock as ChecklistBlockType } from '@codex/shared'
import type { Block } from '@codex/shared'

interface Props {
  block:     ChecklistBlockType
  onUpdate?: (block: Block) => void
}

export function ChecklistBlock({ block, onUpdate }: Props) {
  const total     = block.data.items.length
  const completed = block.data.items.filter(i => i.completed).length

  function handleToggle(itemId: string) {
    if (!onUpdate) return
    const items = block.data.items.map(i =>
      i.id === itemId ? { ...i, completed: !i.completed } : i,
    )
    onUpdate({ ...block, data: { items } })
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
              onClick={() => handleToggle(item.id)}
              style={{ cursor: onUpdate ? 'pointer' : 'default' }}
            >
              <div className={['block-checklist__check', item.completed ? 'block-checklist__check--done' : ''].filter(Boolean).join(' ')}
                role={onUpdate ? 'checkbox' : undefined}
                aria-checked={onUpdate ? item.completed : undefined}
                tabIndex={onUpdate ? 0 : undefined}
                onKeyDown={e => { if (onUpdate && (e.key === ' ' || e.key === 'Enter')) { e.preventDefault(); handleToggle(item.id) } }}
              >
                {item.completed && (
                  <svg width="9" height="9" viewBox="0 0 9 9" fill="none" aria-hidden>
                    <path d="M1 4.5l2.5 2.5L8 1.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                )}
              </div>
              <span className="block-checklist__text">{item.text}</span>
              <span className={`block-checklist__priority block-checklist__priority--${item.priority}`}>
                {item.priority}
              </span>
            </li>
          ))}
        </ul>
      </div>
    </div>
  )
}

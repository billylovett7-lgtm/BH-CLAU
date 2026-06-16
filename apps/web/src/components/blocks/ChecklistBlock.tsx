import type { ChecklistBlock as ChecklistBlockType } from '@codex/shared'

interface Props { block: ChecklistBlockType }

export function ChecklistBlock({ block }: Props) {
  const total     = block.data.items.length
  const completed = block.data.items.filter(i => i.completed).length

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
              <div className={['block-checklist__check', item.completed ? 'block-checklist__check--done' : ''].filter(Boolean).join(' ')}>
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

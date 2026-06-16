import type { TimelineBlock as TimelineBlockType } from '@codex/shared'

interface Props { block: TimelineBlockType }

export function TimelineBlock({ block }: Props) {
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
              ].filter(Boolean).join(' ')}
            >
              <div className="block-timeline__bars">
                {section.startBar}–{section.endBar}
              </div>
              <div>
                <div className="block-timeline__label">{section.label}</div>
                {section.notes && <div className="block-timeline__notes">{section.notes}</div>}
                {section.fxEvents.length > 0 && (
                  <div className="block-timeline__notes" style={{ marginTop: 'var(--space-1)', color: 'var(--color-text-faint)' }}>
                    {section.fxEvents.join(' · ')}
                  </div>
                )}
              </div>
              {section.energy && (
                <div className="block-timeline__energy">{section.energy}</div>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

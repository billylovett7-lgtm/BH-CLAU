import type { CardsBlock as CardsBlockType } from '@codex/shared'

interface Props { block: CardsBlockType }

export function CardsBlock({ block }: Props) {
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
              ].filter(Boolean).join(' ')}
            >
              <span className="block-card__label">{card.label}</span>
              <span className="block-card__value">{card.value}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

import type { SampleCardBlock as SampleCardBlockType } from '@codex/shared'

interface Props { block: SampleCardBlockType }

export function SampleCardBlock({ block }: Props) {
  const { name, role, notes } = block.data

  return (
    <div className="block">
      {block.title && (
        <div className="block__header">
          <span className="block__type-label">Sample</span>
          <span className="block__title">{block.title}</span>
        </div>
      )}
      <div className="block__body">
        <div className="block-sample">
          <div className="block-sample__icon" aria-hidden>
            <WaveIcon />
          </div>
          <div>
            <div className="block-sample__name">{name}</div>
            {role && <div className="block-sample__role">{role}</div>}
            {notes && <div className="block-sample__notes">{notes}</div>}
          </div>
        </div>
      </div>
    </div>
  )
}

function WaveIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 20 20" fill="none" aria-hidden>
      <path d="M1 10h2l2-6 2 12 2-8 2 4 2-2h4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  )
}

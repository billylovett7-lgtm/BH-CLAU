import type { MidiGridBlock as MidiGridBlockType } from '@codex/shared'

interface Props { block: MidiGridBlockType }

export function MidiGridBlock({ block }: Props) {
  const { gridType, bars, grid, swing, lanes } = block.data

  return (
    <div className="block">
      <div className="block__header">
        <span className="block__title">{block.title ?? 'MIDI Grid'}</span>
        <span className="block__type-label">{gridType}</span>
      </div>
      <div className="block__body">
        <div className="block-midi__meta">
          <span>{bars} bar{bars !== 1 ? 's' : ''}</span>
          <span>{grid} steps</span>
          {swing > 0 && <span>Swing {swing}%</span>}
        </div>
        <div className="block-midi__grid">
          {lanes.map((lane, li) => (
            <div key={li} className="block-midi__lane">
              <span className="block-midi__lane-name">{lane.name}</span>
              <div className="block-midi__steps">
                {lane.steps.map((step, si) => (
                  <div
                    key={si}
                    className={[
                      'block-midi__step',
                      step.active ? 'block-midi__step--active' : '',
                      si % 4 === 0 ? 'block-midi__step--beat' : '',
                    ].filter(Boolean).join(' ')}
                    title={step.active ? `vel ${step.velocity}` : undefined}
                    style={step.active ? { opacity: Math.max(0.4, step.velocity / 127) } : undefined}
                  />
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

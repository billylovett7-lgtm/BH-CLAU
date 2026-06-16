import type { PresetCardBlock as PresetCardBlockType } from '@codex/shared'
import { Badge } from '@/components/ui'

interface Props { block: PresetCardBlockType }

export function PresetCardBlock({ block }: Props) {
  const { name, synth, macros, notes } = block.data

  return (
    <div className="block">
      <div className="block__header">
        <span className="block__type-label">Preset</span>
        <span className="block__title">{name}</span>
        {synth && <Badge variant="cyan">{synth}</Badge>}
      </div>
      <div className="block__body">
        {macros.length > 0 && (
          <div className="block-preset__macros">
            {macros.map((m, i) => (
              <div key={i} className="block-preset__macro">
                <div className="block-preset__macro-num">Macro {m.name}</div>
                <div className="block-preset__macro-name">{m.value}</div>
              </div>
            ))}
          </div>
        )}
        {notes && <p className="block-preset__notes">{notes}</p>}
      </div>
    </div>
  )
}

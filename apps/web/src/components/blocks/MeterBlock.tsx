import type { MeterBlock as MeterBlockType } from '@codex/shared'

interface Props { block: MeterBlockType }

export function MeterBlock({ block }: Props) {
  const { label, value, min, max, unit, variant } = block.data
  const pct = Math.min(100, Math.max(0, ((value - min) / (max - min)) * 100))

  return (
    <div className="block">
      <div className="block__body">
        <div className="block-meter">
          <span className="block-meter__label">{label}</span>
          <div className="block-meter__track" role="progressbar" aria-valuenow={value} aria-valuemin={min} aria-valuemax={max}>
            <div
              className={['block-meter__fill', variant !== 'progress' ? `block-meter__fill--${variant}` : ''].filter(Boolean).join(' ')}
              style={{ width: `${pct}%` }}
            />
          </div>
          <span className="block-meter__value">
            {value}{unit ? ` ${unit}` : ''}
          </span>
        </div>
      </div>
    </div>
  )
}

import type { RackBlock as RackBlockType } from '@codex/shared'

interface Props { block: RackBlockType }

export function RackBlock({ block }: Props) {
  const { rackName, role, devices, gainNotes, monoSafety } = block.data

  return (
    <div className="block">
      <div className="block__header">
        <span className="block__title">{rackName}</span>
        <span className="block__type-label">Chain</span>
      </div>
      <div className="block__body">
        {role && (
          <div className="block-rack__role" style={{ marginBottom: 'var(--space-3)' }}>{role}</div>
        )}

        <div className="block-rack__chain">
          {devices.map((device, i) => (
            <div
              key={i}
              className={['block-rack__device', !device.enabled ? 'block-rack__device--bypassed' : ''].filter(Boolean).join(' ')}
            >
              <div className="block-rack__device-dot" />
              <span className="block-rack__device-name">{device.name}</span>
              {device.settings && (
                <span className="block-rack__device-settings">{device.settings}</span>
              )}
            </div>
          ))}
        </div>

        {(gainNotes || monoSafety !== undefined) && (
          <div className="block-rack__footer">
            {gainNotes && <span>{gainNotes}</span>}
            {monoSafety && (
              <span style={{ color: 'var(--color-accent-cyan)' }}>Mono safe ✓</span>
            )}
          </div>
        )}
      </div>
    </div>
  )
}

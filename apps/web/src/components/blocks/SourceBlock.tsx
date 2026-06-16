import type { SourceBlock as SourceBlockType } from '@codex/shared'

interface Props { block: SourceBlockType }

export function SourceBlock({ block }: Props) {
  const { originalFileName, content } = block.data

  return (
    <div className="block">
      <div className="block__header">
        <span className="block__type-label">Source</span>
        <span className="block-source__filename">{originalFileName}</span>
      </div>
      <div className="block__body">
        {/* Content is always escaped plain text — never rendered as HTML */}
        <pre className="block-source__content">{content}</pre>
      </div>
    </div>
  )
}

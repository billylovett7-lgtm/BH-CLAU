import type { TextBlock as TextBlockType } from '@codex/shared'

interface Props { block: TextBlockType }

export function TextBlock({ block }: Props) {
  return (
    <div className="block">
      {block.title && (
        <div className="block__header">
          <span className="block__title">{block.title}</span>
        </div>
      )}
      <div className="block__body">
        <p className="block-text__content">{block.data.content}</p>
      </div>
    </div>
  )
}

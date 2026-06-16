import type { TableBlock as TableBlockType } from '@codex/shared'

interface Props { block: TableBlockType }

export function TableBlock({ block }: Props) {
  const { headers, rows } = block.data

  return (
    <div className="block">
      {block.title && (
        <div className="block__header">
          <span className="block__title">{block.title}</span>
        </div>
      )}
      <div className="block__body block-table">
        <table>
          {headers.length > 0 && (
            <thead>
              <tr>
                {headers.map((h, i) => <th key={i}>{h}</th>)}
              </tr>
            </thead>
          )}
          <tbody>
            {rows.map((row, ri) => (
              <tr key={ri}>
                {row.map((cell, ci) => <td key={ci}>{cell}</td>)}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}

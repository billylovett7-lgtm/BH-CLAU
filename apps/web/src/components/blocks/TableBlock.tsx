import { useState, useEffect, useRef } from 'react'
import type { TableBlock as TableBlockType, Block } from '@codex/shared'

interface Props {
  block: TableBlockType
  onUpdate?: (block: Block) => void
}

type CellPos = { row: number; col: number }

export function TableBlock({ block, onUpdate }: Props) {
  const { headers, rows } = block.data
  const [editing, setEditing] = useState<CellPos | null>(null)
  const [draft, setDraft] = useState('')
  const inputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    if (editing) inputRef.current?.focus()
  }, [editing])

  function startEdit(row: number, col: number) {
    if (!onUpdate) return
    setEditing({ row, col })
    setDraft(rows[row]?.[col] ?? '')
  }

  function save() {
    if (!editing || !onUpdate) return
    const newRows = rows.map((r, ri) =>
      ri === editing.row
        ? r.map((cell, ci) => (ci === editing.col ? draft : cell))
        : r
    )
    onUpdate({ ...block, data: { headers, rows: newRows } })
    setEditing(null)
  }

  function cancel() { setEditing(null) }

  function handleKeyDown(e: React.KeyboardEvent<HTMLInputElement>) {
    if (e.key === 'Enter') { e.preventDefault(); save() }
    if (e.key === 'Escape') { e.preventDefault(); cancel() }
    if (e.key === 'Tab') {
      e.preventDefault()
      save()
      if (!editing) return
      const { row, col } = editing
      const nextCol = col + 1
      if (nextCol < (rows[row]?.length ?? 0)) startEdit(row, nextCol)
      else if (row + 1 < rows.length) startEdit(row + 1, 0)
    }
  }

  const isEditing = (r: number, c: number) => editing?.row === r && editing?.col === c

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
                {row.map((cell, ci) => (
                  <td
                    key={ci}
                    className={onUpdate ? 'block-table__editable-cell' : ''}
                    onClick={() => startEdit(ri, ci)}
                  >
                    {isEditing(ri, ci)
                      ? (
                        <input
                          ref={inputRef}
                          className="block-table__cell-input"
                          value={draft}
                          onChange={e => setDraft(e.target.value)}
                          onBlur={save}
                          onKeyDown={handleKeyDown}
                          onClick={e => e.stopPropagation()}
                        />
                      )
                      : cell || <span className="block-table__placeholder">—</span>
                    }
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}

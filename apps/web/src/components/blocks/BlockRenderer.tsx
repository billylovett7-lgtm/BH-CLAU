import type { Block } from '@codex/shared'
import { TextBlock }      from './TextBlock'
import { CardsBlock }     from './CardsBlock'
import { TableBlock }     from './TableBlock'
import { ChecklistBlock } from './ChecklistBlock'
import { TimelineBlock }  from './TimelineBlock'
import { RackBlock }      from './RackBlock'
import { MidiGridBlock }  from './MidiGridBlock'
import { SampleCardBlock } from './SampleCardBlock'
import { PresetCardBlock } from './PresetCardBlock'
import { MeterBlock }     from './MeterBlock'
import { SourceBlock }    from './SourceBlock'

interface Props {
  block: Block
}

export function BlockRenderer({ block }: Props) {
  switch (block.type) {
    case 'text':        return <TextBlock      block={block} />
    case 'cards':       return <CardsBlock     block={block} />
    case 'table':       return <TableBlock     block={block} />
    case 'checklist':   return <ChecklistBlock block={block} />
    case 'timeline':    return <TimelineBlock  block={block} />
    case 'rack':        return <RackBlock      block={block} />
    case 'midiGrid':    return <MidiGridBlock  block={block} />
    case 'sampleCard':  return <SampleCardBlock block={block} />
    case 'presetCard':  return <PresetCardBlock block={block} />
    case 'meter':       return <MeterBlock     block={block} />
    case 'source':      return <SourceBlock    block={block} />
    default: {
      const _exhaustive: never = block
      return null
    }
  }
}

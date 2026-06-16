// MIDI parser — parses .mid binary buffer into MidiPattern schema
// Uses @tonejs/midi which is browser + Node.js compatible (no DOM)
// Falls back gracefully if the package is unavailable

import type { ImportResult, DetectedMetadata } from './types'
import type { Block } from '../schemas/block.schema'
import type { NoteEvent } from '../schemas/midi-pattern.schema'
import { escapeText, generateUUID } from './utils'
import { PARSER_VERSION } from './types'

function newId(): string { return generateUUID() }

// Drum note map (General MIDI)
const GM_DRUM_MAP: Record<number, string> = {
  35: 'Bass Drum 2', 36: 'Bass Drum 1', 38: 'Snare', 40: 'Snare Rim',
  42: 'Closed HH',  44: 'Foot HH',    46: 'Open HH',
  49: 'Crash 1',    51: 'Ride 1',      57: 'Crash 2',
  48: 'Tom Hi',     45: 'Tom Mid',     41: 'Tom Low',
}

function midiNoteToName(pitch: number): string {
  const notes = ['C','C#','D','D#','E','F','F#','G','G#','A','A#','B']
  return `${notes[pitch % 12]}${Math.floor(pitch / 12) - 1}`
}

function detectPatternType(notes: NoteEvent[]): 'drum' | 'bass' | 'chord' | 'melody' | 'other' {
  if (!notes.length) return 'other'
  const pitches = notes.map(n => n.pitch)
  const uniquePitches = new Set(pitches)
  const avgPitch = pitches.reduce((a, b) => a + b, 0) / pitches.length

  // Drum channels are typically channel 9 (0-indexed) — check if most notes are GM drum pitches
  const drumHits = pitches.filter(p => GM_DRUM_MAP[p]).length
  if (drumHits / pitches.length > 0.5) return 'drum'
  if (avgPitch < 48) return 'bass'
  if (uniquePitches.size <= 4 && notes.some(n => n.durationTicks > 96)) return 'chord'
  if (uniquePitches.size > 5) return 'melody'
  return 'other'
}

function buildMidiGridBlock(notes: NoteEvent[], ppq: number, buildId_: string, order: number): Block {
  // Map to a 16-step grid (1 bar)
  const stepsPerBar = 16
  const ticksPerStep = (ppq * 4) / stepsPerBar

  // Group notes by pitch
  const byPitch = new Map<number, boolean[]>()
  for (const note of notes) {
    const step = Math.floor(note.startTick / ticksPerStep) % stepsPerBar
    if (!byPitch.has(note.pitch)) {
      byPitch.set(note.pitch, new Array(stepsPerBar).fill(false))
    }
    const steps = byPitch.get(note.pitch)!
    steps[step] = true
  }

  const lanes = [...byPitch.entries()].slice(0, 16).map(([pitch, activeSteps]) => ({
    name:  GM_DRUM_MAP[pitch] ?? midiNoteToName(pitch),
    note:  pitch,
    steps: activeSteps.map(active => ({ active, velocity: 100, offset: 0 })),
  }))

  return {
    type:    'midiGrid',
    id:      newId(),
    buildId: buildId_,
    stageKey: 'midi',
    order,
    locked:  false,
    data: {
      gridType: detectPatternType(notes) === 'drum' ? 'drum' : 'instrument',
      bars:     1,
      grid:     stepsPerBar,
      swing:    0,
      lanes,
    },
  }
}

function buildNoteTableBlock(notes: NoteEvent[], buildId_: string, order: number): Block {
  const rows = notes.slice(0, 100).map(n => [
    midiNoteToName(n.pitch),
    String(n.pitch),
    String(n.velocity),
    String(n.startTick),
    String(n.durationTicks),
    String(n.channel),
  ])

  return {
    type:    'table',
    id:      newId(),
    buildId: buildId_,
    stageKey: 'midi',
    order,
    title:   'Note Events',
    locked:  false,
    data: {
      headers: ['Note', 'Pitch', 'Velocity', 'Start Tick', 'Duration', 'Channel'],
      rows,
    },
  }
}

export interface MidiParseResult extends ImportResult {
  noteEvents: NoteEvent[]
  ppq:        number
  bpm:        number
  trackCount: number
}

export async function parseMidi(
  buffer:   ArrayBuffer,
  fileName: string,
  buildId_: string = 'preview',
): Promise<MidiParseResult> {
  const errors: ImportResult['errors'] = []
  const blocks: Block[] = []
  let noteEvents: NoteEvent[] = []
  let ppq = 96
  let bpm = 120
  let trackCount = 0

  const maxBytes = 25 * 1024 * 1024
  if (buffer.byteLength > maxBytes) {
    errors.push({ field: 'file', message: 'MIDI file exceeds 25 MB limit' })
    return { detectedMetadata: {}, previewBlocks: [], errors, rawSource: '', noteEvents: [], ppq, bpm, trackCount }
  }

  try {
    // Dynamically import @tonejs/midi — may not be available in all environments
    const { Midi } = await import('@tonejs/midi')
    const midi = new Midi(buffer)

    ppq        = midi.header.ppq
    trackCount = midi.tracks.length

    // Extract BPM from tempo events
    const tempos = midi.header.tempos
    if (tempos.length > 0) {
      bpm = Math.round(tempos[0].bpm)
    }

    // Collect all note events from all tracks
    for (const track of midi.tracks) {
      for (const note of track.notes) {
        noteEvents.push({
          pitch:         note.midi,
          velocity:      Math.round(note.velocity * 127),
          startTick:     note.ticks,
          durationTicks: note.durationTicks,
          channel:       track.channel ?? 0,
        })
      }
    }

    // Sort by start tick
    noteEvents.sort((a, b) => a.startTick - b.startTick)

    // Limit to first 10,000 events
    if (noteEvents.length > 10_000) {
      errors.push({ field: 'noteEvents', message: `Truncated to 10,000 events (file had ${noteEvents.length})` })
      noteEvents = noteEvents.slice(0, 10_000)
    }

    // Build blocks
    blocks.push(buildMidiGridBlock(noteEvents, ppq, buildId_, 0))
    if (noteEvents.length > 0) {
      blocks.push(buildNoteTableBlock(noteEvents, buildId_, 1))
    }

    // Metadata cards
    blocks.push({
      type:    'cards',
      id:      newId(),
      buildId: buildId_,
      stageKey: 'midi',
      order:   2,
      title:   'MIDI Info',
      locked:  false,
      data: {
        cards: [
          { label: 'BPM',        value: String(bpm),        variant: 'default' as const },
          { label: 'Tracks',     value: String(trackCount), variant: 'default' as const },
          { label: 'PPQ',        value: String(ppq),        variant: 'default' as const },
          { label: 'Note Count', value: String(noteEvents.length), variant: 'default' as const },
          { label: 'Pattern Type', value: detectPatternType(noteEvents), variant: 'default' as const },
        ],
      },
    })

  } catch (e) {
    errors.push({ field: 'parse', message: `MIDI parse error: ${String(e)}` })
  }

  const metadata: DetectedMetadata = {
    title: escapeText(fileName.replace(/\.(mid|midi)$/i, '')),
    bpm:   bpm >= 60 && bpm <= 250 ? bpm : undefined,
  }

  // Source block (MIDI is binary — show hex summary)
  blocks.push({
    type:    'source',
    id:      newId(),
    buildId: buildId_,
    stageKey: 'source',
    order:   0,
    locked:  true,
    data: {
      originalFileName: escapeText(fileName.slice(0, 255)),
      content: `Binary MIDI file (${buffer.byteLength} bytes, ${trackCount} tracks, ${noteEvents.length} note events)`,
    },
  })

  return { detectedMetadata: metadata, previewBlocks: blocks, errors, rawSource: '', noteEvents, ppq, bpm, trackCount }
}

export const midiParser = { parse: parseMidi, parserVersion: PARSER_VERSION }

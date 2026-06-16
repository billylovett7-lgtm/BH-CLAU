import type { Block } from '@codex/shared'
import { getTemplate } from '@codex/shared'
import type { StageKey } from '@codex/shared'

const uid = () => crypto.randomUUID()

type V = 'default' | 'warning' | 'success' | 'danger'
const c = (label: string, value: string, variant: V = 'default') => ({ label, value, variant })

const on  = (v = 100) => ({ active: true,  velocity: v, offset: 0 })
const off = ()        => ({ active: false,  velocity: 100, offset: 0 })

function block<T extends Block>(b: T): T { return b }

export function buildSeedBlocks(buildId: string, templateId?: string): Block[] {
  const blocks: Block[] = []

  // ── 1 · Overview ────────────────────────────────────────────────────────
  blocks.push(block({
    id: uid(), buildId, stageKey: 'overview', order: 0, locked: false,
    type: 'cards',
    data: { cards: [
      c('Status',   'In Progress'),
      c('Priority', 'Medium'),
      c('BPM',      '—'),
      c('Key',      '—'),
      c('Genre',    '—'),
      c('Bars',     '—'),
    ]},
  }))
  blocks.push(block({
    id: uid(), buildId, stageKey: 'overview', order: 1, locked: false,
    type: 'checklist',
    data: { items: [
      { id: uid(), text: 'Set BPM',                        completed: false, priority: 'high'   },
      { id: uid(), text: 'Set key',                         completed: false, priority: 'high'   },
      { id: uid(), text: 'Confirm genre / subgenre',        completed: false, priority: 'medium' },
      { id: uid(), text: 'Set target bar count',            completed: false, priority: 'medium' },
      { id: uid(), text: 'Choose a reference track',        completed: false, priority: 'medium' },
      { id: uid(), text: 'Set due date if deadline applies',completed: false, priority: 'low'    },
    ]},
  }))

  // ── 2 · Track Diagnosis ─────────────────────────────────────────────────
  blocks.push(block({
    id: uid(), buildId, stageKey: 'diagnosis', order: 0, locked: false,
    type: 'cards',
    data: { cards: [
      c('Strengths',  'What is already working well?',       'success'),
      c('Weaknesses', 'What needs the most attention?',      'warning'),
      c('Direction',  'What does this track need to become?','default'),
      c('Reference',  'Which track should this sit next to?','default'),
    ]},
  }))
  blocks.push(block({
    id: uid(), buildId, stageKey: 'diagnosis', order: 1, locked: false,
    type: 'checklist',
    data: { items: [
      { id: uid(), text: 'Listen back on monitors AND headphones',  completed: false, priority: 'high'   },
      { id: uid(), text: 'Identify the 3 biggest problems',         completed: false, priority: 'high'   },
      { id: uid(), text: 'Choose a reference track and A/B it',     completed: false, priority: 'high'   },
      { id: uid(), text: 'Write a one-sentence direction statement', completed: false, priority: 'medium' },
      { id: uid(), text: 'Decide: is this track worth finishing?',   completed: false, priority: 'medium' },
    ]},
  }))

  // ── 3 · Arrangement Plan ────────────────────────────────────────────────
  blocks.push(block({
    id: uid(), buildId, stageKey: 'arrangement', order: 0, locked: false,
    type: 'timeline',
    data: { sections: [
      { label: 'Intro',      startBar: 1,   endBar: 16,  energy: 'low',       notes: 'Blend zone — kick + bass loop only', fxEvents: [] },
      { label: 'Build 1',    startBar: 17,  endBar: 32,  energy: 'build',     notes: 'Elements layer in',                  fxEvents: [] },
      { label: 'Drop 1',     startBar: 33,  endBar: 64,  energy: 'peak',      notes: 'Full arrangement',                   fxEvents: [] },
      { label: 'Breakdown',  startBar: 65,  endBar: 80,  energy: 'breakdown', notes: 'Strip back to atmosphere',           fxEvents: [] },
      { label: 'Build 2',    startBar: 81,  endBar: 96,  energy: 'build',     notes: 'Re-tension before final drop',       fxEvents: [] },
      { label: 'Drop 2',     startBar: 97,  endBar: 128, energy: 'peak',      notes: 'Full arrangement — variation',       fxEvents: [] },
      { label: 'Outro',      startBar: 129, endBar: 144, energy: 'low',       notes: 'Strip to loop for DJ blend-out',     fxEvents: [] },
    ]},
  }))
  blocks.push(block({
    id: uid(), buildId, stageKey: 'arrangement', order: 1, locked: false,
    type: 'table',
    data: {
      headers: ['Section', 'Bars', 'Length', 'Energy', 'Key moment'],
      rows: [
        ['Intro',     '1–16',    '16 bars', 'Low',  'Open with kick + bass loop'],
        ['Build 1',   '17–32',   '16 bars', 'Build','Chord / synth entry'],
        ['Drop 1',    '33–64',   '32 bars', 'Peak', 'Full arrangement hits'],
        ['Breakdown', '65–80',   '16 bars', 'Drop', 'Strip to pads / perc only'],
        ['Build 2',   '81–96',   '16 bars', 'Build','FX swell + tension'],
        ['Drop 2',    '97–128',  '32 bars', 'Peak', 'Full arrangement variation'],
        ['Outro',     '129–144', '16 bars', 'Low',  'Strip to loop for blend'],
      ],
    },
  }))

  // ── 4 · Drum Plan ───────────────────────────────────────────────────────
  blocks.push(block({
    id: uid(), buildId, stageKey: 'drums', order: 0, locked: false,
    type: 'cards',
    data: { cards: [
      c('Kick character', 'Punchy, sub-heavy or clicky?'),
      c('Groove feel',    'Straight, swung or offbeat?'),
      c('Snare / clap',  'Placement and transient weight'),
      c('Hi-hats',       'Open / closed pattern and swing amount'),
      c('Fills',         'Every N bars — what and where?'),
      c('Sub-100Hz',     'Kick must be mono below 100Hz', 'warning'),
    ]},
  }))
  blocks.push(block({
    id: uid(), buildId, stageKey: 'drums', order: 1, locked: false,
    type: 'checklist',
    data: { items: [
      { id: uid(), text: 'Kick tone locked (character + frequency)',           completed: false, priority: 'high'   },
      { id: uid(), text: 'Kick sub is mono below 100Hz',                      completed: false, priority: 'high'   },
      { id: uid(), text: 'Groove feel confirmed (swing amount set)',           completed: false, priority: 'high'   },
      { id: uid(), text: 'Snare / clap sits without masking the kick',        completed: false, priority: 'medium' },
      { id: uid(), text: 'Hat pattern adds movement without clutter',         completed: false, priority: 'medium' },
      { id: uid(), text: 'Fills mapped at section transitions',               completed: false, priority: 'medium' },
      { id: uid(), text: 'Drum mix printed to stem',                          completed: false, priority: 'low'    },
    ]},
  }))

  // ── 5 · Drum Rack / MIDI ────────────────────────────────────────────────
  blocks.push(block({
    id: uid(), buildId, stageKey: 'midi', order: 0, locked: false,
    type: 'midiGrid',
    data: {
      gridType: 'drum',
      bars:     1,
      grid:     16,
      swing:    0,
      lanes: [
        {
          name:  'Kick',
          note:  36,
          steps: [on(127),off(),off(),off(), on(100),off(),off(),off(), on(127),off(),off(),off(), on(100),off(),off(),off()],
        },
        {
          name:  'Snare',
          note:  38,
          steps: [off(),off(),off(),off(), on(110),off(),off(),off(), off(),off(),off(),off(), on(110),off(),off(),off()],
        },
        {
          name:  'Closed HH',
          note:  42,
          steps: [on(90),off(),on(80),off(), on(90),off(),on(80),off(), on(90),off(),on(80),off(), on(90),off(),on(80),off()],
        },
        {
          name:  'Open HH',
          note:  46,
          steps: [off(),off(),off(),off(), off(),off(),on(70),off(), off(),off(),off(),off(), off(),off(),on(70),off()],
        },
        {
          name:  'Clap',
          note:  39,
          steps: Array<ReturnType<typeof off>>(16).fill(off()),
        },
        {
          name:  'Perc 1',
          note:  70,
          steps: Array<ReturnType<typeof off>>(16).fill(off()),
        },
      ],
    },
  }))
  blocks.push(block({
    id: uid(), buildId, stageKey: 'midi', order: 1, locked: false,
    type: 'text',
    data: { content: 'Document pad maps, piano roll patterns, clip variations and instrument note assignments here.' },
  }))

  // ── 6 · Bass / Sub Fix ──────────────────────────────────────────────────
  blocks.push(block({
    id: uid(), buildId, stageKey: 'bass', order: 0, locked: false,
    type: 'cards',
    data: { cards: [
      c('Sub character', 'Sine / reese / 808 / hybrid?'),
      c('Mono below',    'Everything below 100Hz must be mono', 'warning'),
      c('Sidechain',     'Kick → bass compressor: ratio, attack, release'),
      c('Mid movement',  'How does the mid-bass move and evolve?'),
      c('Mud zone',      'Check 200–400Hz for boxiness and cut if needed',  'warning'),
    ]},
  }))
  blocks.push(block({
    id: uid(), buildId, stageKey: 'bass', order: 1, locked: false,
    type: 'checklist',
    data: { items: [
      { id: uid(), text: 'Sub is mono — confirmed on correlation meter',    completed: false, priority: 'high'   },
      { id: uid(), text: 'Kick and bass are not masking each other',        completed: false, priority: 'high'   },
      { id: uid(), text: 'Sidechain ducking feels natural, not pumping',    completed: false, priority: 'high'   },
      { id: uid(), text: '200–400Hz checked and carved where needed',       completed: false, priority: 'medium' },
      { id: uid(), text: 'Bass has movement / evolution across the track',  completed: false, priority: 'medium' },
      { id: uid(), text: 'Bass printed to stem',                            completed: false, priority: 'low'    },
    ]},
  }))

  // ── 7 · Musical Layers ──────────────────────────────────────────────────
  blocks.push(block({
    id: uid(), buildId, stageKey: 'layers', order: 0, locked: false,
    type: 'cards',
    data: { cards: [
      c('Hook element', 'The one thing that defines this track'),
      c('Chord movement','Root / quality / rhythm of chords'),
      c('Pads / atmos', 'Space and width — high-passed, never competing with mix'),
      c('Vocal element','Chop, one-shot, phrase or none?'),
      c('Density check','Can you remove one layer and it sounds better?', 'warning'),
    ]},
  }))
  blocks.push(block({
    id: uid(), buildId, stageKey: 'layers', order: 1, locked: false,
    type: 'checklist',
    data: { items: [
      { id: uid(), text: 'Lead hook element defined and placed',            completed: false, priority: 'high'   },
      { id: uid(), text: 'Chord root locked relative to track key',         completed: false, priority: 'high'   },
      { id: uid(), text: 'No element masking kick or bass',                 completed: false, priority: 'high'   },
      { id: uid(), text: 'Pads high-passed — not competing with top end',  completed: false, priority: 'medium' },
      { id: uid(), text: 'Density tested — mute each layer individually',  completed: false, priority: 'medium' },
      { id: uid(), text: 'Automation or variation across sections',         completed: false, priority: 'low'    },
    ]},
  }))

  // ── 8 · Ableton Chains ──────────────────────────────────────────────────
  blocks.push(block({
    id: uid(), buildId, stageKey: 'chains', order: 0, locked: false,
    type: 'rack',
    data: {
      rackName:  'Kick Chain',
      role:      'Kick processing — punch and sub control',
      monoSafety: true,
      gainNotes:  'Target -18dBFS RMS out of this rack',
      devices: [
        { name: 'HPF 20Hz',         enabled: true,  purpose: 'Remove infrasub rumble',                          warnings: [] },
        { name: 'Transient Shaper', enabled: true,  purpose: 'Attack +2 / Sustain -3',                         warnings: [] },
        { name: 'Compressor',       enabled: true,  purpose: '4:1, -6dB GR, fast attack, medium release',      warnings: [] },
        { name: 'EQ Eight',         enabled: true,  purpose: 'Boost 60Hz +3dB / cut 300Hz -2dB',              warnings: [] },
        { name: 'Limiter',          enabled: false, purpose: 'Clip protection — enable only if hitting ceiling', warnings: ['Disable before stem export'] },
      ],
    },
  }))
  blocks.push(block({
    id: uid(), buildId, stageKey: 'chains', order: 1, locked: false,
    type: 'rack',
    data: {
      rackName:   'Master Bus',
      role:       'Glue — not mastering. Keep GR under 3dB.',
      monoSafety: false,
      gainNotes:  'Pre-limiter: -10dBFS RMS. Post-limiter: -0.3dBTP ceiling.',
      devices: [
        { name: 'EQ (gentle dip)',  enabled: true, purpose: '200Hz -1.5dB / 3kHz +0.5dB',        warnings: [] },
        { name: 'SSL Bus Comp',     enabled: true, purpose: '2:1, 3dB GR, auto release, 30ms',    warnings: [] },
        { name: 'Stereo Width',     enabled: true, purpose: 'M/S — collapse to mono below 120Hz', warnings: ['Check mono compat'] },
        { name: 'Ozone Limiter',    enabled: true, purpose: '-0.3dBTP ceiling for export only',    warnings: ['Remove chain for stem export'] },
      ],
    },
  }))
  blocks.push(block({
    id: uid(), buildId, stageKey: 'chains', order: 2, locked: false,
    type: 'text',
    data: { content: 'Add a rack block for each processing group — bass, synths, reverb returns, parallel compression. Document device order, key settings and any gain staging notes.' },
  }))

  // ── 9 · Mixdown Plan ────────────────────────────────────────────────────
  blocks.push(block({
    id: uid(), buildId, stageKey: 'mix', order: 0, locked: false,
    type: 'table',
    data: {
      headers: ['Stem group', 'Target RMS', 'Target Peak', 'Notes'],
      rows: [
        ['Kick',          '-18 dBFS', '-6 dBFS',  'Mono sub — hits hard, leaves headroom'],
        ['Bass',          '-20 dBFS', '-8 dBFS',  'Sidechain ducks under kick'],
        ['Drums (rest)',  '-22 dBFS', '-10 dBFS', 'Snare + hats + percs'],
        ['Synths / hook', '-24 dBFS', '-12 dBFS', 'Mono or narrow below 200Hz'],
        ['Pads / atmos',  '-28 dBFS', '-16 dBFS', 'Wide, high-passed above 250Hz'],
        ['Vocals',        '-22 dBFS', '-10 dBFS', 'Centred, de-essed'],
        ['Master bus',    '-10 dBFS', '-1 dBFS',  'Pre-limiter target for export'],
      ],
    },
  }))
  blocks.push(block({
    id: uid(), buildId, stageKey: 'mix', order: 1, locked: false,
    type: 'checklist',
    data: { items: [
      { id: uid(), text: 'Low end is mono — correlation meter confirmed',       completed: false, priority: 'high'   },
      { id: uid(), text: 'Kick and bass have space (sidechain or EQ carve)',    completed: false, priority: 'high'   },
      { id: uid(), text: 'All stems checked at matched perceived loudness',     completed: false, priority: 'high'   },
      { id: uid(), text: 'Reference track A/B — similar energy and tone',      completed: false, priority: 'high'   },
      { id: uid(), text: 'Mix checked on headphones and secondary speakers',    completed: false, priority: 'medium' },
      { id: uid(), text: 'No element masking another in the same freq band',   completed: false, priority: 'medium' },
      { id: uid(), text: 'Automation lanes cleaned up',                         completed: false, priority: 'low'    },
      { id: uid(), text: 'Session saved and backed up',                         completed: false, priority: 'low'    },
    ]},
  }))

  // ── 10 · Master / Export ────────────────────────────────────────────────
  blocks.push(block({
    id: uid(), buildId, stageKey: 'master', order: 0, locked: false,
    type: 'meter',
    data: { label: 'Integrated Loudness Target', value: 14, min: 0, max: 24, unit: 'LUFS', variant: 'loudness' },
  }))
  blocks.push(block({
    id: uid(), buildId, stageKey: 'master', order: 1, locked: false,
    type: 'table',
    data: {
      headers: ['Version', 'Format', 'Sample Rate', 'Bit Depth', 'LUFS target', 'True Peak', 'Status'],
      rows: [
        ['Club master',  'WAV', '44.1 kHz', '24-bit', '-8 LUFS',  '-0.3 dBTP', 'Pending'],
        ['Streaming',    'WAV', '44.1 kHz', '24-bit', '-14 LUFS', '-1.0 dBTP', 'Pending'],
        ['Stem export',  'WAV', '44.1 kHz', '24-bit', '—',        '—',          'Pending'],
        ['Preview MP3',  'MP3', '44.1 kHz', '320kbps','-14 LUFS', '-1.0 dBTP', 'Pending'],
      ],
    },
  }))
  blocks.push(block({
    id: uid(), buildId, stageKey: 'master', order: 2, locked: false,
    type: 'checklist',
    data: { items: [
      { id: uid(), text: 'True peak below -0.3dBTP on all versions',          completed: false, priority: 'high'   },
      { id: uid(), text: 'Integrated LUFS target met for each version',        completed: false, priority: 'high'   },
      { id: uid(), text: 'Stereo width matches reference at same LUFS',        completed: false, priority: 'high'   },
      { id: uid(), text: 'No inter-sample peaks (check ISP meter)',             completed: false, priority: 'medium' },
      { id: uid(), text: 'All format versions exported and file-named',        completed: false, priority: 'medium' },
      { id: uid(), text: 'Files backed up, uploaded or sent to label',         completed: false, priority: 'low'    },
    ]},
  }))

  // ── 11 · Notes & Source ─────────────────────────────────────────────────
  blocks.push(block({
    id: uid(), buildId, stageKey: 'source', order: 0, locked: false,
    type: 'text',
    data: { content: 'Add session notes here — Ableton version, plugin versions, key creative decisions, or anything needed to recreate this session later.' },
  }))

  // ── Template overlay ─────────────────────────────────────────────────────
  if (templateId) {
    const tpl = getTemplate(templateId)
    if (tpl) {
      let ord = 100
      for (const [key, note] of Object.entries(tpl.defaultStageNotes) as [StageKey, string][]) {
        if (note) {
          blocks.push(block({
            id: uid(), buildId, stageKey: key, order: ord++, locked: false,
            type: 'text',
            data: { content: `[${tpl.title}] ${note}` },
          }))
        }
      }
    }
  }

  return blocks
}

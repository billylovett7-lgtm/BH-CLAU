import type { StageKey } from './stages'

export interface BuildTemplate {
  id:          string
  title:       string
  genre:       string
  bpm:         number
  bars:        number
  description: string
  tags:        string[]
  defaultStageNotes: Partial<Record<StageKey, string>>
}

export const TEMPLATES: BuildTemplate[] = [
  {
    id:          'tech-house-club',
    title:       'Tech House Club Tool',
    genre:       'tech-house',
    bpm:         126,
    bars:        144,
    description: 'Rolling low end, direct hook and clean DJ blend zones',
    tags:        ['club', 'rolling', 'tool'],
    defaultStageNotes: {
      arrangement: 'Long intro blend zone (32 bars), main body 80 bars, clean mix-out 32 bars.',
      drums:       'Four-on-the-floor kick, tight hi-hats, minimal percussion. Sub 100Hz mono.',
      bass:        'Sub mono below 100Hz, mid-bass adds movement. Sidechain to kick.',
      mix:         'Kick and sub are the mix reference. Everything else builds around them.',
    },
  },
  {
    id:          'deep-house-extended',
    title:       'Deep House Extended',
    genre:       'deep-house',
    bpm:         122,
    bars:        160,
    description: 'Warm harmonic movement with patient energy curve',
    tags:        ['deep', 'warm', 'extended'],
    defaultStageNotes: {
      arrangement: 'Patient build. First hook entry no earlier than bar 32. Long breakdowns.',
      drums:       'Swung groove, warm kick, subtle percussion layers. Avoid clipping the groove.',
      layers:      'Chords move slowly. Pad wash under everything. Hook should feel inevitable.',
    },
  },
  {
    id:          'uk-garage-2step',
    title:       'UK Garage 2-Step',
    genre:       'uk-garage',
    bpm:         132,
    bars:        160,
    description: 'Swing-led drums, vocal responses and bass dropouts',
    tags:        ['garage', '2step', 'swing'],
    defaultStageNotes: {
      drums:   '2-step swing pattern. Snare on 2 and 4 offset. Sub kick punches through.',
      bass:    'Bass dropouts at key moments. Reese or sub with mid-range movement.',
      layers:  'Vocal chops or stabs. Piano riff. Short vocal responses between phrases.',
    },
  },
  {
    id:          'dnb-roller',
    title:       'DnB Roller',
    genre:       'liquid-dnb',
    bpm:         174,
    bars:        192,
    description: 'Long-form tension, rolling bass and detailed drum changes',
    tags:        ['dnb', 'roller', 'liquid'],
    defaultStageNotes: {
      drums:   'Amen or programmed break. Detailed micro-edits for variation every 16-32 bars.',
      bass:    'Rolling reese or neuro bass. Sub locked to kick.',
      arrangement: 'Long intro, 2 main drops, extended outro for DJs.',
    },
  },
  {
    id:          'melodic-techno-arc',
    title:       'Melodic Techno Arc',
    genre:       'melodic-techno',
    bpm:         124,
    bars:        192,
    description: 'Gradual motif development and cinematic transitions',
    tags:        ['techno', 'melodic', 'arc'],
    defaultStageNotes: {
      arrangement: 'Single motif introduced early, developed through 192 bars. No hard drops.',
      layers:      'Pads and leads build over time. Less is more. Space is the mix.',
      mix:         'Wide stereo top-end, mono low-end. Reverb tails must not muddy the mix.',
    },
  },
  {
    id:          'afro-house-percussion',
    title:       'Afro House Percussion',
    genre:       'afro-house',
    bpm:         122,
    bars:        176,
    description: 'Layered percussion with controlled melodic density',
    tags:        ['afro', 'percussion', 'layered'],
    defaultStageNotes: {
      drums:   'Layered percussion: shakers, congas, claps. Groove is the foundation.',
      layers:  'Melodic density should be restrained. Let the groove breathe.',
      mix:     'Percussion sits mid-high, kick and bass hold low end clearly.',
    },
  },
  {
    id:          'minimal-house-tool',
    title:       'Minimal House Tool',
    genre:       'minimal-house',
    bpm:         128,
    bars:        144,
    description: 'Sparse hooks, micro-variation and long blend sections',
    tags:        ['minimal', 'tool', 'sparse'],
    defaultStageNotes: {
      arrangement: 'Very long blend zones. Minimal changes. Trust the groove.',
      layers:      'One hook element maximum. Micro-variation keeps interest.',
      mix:         'Headroom is key. Nothing clips. Everything breathes.',
    },
  },
  {
    id:          'vocal-house-dual',
    title:       'Vocal House Dual Edit',
    genre:       'vocal-house',
    bpm:         124,
    bars:        160,
    description: 'Extended and radio edit planning',
    tags:        ['vocal', 'house', 'edit'],
    defaultStageNotes: {
      arrangement: 'Plan both: extended (160 bars) and radio edit (96 bars). Mark edit points.',
      layers:      'Lead vocal is the hook. Instrumental sections serve the vocal, not vice versa.',
      mix:         'Vocal sits in the mid, de-essed. Low end stays punchy under the vocal.',
    },
  },
]

export function getTemplate(id: string): BuildTemplate | undefined {
  return TEMPLATES.find(t => t.id === id)
}

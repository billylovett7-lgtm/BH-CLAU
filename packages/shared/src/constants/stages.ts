export const STAGES = [
  { key: 'overview',     order: 1,  title: 'Overview',        description: 'Track identity and status' },
  { key: 'diagnosis',    order: 2,  title: 'Track Diagnosis', description: 'Strengths, weaknesses and direction' },
  { key: 'arrangement',  order: 3,  title: 'Arrangement Plan',description: 'Structure, energy and transitions' },
  { key: 'drums',        order: 4,  title: 'Drum Plan',       description: 'Kick, groove, timing and fills' },
  { key: 'midi',         order: 5,  title: 'Drum Rack / MIDI',description: 'Pad maps, piano rolls and clip variations' },
  { key: 'bass',         order: 6,  title: 'Bass / Sub Fix',  description: 'Low-end relationship and control' },
  { key: 'layers',       order: 7,  title: 'Musical Layers',  description: 'Hooks, chords, vocals and space' },
  { key: 'chains',       order: 8,  title: 'Ableton Chains',  description: 'Exact racks and device settings' },
  { key: 'mix',          order: 9,  title: 'Mixdown Plan',    description: 'Balance, dynamics and stereo field' },
  { key: 'master',       order: 10, title: 'Master / Export', description: 'Loudness, limiting and versions' },
  { key: 'source',       order: 11, title: 'Notes & Source',  description: 'Session notes and imported source' },
] as const

export type StageKey = typeof STAGES[number]['key']

export const STAGE_KEYS = STAGES.map(s => s.key) as StageKey[]

export function getStage(key: StageKey) {
  return STAGES.find(s => s.key === key)
}

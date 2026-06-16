export const GENRES = [
  { value: 'tech-house',        label: 'Tech House' },
  { value: 'deep-house',        label: 'Deep House' },
  { value: 'minimal-deep-tech', label: 'Minimal / Deep Tech' },
  { value: 'uk-garage',         label: 'UK Garage / 2-Step' },
  { value: 'uk-140',            label: 'UK 140' },
  { value: 'deep-dubstep',      label: 'Deep Dubstep' },
  { value: 'liquid-dnb',        label: 'Liquid DnB' },
  { value: 'atmospheric-dnb',   label: 'Atmospheric DnB' },
  { value: 'leftfield-bass',    label: 'Leftfield Bass' },
  { value: 'melodic-techno',    label: 'Melodic Techno' },
  { value: 'afro-house',        label: 'Afro House' },
  { value: 'minimal-house',     label: 'Minimal House' },
  { value: 'vocal-house',       label: 'Vocal House' },
  { value: 'other',             label: 'Other' },
] as const

export type GenreValue = typeof GENRES[number]['value']

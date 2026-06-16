import type { Block } from '../schemas/block.schema'

export interface DetectedMetadata {
  title?:  string
  genre?:  string
  bpm?:    number
  key?:    string
  root?:   string
  tags?:   string[]
}

export interface ImportError {
  field:   string
  message: string
}

export interface ImportResult {
  detectedMetadata: DetectedMetadata
  previewBlocks:    Block[]
  errors:           ImportError[]
  rawSource:        string   // always escaped plain text — never rendered as HTML
}

export const PARSER_VERSION = '1.0.0'

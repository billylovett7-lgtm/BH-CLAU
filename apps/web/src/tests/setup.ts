// Vitest + jsdom setup
// @testing-library/react is used directly; vitest provides expect matchers
import { vi } from 'vitest'

// Mock crypto.randomUUID for jsdom environments that don't have it
if (!globalThis.crypto?.randomUUID) {
  Object.defineProperty(globalThis.crypto, 'randomUUID', {
    value: () => 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, c => {
      const r = Math.random() * 16 | 0
      return (c === 'x' ? r : (r & 0x3 | 0x8)).toString(16)
    }),
    configurable: true,
  })
}

// Silence Dexie "not supported" warnings in jsdom
vi.stubGlobal('indexedDB', undefined)

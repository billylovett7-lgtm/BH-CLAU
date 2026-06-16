import { create } from 'zustand'

type SyncStatus = 'idle' | 'syncing' | 'error' | 'offline'

interface UiState {
  commandPaletteOpen:    boolean
  setCommandPaletteOpen: (open: boolean) => void
  toggleCommandPalette:  () => void

  syncStatus:    SyncStatus
  setSyncStatus: (status: SyncStatus) => void

  // Active build for cross-component coordination (cleared on navigation)
  activeBuildId:    string | null
  setActiveBuildId: (id: string | null) => void
}

export const useUiStore = create<UiState>(set => ({
  commandPaletteOpen:    false,
  setCommandPaletteOpen: open => set({ commandPaletteOpen: open }),
  toggleCommandPalette:  ()   => set(s => ({ commandPaletteOpen: !s.commandPaletteOpen })),

  syncStatus:    'idle',
  setSyncStatus: status => set({ syncStatus: status }),

  activeBuildId:    null,
  setActiveBuildId: id => set({ activeBuildId: id }),
}))

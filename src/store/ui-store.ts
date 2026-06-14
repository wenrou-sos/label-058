import { create } from 'zustand'

interface UIState {
  sidebarOpen: boolean
  currentModal: string | null
  modalData: unknown
  toggleSidebar: () => void
  openModal: (modal: string, data?: unknown) => void
  closeModal: () => void
}

export const useUIStore = create<UIState>((set) => ({
  sidebarOpen: true,
  currentModal: null,
  modalData: null,
  toggleSidebar: () => set((state) => ({ sidebarOpen: !state.sidebarOpen })),
  openModal: (modal, data = null) =>
    set({ currentModal: modal, modalData: data }),
  closeModal: () => set({ currentModal: null, modalData: null }),
}))

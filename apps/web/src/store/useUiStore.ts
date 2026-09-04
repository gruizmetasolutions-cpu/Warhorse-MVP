import { create } from 'zustand'

export interface ToastNotificacion {
  id: string
  tipo: 'success' | 'error' | 'warning' | 'info'
  titulo?: string
  mensaje: string
}

interface UiState {
  sidebarAbierto: boolean
  sidebarColapsado: boolean
  tema: 'dark' | 'light'
  isOnline: boolean
  toasts: ToastNotificacion[]
  modalActivo: string | null
  datosModal: Record<string, unknown> | null | undefined

  // Acciones
  toggleSidebar: () => void
  setSidebarAbierto: (abierto: boolean) => void
  toggleColapsoSidebar: () => void
  setTema: (tema: 'dark' | 'light') => void
  setIsOnline: (online: boolean) => void
  agregarToast: (toast: Omit<ToastNotificacion, 'id'>) => void
  removerToast: (id: string) => void
  abrirModal: (idModal: string, datos?: Record<string, unknown> | null) => void
  cerrarModal: () => void
}

export const useUiStore = create<UiState>((set, get) => ({
  sidebarAbierto: true,
  sidebarColapsado: false,
  tema: (localStorage.getItem('wh_theme') as 'dark' | 'light') || 'dark',
  isOnline: typeof navigator !== 'undefined' ? navigator.onLine : true,
  toasts: [],
  modalActivo: null,
  datosModal: null,

  toggleSidebar: () => set(state => ({ sidebarAbierto: !state.sidebarAbierto })),
  setSidebarAbierto: abierto => set({ sidebarAbierto: abierto }),
  toggleColapsoSidebar: () => set(state => ({ sidebarColapsado: !state.sidebarColapsado })),

  setTema: tema => {
    localStorage.setItem('wh_theme', tema)
    document.documentElement.setAttribute('data-theme', tema)
    set({ tema })
  },

  setIsOnline: isOnline => set({ isOnline }),

  agregarToast: toast => {
    const id = Math.random().toString(36).substring(2, 9)
    const nuevoToast: ToastNotificacion = { ...toast, id }
    set(state => ({ toasts: [...state.toasts, nuevoToast] }))

    // Auto-remover en 4.5 segundos
    setTimeout(() => {
      get().removerToast(id)
    }, 4500)
  },

  removerToast: id => {
    set(state => ({ toasts: state.toasts.filter(t => t.id !== id) }))
  },

  abrirModal: (idModal, datos = null) => {
    set({ modalActivo: idModal, datosModal: datos })
  },

  cerrarModal: () => {
    set({ modalActivo: null, datosModal: null })
  },
}))

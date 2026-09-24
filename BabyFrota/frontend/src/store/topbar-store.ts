import { create } from 'zustand'

/**
 * Pontos da barra superior onde as páginas colocam o nome da tela e as ações dela (ver PageHeader).
 * A Topbar registra os elementos; guardá-los no estado faz a página renderizar de novo assim que existirem.
 */
interface TopbarState {
  titulo: HTMLElement | null
  acoes: HTMLElement | null
  definirTitulo: (el: HTMLElement | null) => void
  definirAcoes: (el: HTMLElement | null) => void
}

export const useTopbarStore = create<TopbarState>()((set) => ({
  titulo: null,
  acoes: null,
  definirTitulo: (el) => set({ titulo: el }),
  definirAcoes: (el) => set({ acoes: el }),
}))

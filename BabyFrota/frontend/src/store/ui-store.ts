import { create } from 'zustand'
import { persist } from 'zustand/middleware'

interface UiState {
  /** Sidebar reduzida a ícones (só desktop). */
  sidebarColapsada: boolean
  /** Menu lateral aberto por cima da página (só telas abaixo de md, onde a sidebar fixa não existe). */
  menuMobileAberto: boolean
  /** Grupos do menu expandidos, por rótulo. Ausente = fechado. */
  gruposAbertos: Record<string, boolean>

  alternarSidebar: () => void
  definirSidebarColapsada: (colapsada: boolean) => void
  abrirMenuMobile: () => void
  fecharMenuMobile: () => void
  alternarGrupo: (rotulo: string) => void
  abrirGrupo: (rotulo: string) => void
}

export const useUiStore = create<UiState>()(
  persist(
    (set) => ({
      sidebarColapsada: false,
      menuMobileAberto: false,
      gruposAbertos: {},

      alternarSidebar: () => set((s) => ({ sidebarColapsada: !s.sidebarColapsada })),
      definirSidebarColapsada: (colapsada) => set({ sidebarColapsada: colapsada }),
      abrirMenuMobile: () => set({ menuMobileAberto: true }),
      fecharMenuMobile: () => set({ menuMobileAberto: false }),
      alternarGrupo: (rotulo) =>
        set((s) => ({ gruposAbertos: { ...s.gruposAbertos, [rotulo]: !s.gruposAbertos[rotulo] } })),
      // Só grava quando muda, para não gerar escrita no localStorage a cada navegação.
      abrirGrupo: (rotulo) =>
        set((s) => (s.gruposAbertos[rotulo] ? s : { gruposAbertos: { ...s.gruposAbertos, [rotulo]: true } })),
    }),
    {
      name: 'bf-ui',
      partialize: (s) => ({ sidebarColapsada: s.sidebarColapsada, gruposAbertos: s.gruposAbertos }),
    },
  ),
)

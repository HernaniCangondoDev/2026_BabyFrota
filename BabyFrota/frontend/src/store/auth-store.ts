import { create } from 'zustand'
import { persist } from 'zustand/middleware'

export interface UsuarioLogado {
  id: number
  nome: string
  email: string
  perfilId: number
  perfilNome: string
}

interface AuthState {
  token: string | null
  usuario: UsuarioLogado | null
  isAuthenticated: boolean
  login: (token: string, usuario: UsuarioLogado) => void
  logout: () => void
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      token: null,
      usuario: null,
      isAuthenticated: false,
      login: (token, usuario) => set({ token, usuario, isAuthenticated: true }),
      logout: () => set({ token: null, usuario: null, isAuthenticated: false }),
    }),
    { name: 'babyfrota-auth' },
  ),
)

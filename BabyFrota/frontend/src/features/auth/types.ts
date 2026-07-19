import type { UsuarioLogado } from '@/store/auth-store'

export interface LoginRequest {
  email: string
  senha: string
}

export interface LoginResponse {
  token: string
  expiraEm: string
  usuario: UsuarioLogado
}

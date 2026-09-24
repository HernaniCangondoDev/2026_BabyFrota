import { create } from 'zustand'
import type { Empresa } from '@/features/empresa/types'
import type { LocacaoDetalhe, Troca } from '@/features/locacoes/types'

export type TipoComprovante = 'entrega' | 'troca' | 'devolucao'

export interface DadosComprovante {
  tipo: TipoComprovante
  locacao: LocacaoDetalhe
  /** Cadastro da empresa; sem ele o ticket sai só com "Baby Frota". */
  empresa: Empresa | null
  /** Troca a que o comprovante se refere (a mais recente da locação); só usada no comprovante de troca. */
  troca?: Troca
}

interface ComprovanteState {
  /** Comprovante esperando para ser impresso; o ComprovanteHost o renderiza, imprime e limpa. */
  dados: DadosComprovante | null
  imprimir: (dados: DadosComprovante) => void
  limpar: () => void
}

export const useComprovanteStore = create<ComprovanteState>()((set) => ({
  dados: null,
  imprimir: (dados) => set({ dados }),
  limpar: () => set({ dados: null }),
}))

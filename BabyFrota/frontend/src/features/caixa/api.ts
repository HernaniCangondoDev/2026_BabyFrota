import { keepPreviousData, useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { AxiosError } from 'axios'
import { api } from '@/lib/api'
import type { PagedResult } from '@/types/paged-result'
import type {
  AberturaCaixa,
  CaixaMovimento,
  FluxoCaixa,
  FluxoCaixaFiltro,
  FluxoCaixaResumo,
  MovimentoCaixa,
} from './types'

const QUERY_KEY = ['caixa-aberto']

async function obterAberto(): Promise<CaixaMovimento | null> {
  try {
    const { data } = await api.get<CaixaMovimento>('/caixa/aberto')
    return data
  } catch (err) {
    if (err instanceof AxiosError && err.response?.status === 404) return null
    throw err
  }
}

export function useCaixaAberto() {
  return useQuery({ queryKey: QUERY_KEY, queryFn: obterAberto })
}

export function useAbrirCaixa() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (payload: AberturaCaixa) => api.post<CaixaMovimento>('/caixa/abertura', payload),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: QUERY_KEY }),
  })
}

/** Como no legado, o fechamento não recebe valor algum: o servidor grava o total vendido apurado. */
export function useFecharCaixa() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: () => api.post<CaixaMovimento>('/caixa/fechamento'),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: QUERY_KEY })
      queryClient.invalidateQueries({ queryKey: ['caixa', 'fluxo'] })
    },
  })
}

export function useSuprimentos() {
  return useQuery({
    queryKey: ['caixa', 'suprimentos'],
    queryFn: async () => (await api.get<MovimentoCaixa[]>('/caixa/suprimentos')).data,
  })
}

export function useSangrias() {
  return useQuery({
    queryKey: ['caixa', 'sangrias'],
    queryFn: async () => (await api.get<MovimentoCaixa[]>('/caixa/sangrias')).data,
  })
}

export function useRegistrarSuprimento() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (valor: number) => api.post<MovimentoCaixa>('/caixa/suprimentos', { valor }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['caixa', 'suprimentos'] })
      queryClient.invalidateQueries({ queryKey: QUERY_KEY })
    },
  })
}

export function useRegistrarSangria() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (valor: number) => api.post<MovimentoCaixa>('/caixa/sangrias', { valor }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['caixa', 'sangrias'] })
      queryClient.invalidateQueries({ queryKey: QUERY_KEY })
    },
  })
}

// ---------- Fluxo de Caixa ----------

export function useFluxoCaixa(filtro: FluxoCaixaFiltro) {
  return useQuery({
    queryKey: ['caixa', 'fluxo', filtro],
    queryFn: async () => (await api.get<PagedResult<FluxoCaixa>>('/caixa/fluxo', { params: filtro })).data,
    placeholderData: keepPreviousData,
  })
}

export function useFluxoCaixaResumo(filtro: FluxoCaixaFiltro) {
  // Indicadores e gráficos não dependem da página nem do tamanho dela: só do período e do nome.
  const { dataInicio, dataFim, usuarioNome } = filtro
  return useQuery({
    queryKey: ['caixa', 'fluxo', 'resumo', { dataInicio, dataFim, usuarioNome }],
    queryFn: async () =>
      (await api.get<FluxoCaixaResumo>('/caixa/fluxo/resumo', { params: { dataInicio, dataFim, usuarioNome } })).data,
    placeholderData: keepPreviousData,
  })
}

const TAMANHO_PAGINA_EXPORTACAO = 500
// Trava de segurança: 5.000 caixas (mais de 13 anos de caixa diário) já é muito além de qualquer relatório real.
const MAX_PAGINAS_EXPORTACAO = 10

/** Todos os caixas do filtro, para exportar (a lista da tela é paginada; o arquivo precisa ser completo). */
export async function buscarFluxoCaixaCompleto(filtro: FluxoCaixaFiltro): Promise<FluxoCaixa[]> {
  const todos: FluxoCaixa[] = []
  for (let pagina = 1; pagina <= MAX_PAGINAS_EXPORTACAO; pagina++) {
    const { data } = await api.get<PagedResult<FluxoCaixa>>('/caixa/fluxo', {
      params: { ...filtro, pagina, tamanhoPagina: TAMANHO_PAGINA_EXPORTACAO },
    })
    todos.push(...data.itens)
    if (pagina >= data.totalPaginas) break
  }
  return todos
}

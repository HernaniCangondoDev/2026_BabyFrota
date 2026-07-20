import { keepPreviousData, useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { api } from '@/lib/api'
import type { PagedResult } from '@/types/paged-result'
import type { Carrinho, CarrinhoUpsert, StatusCarrinho } from './types'

const QUERY_KEY = ['carrinhos']

interface Filtro {
  descricao?: string
  statusId?: number
  tipoCarrinhoId?: number
  pagina?: number
  tamanhoPagina?: number
}

async function listar(filtro: Filtro): Promise<PagedResult<Carrinho>> {
  const { data } = await api.get<PagedResult<Carrinho>>('/carrinho', { params: filtro })
  return data
}

export function useCarrinhos(filtro: Filtro = {}) {
  return useQuery({
    queryKey: [...QUERY_KEY, filtro],
    queryFn: () => listar(filtro),
    placeholderData: keepPreviousData,
  })
}

export function useStatusCarrinho() {
  return useQuery({
    queryKey: ['carrinhos', 'status'],
    queryFn: async () => (await api.get<StatusCarrinho[]>('/carrinho/status')).data,
    staleTime: 5 * 60_000,
  })
}

export function useCriarCarrinho() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (payload: CarrinhoUpsert) => api.post<Carrinho>('/carrinho', payload),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: QUERY_KEY }),
  })
}

export function useAtualizarCarrinho() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ id, payload }: { id: number; payload: CarrinhoUpsert }) =>
      api.put<Carrinho>(`/carrinho/${id}`, payload),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: QUERY_KEY }),
  })
}

export function useExcluirCarrinho() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (id: number) => api.delete(`/carrinho/${id}`),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: QUERY_KEY }),
  })
}

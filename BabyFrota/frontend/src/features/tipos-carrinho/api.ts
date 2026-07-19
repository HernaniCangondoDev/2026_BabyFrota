import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { api } from '@/lib/api'
import type { TipoCarrinho, TipoCarrinhoUpsert } from './types'

const QUERY_KEY = ['tipos-carrinho']

async function listar(): Promise<TipoCarrinho[]> {
  const { data } = await api.get<TipoCarrinho[]>('/tipocarrinho')
  return data
}

export function useTiposCarrinho() {
  return useQuery({ queryKey: QUERY_KEY, queryFn: listar })
}

export function useCriarTipoCarrinho() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (payload: TipoCarrinhoUpsert) => api.post<TipoCarrinho>('/tipocarrinho', payload),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: QUERY_KEY }),
  })
}

export function useAtualizarTipoCarrinho() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ id, payload }: { id: number; payload: TipoCarrinhoUpsert }) =>
      api.put<TipoCarrinho>(`/tipocarrinho/${id}`, payload),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: QUERY_KEY }),
  })
}

export function useExcluirTipoCarrinho() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (id: number) => api.delete(`/tipocarrinho/${id}`),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: QUERY_KEY }),
  })
}

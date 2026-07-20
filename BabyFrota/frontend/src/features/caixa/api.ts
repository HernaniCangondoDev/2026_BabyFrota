import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { AxiosError } from 'axios'
import { api } from '@/lib/api'
import type { AberturaCaixa, CaixaMovimento, FechamentoCaixa, MovimentoCaixa } from './types'

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

export function useFecharCaixa() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (payload: FechamentoCaixa) => api.post<CaixaMovimento>('/caixa/fechamento', payload),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: QUERY_KEY }),
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

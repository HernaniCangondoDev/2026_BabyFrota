import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { api } from '@/lib/api'
import type {
  CarrinhoDisponivel,
  DevolucaoRequest,
  EntregaRequest,
  FaixaPreco,
  FormaRecebimento,
  Locacao,
  PreviaDevolucao,
  Troca,
  TrocaCarrinhoRequest,
} from './types'

export function useCarrinhosDisponiveis() {
  return useQuery({
    queryKey: ['locacoes', 'carrinhos-disponiveis'],
    queryFn: async () => (await api.get<CarrinhoDisponivel[]>('/locacao/carrinhos-disponiveis')).data,
  })
}

export function useFaixasPreco(carrinhoId: number | null) {
  return useQuery({
    queryKey: ['locacoes', 'precos', carrinhoId],
    queryFn: async () => (await api.get<FaixaPreco[]>(`/locacao/carrinhos/${carrinhoId}/precos`)).data,
    enabled: carrinhoId !== null,
  })
}

export function useFormasRecebimento() {
  return useQuery({
    queryKey: ['locacoes', 'formas-recebimento'],
    queryFn: async () => (await api.get<FormaRecebimento[]>('/locacao/formas-recebimento')).data,
    staleTime: 5 * 60_000,
  })
}

export function useLocacoesEmAndamento() {
  return useQuery({
    queryKey: ['locacoes', 'em-andamento'],
    queryFn: async () => (await api.get<Locacao[]>('/locacao/em-andamento')).data,
  })
}

export function useRegistrarEntrega() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (payload: EntregaRequest) => api.post<Locacao>('/locacao/entrega', payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['locacoes'] })
      queryClient.invalidateQueries({ queryKey: ['carrinhos'] })
      queryClient.invalidateQueries({ queryKey: ['caixa-aberto'] })
    },
  })
}

export function useCarrinhosParaTroca(locacaoId: number | null) {
  return useQuery({
    queryKey: ['locacoes', 'carrinhos-para-troca', locacaoId],
    queryFn: async () => (await api.get<CarrinhoDisponivel[]>(`/locacao/${locacaoId}/carrinhos-para-troca`)).data,
    enabled: locacaoId !== null,
  })
}

export function useTrocasDaLocacao(locacaoId: number | null) {
  return useQuery({
    queryKey: ['locacoes', 'trocas', locacaoId],
    queryFn: async () => (await api.get<Troca[]>(`/locacao/${locacaoId}/trocas`)).data,
    enabled: locacaoId !== null,
  })
}

export function useTrocarCarrinho() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ locacaoId, payload }: { locacaoId: number; payload: TrocaCarrinhoRequest }) =>
      api.post<Locacao>(`/locacao/${locacaoId}/troca`, payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['locacoes'] })
      queryClient.invalidateQueries({ queryKey: ['carrinhos'] })
    },
  })
}

export function usePreviaDevolucao(locacaoId: number | null) {
  return useQuery({
    queryKey: ['locacoes', 'previa-devolucao', locacaoId],
    queryFn: async () => (await api.get<PreviaDevolucao>(`/locacao/${locacaoId}/previa-devolucao`)).data,
    enabled: locacaoId !== null,
  })
}

export function useRegistrarDevolucao() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ locacaoId, payload }: { locacaoId: number; payload: DevolucaoRequest }) =>
      api.post<Locacao>(`/locacao/${locacaoId}/devolucao`, payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['locacoes'] })
      queryClient.invalidateQueries({ queryKey: ['carrinhos'] })
      queryClient.invalidateQueries({ queryKey: ['caixa-aberto'] })
    },
  })
}

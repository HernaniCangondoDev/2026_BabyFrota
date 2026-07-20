import { keepPreviousData, useQuery } from '@tanstack/react-query'
import { api } from '@/lib/api'
import type { PagedResult } from '@/types/paged-result'
import type {
  ClienteRelatorio,
  FaturamentoPorDia,
  LocacaoHistorico,
  RelatorioClientesFiltro,
  RelatorioClientesResumo,
  RelatorioHistoricoFiltro,
  RelatorioHistoricoResumo,
} from './types'

export function useRelatorioClientes(filtro: RelatorioClientesFiltro) {
  return useQuery({
    queryKey: ['relatorios', 'clientes', filtro],
    queryFn: async () => (await api.get<PagedResult<ClienteRelatorio>>('/relatorio/clientes', { params: filtro })).data,
    placeholderData: keepPreviousData,
  })
}

export function useRelatorioClientesResumo(filtro: RelatorioClientesFiltro) {
  return useQuery({
    queryKey: ['relatorios', 'clientes', 'resumo', filtro],
    queryFn: async () =>
      (await api.get<RelatorioClientesResumo>('/relatorio/clientes/resumo', { params: filtro })).data,
    placeholderData: keepPreviousData,
  })
}

export function useRelatorioHistorico(filtro: RelatorioHistoricoFiltro) {
  return useQuery({
    queryKey: ['relatorios', 'historico', filtro],
    queryFn: async () => (await api.get<PagedResult<LocacaoHistorico>>('/relatorio/historico', { params: filtro })).data,
    placeholderData: keepPreviousData,
  })
}

export function useRelatorioHistoricoResumo(filtro: RelatorioHistoricoFiltro) {
  return useQuery({
    queryKey: ['relatorios', 'historico', 'resumo', filtro],
    queryFn: async () =>
      (await api.get<RelatorioHistoricoResumo>('/relatorio/historico/resumo', { params: filtro })).data,
    placeholderData: keepPreviousData,
  })
}

export function useFaturamentoPorDia(filtro: RelatorioHistoricoFiltro) {
  return useQuery({
    queryKey: ['relatorios', 'historico', 'faturamento-por-dia', filtro],
    queryFn: async () =>
      (await api.get<FaturamentoPorDia[]>('/relatorio/historico/faturamento-por-dia', { params: filtro })).data,
    placeholderData: keepPreviousData,
  })
}

import { keepPreviousData, useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { api } from '@/lib/api'
import { toast } from '@/stores/toast-store'
import type { PagedResult } from '@/types/paged-result'
import type {
  CarrinhoDisponivel,
  DevolucaoRequest,
  EntregaRequest,
  FaixaPreco,
  FormaRecebimento,
  Locacao,
  LocacaoConsulta,
  LocacaoConsultaFiltro,
  LocacaoConsultaResumo,
  LocacaoDetalhe,
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
    // Outra estação pode entregar ou devolver a qualquer momento: mantém a fila atualizada sem precisar recarregar.
    refetchInterval: 30_000,
  })
}

export function useRegistrarEntrega() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (payload: EntregaRequest) => api.post<Locacao>('/locacao/entrega', payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['locacoes'] })
      queryClient.invalidateQueries({ queryKey: ['carrinhos'] })
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
    // Falha aqui é regra de negócio (ex.: sem faixa de preço), não instabilidade: repetir só atrasa a mensagem.
    retry: false,
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

// ---------- Consulta de locações (tela "Locações") ----------

export function useConsultaLocacoes(filtro: LocacaoConsultaFiltro) {
  return useQuery({
    queryKey: ['locacoes', 'consulta', filtro],
    queryFn: async () => (await api.get<PagedResult<LocacaoConsulta>>('/locacao/consulta', { params: filtro })).data,
    placeholderData: keepPreviousData,
  })
}

export function useConsultaLocacoesResumo(filtro: LocacaoConsultaFiltro) {
  // O total não depende da página nem do tamanho dela: só dos filtros.
  const { pagina: _pagina, tamanhoPagina: _tamanho, ...semPaginacao } = filtro
  return useQuery({
    queryKey: ['locacoes', 'consulta', 'resumo', semPaginacao],
    queryFn: async () =>
      (await api.get<LocacaoConsultaResumo>('/locacao/consulta/resumo', { params: semPaginacao })).data,
    placeholderData: keepPreviousData,
  })
}

export async function buscarLocacaoDetalhe(locacaoId: number): Promise<LocacaoDetalhe> {
  return (await api.get<LocacaoDetalhe>(`/locacao/${locacaoId}/detalhe`)).data
}

export function useLocacaoDetalhe(locacaoId: number | null) {
  return useQuery({
    queryKey: ['locacoes', 'detalhe', locacaoId],
    queryFn: () => buscarLocacaoDetalhe(locacaoId as number),
    enabled: locacaoId !== null,
  })
}

const TAMANHO_PAGINA_EXPORTACAO = 500
const MAX_LOCACOES_EXPORTACAO = 10_000

/** Todas as locações do filtro, para exportar (a tabela é paginada; o arquivo precisa ser completo). */
export async function buscarLocacoesCompleto(filtro: LocacaoConsultaFiltro): Promise<LocacaoConsulta[]> {
  const { pagina: _pagina, tamanhoPagina: _tamanho, ...semPaginacao } = filtro
  const todas: LocacaoConsulta[] = []
  for (let pagina = 1; ; pagina++) {
    const { data } = await api.get<PagedResult<LocacaoConsulta>>('/locacao/consulta', {
      params: { ...semPaginacao, pagina, tamanhoPagina: TAMANHO_PAGINA_EXPORTACAO },
    })
    if (data.totalRegistros > MAX_LOCACOES_EXPORTACAO) {
      // Um arquivo de dezenas de milhares de linhas trava o navegador: pede para refinar o filtro em vez de tentar.
      toast.error(
        'Muitas locações para exportar.',
        `O filtro tem ${data.totalRegistros.toLocaleString('pt-BR')} locações; o máximo por arquivo é ${MAX_LOCACOES_EXPORTACAO.toLocaleString('pt-BR')}. Reduza o período.`,
      )
      return []
    }
    todas.push(...data.itens)
    if (pagina >= data.totalPaginas) return todas
  }
}

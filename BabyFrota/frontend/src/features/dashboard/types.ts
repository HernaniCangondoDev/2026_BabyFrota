export interface CarrinhoMaisLocado {
  descricao: string
  quantidadeLocacoes: number
}

export interface DashboardResumo {
  totalCarrinhos: number
  carrinhosDisponiveis: number
  carrinhosAlugados: number
  percentualOcupacao: number
  caixaAberto: boolean
  faturamentoCaixaAtual: number | null
  faturamentoHoje: number
  locacoesHoje: number
  ticketMedioHoje: number
  topCarrinhos: CarrinhoMaisLocado[]
}

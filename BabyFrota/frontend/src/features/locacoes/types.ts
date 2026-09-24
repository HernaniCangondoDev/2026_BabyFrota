export interface CarrinhoDisponivel {
  id: number
  descricao: string
  tipoCarrinhoId: number
  tipoCarrinhoDescricao: string
}

export interface FaixaPreco {
  minimoMinutos: number
  maximoMinutos: number
  valor: number
}

export interface FormaRecebimento {
  id: number
  nome: string
}

export interface Pagamento {
  formaRecebimentoId: number
  valor: number
}

/** A entrega só reserva o carrinho: preço, desconto e pagamento são apurados na devolução. */
export interface EntregaRequest {
  clienteId: number
  carrinhoId: number
  observacao?: string
}

export interface Locacao {
  id: number
  clienteId: number
  clienteNome: string
  carrinhoId: number
  carrinhoDescricao: string
  dataEntrega: string
  dataDevolucao: string | null
  tempoMinutos: number | null
  valorTotal: number | null
  desconto: number | null
  troco: number | null
  usuarioEntregaNome: string
  emAndamento: boolean
}

export interface TrocaCarrinhoRequest {
  novoCarrinhoId: number
}

export interface Troca {
  id: number
  carrinhoAnteriorId: number
  carrinhoAnteriorDescricao: string
  novoCarrinhoId: number
  novoCarrinhoDescricao: string
  precoCarrinhoAnterior: number | null
  tempoCarrinhoAnterior: number | null
  dataTroca: string
  usuarioNome: string
}

export interface PreviaDevolucao {
  tempoMinutos: number
  valor: number
  /** O tempo passou da última faixa cadastrada e `valor` é o preço dessa última faixa. */
  acimaDaTabela: boolean
  maximoTabelaMinutos: number | null
  /** Parcelas que a locação já tem (só em locações do fluxo antigo, em que a entrega também cobrava). Contam como já pago. */
  valorJaRecebido: number
}

export interface DevolucaoRequest {
  desconto: number
  observacao?: string
  pagamentos: Pagamento[]
}

// ---------- Consulta de locações (tela "Locações") ----------

export type EstadoLocacaoFiltro = 'entregue' | 'devolvido'

export interface LocacaoConsultaFiltro {
  dataEntregaInicio?: string
  dataEntregaFim?: string
  estado?: EstadoLocacaoFiltro
  clienteNome?: string
  carrinhoId?: number
  tipoCarrinhoId?: number
  formaRecebimentoId?: number
  pagina?: number
  tamanhoPagina?: number
}

export interface LocacaoConsulta {
  id: number
  clienteId: number
  clienteNome: string
  carrinhoDescricao: string
  tipoCarrinhoDescricao: string
  dataEntrega: string
  dataDevolucao: string | null
  tempoMinutos: number | null
  /** Só existe depois da devolução: o valor é apurado e cobrado nela. */
  valorTotal: number | null
  entregue: boolean
}

export interface LocacaoConsultaResumo {
  totalLocacoes: number
  totalEntregues: number
  totalDevolvidas: number
  valorTotal: number
}

export interface LocacaoPagamento {
  numero: number
  formaRecebimentoId: number
  formaRecebimentoNome: string
  valorRecebido: number
}

export interface LocacaoDetalhe {
  id: number
  entregue: boolean
  clienteId: number
  clienteNome: string
  clienteDddTelefone: string | null
  clienteTelefone: string | null
  clienteDddCelular: string | null
  clienteCelular: string | null
  carrinhoId: number
  carrinhoDescricao: string
  tipoCarrinhoDescricao: string
  dataEntrega: string
  dataDevolucao: string | null
  usuarioEntregaNome: string
  usuarioDevolucaoNome: string | null
  tempoMinutos: number | null
  /** Valor da tabela de preços (valor total + desconto). Calculado, não gravado. */
  valorTabela: number | null
  desconto: number | null
  valorTotal: number | null
  troco: number | null
  valorRecebido: number
  /** Um campo só: a observação da entrega e a da devolução ficam concatenadas. */
  observacao: string | null
  caixaId: number
  /** Pagamentos que não fecham com o valor: sinal de parcelas do fluxo antigo, em que a entrega também cobrava. */
  pagamentosInconsistentes: boolean
  pagamentos: LocacaoPagamento[]
  trocas: Troca[]
}

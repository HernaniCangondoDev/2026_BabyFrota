export interface CaixaMovimento {
  id: number
  dataAbertura: string
  dataFechamento: string | null
  usuarioAberturaId: number
  usuarioAberturaNome: string
  usuarioFechamentoNome: string | null
  suprimentoInicial: number
  /** Como no legado, gravado no fechamento como o total vendido; não é um valor digitado. */
  valorFechamento: number | null
  aberto: boolean
  /** Reforços de caixa; não inclui o suprimento inicial. */
  totalSuprimentos: number
  totalSangrias: number
  /** Total vendido: soma das locações já devolvidas neste caixa. */
  totalLocacoes: number
  /** Recebido por forma de recebimento (chave = id da forma). O dinheiro já vem líquido de troco. */
  porForma: Record<string, number>
  /** Locações entregues neste caixa e ainda não devolvidas; enquanto houver, o caixa não fecha. */
  locacoesPendentes: number
  /** Dinheiro que deveria estar na gaveta. */
  saldoEmDinheiro: number
  /** O usuário logado pode fechar este caixa (quem abriu, Gerente ou Administrador). */
  podeFechar: boolean
}

export interface AberturaCaixa {
  suprimentoInicial: number
}

export interface MovimentoCaixa {
  id: number
  data: string
  valor: number
  usuarioNome: string
}

/** Ids fixos da tabela FormaRecebimento; o legado também depende deles. */
export const FORMA_DINHEIRO_ID = 1

export interface FluxoCaixaFiltro {
  dataInicio?: string
  dataFim?: string
  usuarioNome?: string
  pagina?: number
  tamanhoPagina?: number
}

export interface FluxoCaixaRecebido {
  usuarioId: number
  usuarioNome: string
  totalRecebido: number
  quantidadeLocacoes: number
}

export interface FluxoCaixa {
  id: number
  usuarioAberturaNome: string
  usuarioFechamentoNome: string | null
  dataAbertura: string
  dataFechamento: string | null
  aberto: boolean
  suprimentoInicial: number
  reforcos: number
  totalVendido: number
  totalGastos: number
  troco: number
  quantidadeLocacoes: number
  locacoesPendentes: number
  porForma: Record<string, number>
  saldoEmDinheiro: number
  /** A soma das formas não bate com o total vendido (ex.: parcelas em duplicidade do fluxo antigo). */
  somaFormasDiverge: boolean
  recebidoPorUsuario: FluxoCaixaRecebido[]
}

export interface FluxoCaixaTotais {
  quantidadeCaixas: number
  caixasAbertos: number
  caixasComDivergencia: number
  suprimentoInicial: number
  reforcos: number
  totalVendido: number
  totalGastos: number
  troco: number
  quantidadeLocacoes: number
  saldoEmDinheiro: number
  porForma: Record<string, number>
}

export interface FluxoCaixaDia {
  data: string
  caixas: number
  totalVendido: number
  totalGastos: number
  porForma: Record<string, number>
}

export interface FluxoCaixaResumo {
  totais: FluxoCaixaTotais
  porDia: FluxoCaixaDia[]
  porUtilizador: FluxoCaixaRecebido[]
}

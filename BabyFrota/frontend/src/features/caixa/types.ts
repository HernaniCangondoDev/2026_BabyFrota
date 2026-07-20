export interface CaixaMovimento {
  id: number
  dataAbertura: string
  dataFechamento: string | null
  usuarioAberturaNome: string
  usuarioFechamentoNome: string | null
  suprimentoInicial: number
  valorFechamento: number | null
  aberto: boolean
  totalSuprimentos: number
  totalSangrias: number
  totalLocacoes: number
  saldoAtual: number
}

export interface AberturaCaixa {
  suprimentoInicial: number
}

export interface FechamentoCaixa {
  valorFechamento: number
}

export interface MovimentoCaixa {
  id: number
  data: string
  valor: number
  usuarioNome: string
}

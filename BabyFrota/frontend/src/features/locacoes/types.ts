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

export interface EntregaRequest {
  clienteId: number
  carrinhoId: number
  tempoMinutos: number
  desconto: number
  observacao?: string
  pagamentos: Pagamento[]
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
}

export interface DevolucaoRequest {
  desconto: number
  observacao?: string
  pagamentos: Pagamento[]
}

export interface Carrinho {
  id: number
  descricao: string
  tipoCarrinhoId: number
  tipoCarrinhoDescricao: string
  statusId: number
  statusNome: string
  dataAquisicao: string
  fornecedor: string
  valorAquisicao: number
  observacao: string | null
  dataCadastro: string | null
}

export interface CarrinhoUpsert {
  descricao: string
  tipoCarrinhoId: number
  statusId: number
  dataAquisicao: string
  fornecedor: string
  valorAquisicao: number
  observacao?: string
}

export interface StatusCarrinho {
  id: number
  nome: string
}

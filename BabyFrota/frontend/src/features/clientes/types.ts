export interface Filho {
  id: number
  nome: string
  dataNascimento: string | null
  sexo: string | null
}

export interface FilhoUpsert {
  /** Ausente/undefined = filho novo. */
  id?: number
  nome: string
  dataNascimento?: string
  sexo?: string
}

export interface Cliente {
  id: number
  nome: string
  cpf: string
  rg: string | null
  ddd: string
  telefone: string
  dddCelular: string | null
  celular: string | null
  email: string | null
  cep: string | null
  logradouro: string | null
  numero: string | null
  complemento: string | null
  cidade: string | null
  uf: string | null
  dataNascimento: string | null
  profissao: string | null
  classeSocial: string | null
  sexo: string | null
  observacao: string | null
  dataCadastro: string | null
  quantidadeFilhos: number
  quantidadeLocacoes: number
  filhos: Filho[]
}

export interface ClienteUpsert {
  nome: string
  cpf: string
  rg?: string
  ddd: string
  telefone: string
  dddCelular?: string
  celular?: string
  email?: string
  cep?: string
  logradouro?: string
  numero?: string
  complemento?: string
  cidade?: string
  uf?: string
  dataNascimento?: string
  profissao?: string
  classeSocial?: string
  sexo?: string
  observacao?: string
  filhos: FilhoUpsert[]
}

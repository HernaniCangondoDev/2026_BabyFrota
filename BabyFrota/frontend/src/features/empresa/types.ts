export interface Empresa {
  id: number
  cnpj: string
  razaoSocial: string
  responsavelLegal: string
  cep: string | null
  logradouro: string | null
  complemento: string | null
  numero: string | null
  ddd: string | null
  telefone: string | null
  celular: string | null
}

export interface EmpresaUpsert {
  cnpj: string
  razaoSocial: string
  responsavelLegal: string
  cep?: string
  logradouro?: string
  complemento?: string
  numero?: string
  ddd?: string
  telefone?: string
  celular?: string
}

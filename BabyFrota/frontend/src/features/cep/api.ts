import { api } from '@/lib/api'

export interface EnderecoCep {
  cep: string
  logradouro: string
  bairro: string
  cidade: string
  uf: string
}

/** Busca um CEP (base local + fallback ViaCEP com autocadastro, feito no backend). */
export async function buscarCep(cep: string): Promise<EnderecoCep> {
  const digitos = cep.replace(/\D/g, '')
  const { data } = await api.get<EnderecoCep>(`/cep/${digitos}`)
  return data
}

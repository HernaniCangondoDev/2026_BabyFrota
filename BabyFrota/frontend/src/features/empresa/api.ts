import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { AxiosError } from 'axios'
import { api } from '@/lib/api'
import type { Empresa, EmpresaUpsert } from './types'

const QUERY_KEY = ['empresa']

async function obter(): Promise<Empresa | null> {
  try {
    const { data } = await api.get<Empresa>('/empresa')
    return data
  } catch (err) {
    if (err instanceof AxiosError && err.response?.status === 404) return null
    throw err
  }
}

export function useEmpresa() {
  return useQuery({ queryKey: QUERY_KEY, queryFn: obter })
}

export function useSalvarEmpresa() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (payload: EmpresaUpsert) => api.put<Empresa>('/empresa', payload),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: QUERY_KEY }),
  })
}

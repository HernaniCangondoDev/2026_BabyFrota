import { keepPreviousData, useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { api } from '@/lib/api'
import type { PagedResult } from '@/types/paged-result'
import type { Perfil, Usuario, UsuarioUpsert } from './types'

const QUERY_KEY = ['usuarios']

interface Filtro {
  nome?: string
  cpf?: string
  pagina?: number
  tamanhoPagina?: number
}

async function listar(filtro: Filtro): Promise<PagedResult<Usuario>> {
  const { data } = await api.get<PagedResult<Usuario>>('/usuario', { params: filtro })
  return data
}

export function useUsuarios(filtro: Filtro = {}) {
  return useQuery({
    queryKey: [...QUERY_KEY, filtro],
    queryFn: () => listar(filtro),
    placeholderData: keepPreviousData,
  })
}

export function usePerfis() {
  return useQuery({
    queryKey: ['perfis'],
    queryFn: async () => (await api.get<Perfil[]>('/usuario/perfis')).data,
    staleTime: 5 * 60_000,
  })
}

export function useCriarUsuario() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (payload: UsuarioUpsert) => api.post<Usuario>('/usuario', payload),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: QUERY_KEY }),
  })
}

export function useAtualizarUsuario() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ id, payload }: { id: number; payload: UsuarioUpsert }) =>
      api.put<Usuario>(`/usuario/${id}`, payload),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: QUERY_KEY }),
  })
}

export function useInativarUsuario() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (id: number) => api.delete(`/usuario/${id}`),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: QUERY_KEY }),
  })
}

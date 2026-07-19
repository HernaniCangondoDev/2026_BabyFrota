import { useQuery } from '@tanstack/react-query'
import { api } from '@/lib/api'
import type { DashboardResumo } from './types'

async function fetchResumo(): Promise<DashboardResumo> {
  const { data } = await api.get<DashboardResumo>('/dashboard/resumo')
  return data
}

export function useDashboardResumo() {
  return useQuery({
    queryKey: ['dashboard', 'resumo'],
    queryFn: fetchResumo,
    refetchInterval: 60_000,
  })
}

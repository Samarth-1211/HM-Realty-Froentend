import { useQuery } from '@tanstack/react-query'
import { employeesApi } from '@/api/employees.api'
import { REFRESH_INTERVAL_MS } from '@/lib/constants'
import { queryKeys } from './query-keys'

export function useTeamSummary(enabled = true) {
  return useQuery({
    queryKey: queryKeys.employees.teamSummary,
    queryFn: employeesApi.teamSummary,
    refetchInterval: REFRESH_INTERVAL_MS,
    enabled,
  })
}

export function useEmployeeSummary(userId: string | undefined) {
  return useQuery({
    queryKey: queryKeys.employees.summary(userId ?? ''),
    queryFn: () => employeesApi.summary(userId!),
    enabled: !!userId,
    refetchInterval: REFRESH_INTERVAL_MS,
  })
}

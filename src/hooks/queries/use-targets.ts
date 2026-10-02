import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
import { targetsApi, type SetTargetPayload, type TargetPeriodQuery } from '@/api/targets.api'
import { extractErrorMessage } from '@/lib/api-client'
import { REFRESH_INTERVAL_MS } from '@/lib/constants'
import { queryKeys } from './query-keys'

export function useMyTarget(query: TargetPeriodQuery = {}) {
  return useQuery({
    queryKey: queryKeys.targets.mine(query),
    queryFn: () => targetsApi.mine(query),
    // Actuals move as calls are logged and leads converted.
    refetchInterval: REFRESH_INTERVAL_MS,
  })
}

export function useTeamTargets(query: TargetPeriodQuery = {}, enabled = true) {
  return useQuery({
    queryKey: queryKeys.targets.team(query),
    queryFn: () => targetsApi.team(query),
    refetchInterval: REFRESH_INTERVAL_MS,
    enabled,
  })
}

export function useSetTarget() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (payload: SetTargetPayload) => targetsApi.set(payload),
    onSuccess: () => {
      toast.success('Target saved')
      qc.invalidateQueries({ queryKey: ['targets'] })
      // The team roll-up shows target progress too.
      qc.invalidateQueries({ queryKey: ['employees'] })
    },
    onError: (error) => toast.error('Could not save target', { description: extractErrorMessage(error) }),
  })
}

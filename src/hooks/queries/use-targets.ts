import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
import { targetsApi, type SetTargetPayload, type TargetPeriodQuery } from '@/api/targets.api'
import { extractErrorMessage } from '@/lib/api-client'
import { queryKeys } from './query-keys'

export function useMyTarget(query: TargetPeriodQuery = {}) {
  return useQuery({
    queryKey: queryKeys.targets.mine(query),
    queryFn: () => targetsApi.mine(query),
  })
}

export function useTeamTargets(query: TargetPeriodQuery = {}, enabled = true) {
  return useQuery({
    queryKey: queryKeys.targets.team(query),
    queryFn: () => targetsApi.team(query),
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
    },
    onError: (error) => toast.error('Could not save target', { description: extractErrorMessage(error) }),
  })
}

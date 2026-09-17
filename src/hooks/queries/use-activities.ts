import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
import { activitiesApi, type LogActivityPayload } from '@/api/activities.api'
import { extractErrorMessage } from '@/lib/api-client'
import { queryKeys } from './query-keys'

export function useMyActivities(date?: string) {
  return useQuery({
    queryKey: queryKeys.activities.mine(date),
    queryFn: () => activitiesApi.mine(date),
  })
}

export function useTeamActivities(date?: string, enabled = true) {
  return useQuery({
    queryKey: queryKeys.activities.team(date),
    queryFn: () => activitiesApi.team(date),
    enabled,
  })
}

export function useOrgActivities(date?: string, enabled = true) {
  return useQuery({
    queryKey: queryKeys.activities.org(date),
    queryFn: () => activitiesApi.org(date),
    enabled,
  })
}

export function useLogActivity() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (payload: LogActivityPayload) => activitiesApi.log(payload),
    onSuccess: () => {
      toast.success('Activity logged')
      qc.invalidateQueries({ queryKey: ['activities'] })
    },
    onError: (error) => toast.error('Could not log activity', { description: extractErrorMessage(error) }),
  })
}

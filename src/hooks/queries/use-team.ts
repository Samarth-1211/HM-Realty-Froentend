import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
import {
  teamApi,
  type CreateTeamMemberPayload,
  type TeamMemberQuery,
  type UpdateTeamMemberPayload,
} from '@/api/team.api'
import { extractErrorMessage } from '@/lib/api-client'
import { REFRESH_INTERVAL_MS } from '@/lib/constants'
import { queryKeys } from './query-keys'

export function useTeamMembers(query: TeamMemberQuery = {}) {
  return useQuery({
    queryKey: queryKeys.team.list(query),
    queryFn: () => teamApi.list(query),
    refetchInterval: REFRESH_INTERVAL_MS,
  })
}

export function useTeamMember(id: string | undefined) {
  return useQuery({
    queryKey: queryKeys.team.detail(id ?? ''),
    queryFn: () => teamApi.get(id!),
    enabled: !!id,
  })
}

export function useCreateTeamMember() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (payload: CreateTeamMemberPayload) => teamApi.create(payload),
    onSuccess: () => {
      toast.success('Team member added')
      qc.invalidateQueries({ queryKey: ['team-members'] })
    },
    onError: (error) => toast.error('Could not add team member', { description: extractErrorMessage(error) }),
  })
}

export function useUpdateTeamMember() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ id, payload }: { id: string; payload: UpdateTeamMemberPayload }) =>
      teamApi.update(id, payload),
    onSuccess: (_d, vars) => {
      toast.success('Team member updated')
      qc.invalidateQueries({ queryKey: ['team-members'] })
      qc.invalidateQueries({ queryKey: queryKeys.team.detail(vars.id) })
    },
    onError: (error) => toast.error('Could not update team member', { description: extractErrorMessage(error) }),
  })
}

export function useAssignTeamMemberProject() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ id, projectId }: { id: string; projectId: string }) =>
      teamApi.assignProject(id, projectId),
    onSuccess: (_d, vars) => {
      toast.success('Project assignment saved')
      qc.invalidateQueries({ queryKey: queryKeys.team.detail(vars.id) })
      qc.invalidateQueries({ queryKey: ['team-members'] })
    },
    onError: (error) => toast.error('Could not assign project', { description: extractErrorMessage(error) }),
  })
}

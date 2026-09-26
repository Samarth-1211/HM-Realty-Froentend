import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
import { usersApi } from '@/api/users.api'
import { teamApi } from '@/api/team.api'
import { extractErrorMessage } from '@/lib/api-client'
import type { DeleteUserPayload } from '@/types'
import { queryKeys } from './query-keys'

/**
 * `org` — an Admin deleting anyone below them (GET/DELETE /users/:id…).
 * `team` — a Manager deleting one of their own team members (/manager/team-members/:id…).
 */
export type DeletionScope = 'org' | 'team'

const apiFor = (scope: DeletionScope) => (scope === 'team' ? teamApi : usersApi)

export function useDeletionImpact(scope: DeletionScope, id: string | undefined) {
  return useQuery({
    queryKey: [...queryKeys.users.deletionImpact(id ?? ''), scope],
    queryFn: () => apiFor(scope).deletionImpact(id!),
    enabled: !!id,
    // Always recount right before deleting — leads and tasks move constantly.
    staleTime: 0,
    gcTime: 0,
  })
}

export function useDeleteUser(scope: DeletionScope) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ id, payload }: { id: string; payload: DeleteUserPayload }) => apiFor(scope).remove(id, payload),
    onSuccess: () => {
      toast.success('User deleted')
      // Leads, tasks and team membership may all have moved to someone else.
      for (const key of [['users'], ['managers'], ['team-members'], ['leads'], ['tasks'], ['employees']]) {
        qc.invalidateQueries({ queryKey: key })
      }
    },
    onError: (error) => toast.error('Could not delete user', { description: extractErrorMessage(error) }),
  })
}

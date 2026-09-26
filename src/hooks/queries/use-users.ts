import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
import { usersApi, type CreateUserPayload } from '@/api/users.api'
import { extractErrorMessage } from '@/lib/api-client'
import { REFRESH_INTERVAL_MS } from '@/lib/constants'
import { queryKeys } from './query-keys'

export function useUsers(enabled = true) {
  return useQuery({
    queryKey: queryKeys.users.all,
    queryFn: () => usersApi.list(),
    refetchInterval: REFRESH_INTERVAL_MS,
    enabled,
  })
}

/** Archive of deleted accounts — Admins can still open their history. */
export function useDeletedUsers(enabled = true) {
  return useQuery({
    queryKey: queryKeys.users.deleted,
    queryFn: () => usersApi.list(true),
    enabled,
  })
}

export function useUser(id: string | undefined) {
  return useQuery({
    queryKey: queryKeys.users.detail(id ?? ''),
    queryFn: () => usersApi.get(id!),
    enabled: !!id,
  })
}

export function useCreateUser() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (payload: CreateUserPayload) => usersApi.create(payload),
    onSuccess: () => {
      toast.success('User created')
      qc.invalidateQueries({ queryKey: queryKeys.users.all })
    },
    onError: (error) => toast.error('Could not create user', { description: extractErrorMessage(error) }),
  })
}

export function useDeactivateUser() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (id: string) => usersApi.deactivate(id),
    onSuccess: () => {
      toast.success('User deactivated')
      qc.invalidateQueries({ queryKey: queryKeys.users.all })
      qc.invalidateQueries({ queryKey: queryKeys.managers.all })
    },
    onError: (error) => toast.error('Could not deactivate user', { description: extractErrorMessage(error) }),
  })
}

export function useReactivateUser() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (id: string) => usersApi.reactivate(id),
    onSuccess: () => {
      toast.success('User reactivated')
      qc.invalidateQueries({ queryKey: queryKeys.users.all })
      qc.invalidateQueries({ queryKey: queryKeys.managers.all })
    },
    onError: (error) => toast.error('Could not reactivate user', { description: extractErrorMessage(error) }),
  })
}

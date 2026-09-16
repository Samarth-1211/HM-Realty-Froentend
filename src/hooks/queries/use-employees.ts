import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
import { employeesApi, type UpdateMyProfilePayload } from '@/api/employees.api'
import { extractErrorMessage } from '@/lib/api-client'
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

export function useTeamRollup(enabled = true) {
  return useQuery({
    queryKey: queryKeys.employees.teamRollup,
    queryFn: employeesApi.teamRollup,
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

export function useEmployeeProfile(userId: string | undefined) {
  return useQuery({
    queryKey: queryKeys.employees.profile(userId ?? ''),
    queryFn: () => employeesApi.profile(userId!),
    enabled: !!userId,
  })
}

export function useUpdateMyProfile() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (payload: UpdateMyProfilePayload) => employeesApi.updateMyProfile(payload),
    onSuccess: (data) => {
      toast.success('Profile updated')
      qc.invalidateQueries({ queryKey: queryKeys.employees.profile(data.userId) })
    },
    onError: (error) => toast.error('Could not update profile', { description: extractErrorMessage(error) }),
  })
}

export function useSetEmployeeCode() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ userId, employeeCode }: { userId: string; employeeCode: string }) =>
      employeesApi.setEmployeeCode(userId, employeeCode),
    onSuccess: (data) => {
      toast.success('Employee code saved')
      qc.invalidateQueries({ queryKey: queryKeys.employees.profile(data.userId) })
    },
    onError: (error) => toast.error('Could not save employee code', { description: extractErrorMessage(error) }),
  })
}

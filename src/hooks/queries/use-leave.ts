import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
import { leaveApi, type ApplyLeavePayload, type ReviewLeavePayload } from '@/api/leave.api'
import { extractErrorMessage } from '@/lib/api-client'
import type { LeaveStatus } from '@/types'
import { queryKeys } from './query-keys'

export function useMyLeaveRequests() {
  return useQuery({
    queryKey: queryKeys.leave.mine,
    queryFn: leaveApi.mine,
  })
}

export function useTeamPendingLeave(enabled = true) {
  return useQuery({
    queryKey: queryKeys.leave.teamPending,
    queryFn: leaveApi.teamPending,
    enabled,
  })
}

export function useOrgLeaveRequests(status?: LeaveStatus, enabled = true) {
  return useQuery({
    queryKey: queryKeys.leave.org(status),
    queryFn: () => leaveApi.org(status),
    enabled,
  })
}

export function useApplyLeave() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (payload: ApplyLeavePayload) => leaveApi.apply(payload),
    onSuccess: () => {
      toast.success('Leave request submitted')
      qc.invalidateQueries({ queryKey: queryKeys.leave.mine })
    },
    onError: (error) => toast.error('Could not submit leave request', { description: extractErrorMessage(error) }),
  })
}

export function useApproveLeave() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ id, payload }: { id: string; payload?: ReviewLeavePayload }) => leaveApi.approve(id, payload),
    onSuccess: () => {
      toast.success('Leave approved')
      qc.invalidateQueries({ queryKey: queryKeys.leave.teamPending })
      qc.invalidateQueries({ queryKey: ['leave'] })
      qc.invalidateQueries({ queryKey: ['attendance'] })
    },
    onError: (error) => toast.error('Could not approve leave', { description: extractErrorMessage(error) }),
  })
}

export function useRejectLeave() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ id, payload }: { id: string; payload?: ReviewLeavePayload }) => leaveApi.reject(id, payload),
    onSuccess: () => {
      toast.success('Leave rejected')
      qc.invalidateQueries({ queryKey: queryKeys.leave.teamPending })
      qc.invalidateQueries({ queryKey: ['leave'] })
    },
    onError: (error) => toast.error('Could not reject leave', { description: extractErrorMessage(error) }),
  })
}

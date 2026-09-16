import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
import { attendanceApi, type AttendanceRangeQuery, type CheckInPayload } from '@/api/attendance.api'
import { extractErrorMessage } from '@/lib/api-client'
import { queryKeys } from './query-keys'

export function useTodayAttendance() {
  return useQuery({
    queryKey: queryKeys.attendance.today,
    queryFn: attendanceApi.today,
  })
}

export function useMyAttendance(query: AttendanceRangeQuery = {}) {
  return useQuery({
    queryKey: queryKeys.attendance.mine(query),
    queryFn: () => attendanceApi.mine(query),
  })
}

export function useTeamAttendance(date?: string, enabled = true) {
  return useQuery({
    queryKey: queryKeys.attendance.team(date),
    queryFn: () => attendanceApi.team(date),
    enabled,
  })
}

export function useEmployeeAttendance(employeeId: string | undefined, query: AttendanceRangeQuery = {}) {
  return useQuery({
    queryKey: queryKeys.attendance.forEmployee(employeeId ?? '', query),
    queryFn: () => attendanceApi.forEmployee(employeeId!, query),
    enabled: !!employeeId,
  })
}

export function useCheckIn() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (payload: CheckInPayload) => attendanceApi.checkIn(payload),
    onSuccess: () => {
      toast.success("Checked in for today")
      qc.invalidateQueries({ queryKey: queryKeys.attendance.today })
      qc.invalidateQueries({ queryKey: ['attendance'] })
    },
    onError: (error) => toast.error('Could not check in', { description: extractErrorMessage(error) }),
  })
}

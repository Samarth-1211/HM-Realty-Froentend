import { apiClient } from '@/lib/api-client'
import type { Attendance, AttendanceStatus, TeamAttendanceItem } from '@/types'
import type { WorkReportCounts } from '@/lib/work-report'

export interface CheckInPayload {
  dayType: Extract<AttendanceStatus, 'PRESENT' | 'HALF_DAY' | 'ON_SITE_VISIT'>
  notes?: string
}

export interface CheckOutPayload {
  /** How many of each thing was done today (calls, site visits, meetings...). */
  counts?: WorkReportCounts
  /** Optional note. A check-out needs this and/or at least one count above 0. */
  summary?: string
  /** Leads the day's work was done on. */
  leadIds?: string[]
}

export interface AttendanceRangeQuery {
  from?: string
  to?: string
}

export const attendanceApi = {
  checkIn: (payload: CheckInPayload) =>
    apiClient.post<Attendance>('/attendance/check-in', payload).then((r) => r.data),

  checkOut: (payload: CheckOutPayload) =>
    apiClient.post<Attendance>('/attendance/check-out', payload).then((r) => r.data),

  today: () => apiClient.get<Attendance | null>('/attendance/today').then((r) => r.data),

  mine: (query: AttendanceRangeQuery = {}) =>
    apiClient.get<Attendance[]>('/attendance/me', { params: query }).then((r) => r.data),

  team: (date?: string) =>
    apiClient
      .get<TeamAttendanceItem[]>('/attendance/team', { params: date ? { date } : {} })
      .then((r) => r.data),

  org: (date?: string) =>
    apiClient
      .get<TeamAttendanceItem[]>('/attendance/org', { params: date ? { date } : {} })
      .then((r) => r.data),

  forEmployee: (employeeId: string, query: AttendanceRangeQuery = {}) =>
    apiClient.get<Attendance[]>(`/attendance/${employeeId}`, { params: query }).then((r) => r.data),
}

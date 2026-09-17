import { apiClient } from '@/lib/api-client'
import type { Task, TaskStatus, TaskType } from '@/types'

export interface CreateTaskPayload {
  title: string
  description?: string
  taskType?: TaskType
  dueAt?: string
  leadId?: string
  reminderOffsetsMinutes?: number[]
}

export type UpdateTaskPayload = Partial<CreateTaskPayload>

export interface TaskQuery {
  status?: TaskStatus
  leadId?: string
}

export const tasksApi = {
  list: (query: TaskQuery = {}) => apiClient.get<Task[]>('/tasks/me', { params: query }).then((r) => r.data),

  get: (id: string) => apiClient.get<Task>(`/tasks/${id}`).then((r) => r.data),

  create: (payload: CreateTaskPayload) => apiClient.post<Task>('/tasks', payload).then((r) => r.data),

  update: (id: string, payload: UpdateTaskPayload) =>
    apiClient.patch<Task>(`/tasks/${id}`, payload).then((r) => r.data),

  complete: (id: string) => apiClient.patch<Task>(`/tasks/${id}/complete`).then((r) => r.data),

  remove: (id: string) => apiClient.delete<void>(`/tasks/${id}`).then((r) => r.data),
}

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
import { tasksApi, type CreateTaskPayload, type TaskQuery, type UpdateTaskPayload } from '@/api/tasks.api'
import { extractErrorMessage } from '@/lib/api-client'
import { REFRESH_INTERVAL_MS } from '@/lib/constants'
import { queryKeys } from './query-keys'

export function useMyTasks(query: TaskQuery = {}) {
  return useQuery({
    queryKey: queryKeys.tasks.mine(query),
    queryFn: () => tasksApi.list(query),
    refetchInterval: REFRESH_INTERVAL_MS,
  })
}

export function useCreateTask() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (payload: CreateTaskPayload) => tasksApi.create(payload),
    onSuccess: () => {
      toast.success('Task added')
      qc.invalidateQueries({ queryKey: ['tasks'] })
    },
    onError: (error) => toast.error('Could not add task', { description: extractErrorMessage(error) }),
  })
}

export function useUpdateTask() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ id, payload }: { id: string; payload: UpdateTaskPayload }) => tasksApi.update(id, payload),
    onSuccess: () => {
      toast.success('Task updated')
      qc.invalidateQueries({ queryKey: ['tasks'] })
    },
    onError: (error) => toast.error('Could not update task', { description: extractErrorMessage(error) }),
  })
}

export function useCompleteTask() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (id: string) => tasksApi.complete(id),
    onSuccess: () => {
      toast.success('Task completed')
      qc.invalidateQueries({ queryKey: ['tasks'] })
    },
    onError: (error) => toast.error('Could not complete task', { description: extractErrorMessage(error) }),
  })
}

export function useDeleteTask() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (id: string) => tasksApi.remove(id),
    onSuccess: () => {
      toast.success('Task deleted')
      qc.invalidateQueries({ queryKey: ['tasks'] })
    },
    onError: (error) => toast.error('Could not delete task', { description: extractErrorMessage(error) }),
  })
}

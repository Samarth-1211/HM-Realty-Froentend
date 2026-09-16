import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
import {
  projectsApi,
  type CreateProjectPayload,
  type UpdateProjectPayload,
} from '@/api/projects.api'
import { extractErrorMessage } from '@/lib/api-client'
import { REFRESH_INTERVAL_MS } from '@/lib/constants'
import { queryKeys } from './query-keys'

export function useProjects(enabled = true) {
  return useQuery({
    queryKey: queryKeys.projects.all,
    queryFn: projectsApi.list,
    refetchInterval: REFRESH_INTERVAL_MS,
    enabled,
  })
}

export function useProject(id: string | undefined) {
  return useQuery({
    queryKey: queryKeys.projects.detail(id ?? ''),
    queryFn: () => projectsApi.get(id!),
    enabled: !!id,
  })
}

export function useProjectManagers(id: string | undefined) {
  return useQuery({
    queryKey: queryKeys.projects.managers(id ?? ''),
    queryFn: () => projectsApi.listManagers(id!),
    enabled: !!id,
  })
}

export function useCreateProject() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (payload: CreateProjectPayload) => projectsApi.create(payload),
    onSuccess: () => {
      toast.success('Project created')
      qc.invalidateQueries({ queryKey: queryKeys.projects.all })
    },
    onError: (error) => toast.error('Could not create project', { description: extractErrorMessage(error) }),
  })
}

export function useUpdateProject() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ id, payload }: { id: string; payload: UpdateProjectPayload }) =>
      projectsApi.update(id, payload),
    onSuccess: (_d, vars) => {
      toast.success('Project updated')
      qc.invalidateQueries({ queryKey: queryKeys.projects.all })
      qc.invalidateQueries({ queryKey: queryKeys.projects.detail(vars.id) })
    },
    onError: (error) => toast.error('Could not update project', { description: extractErrorMessage(error) }),
  })
}

export function useDeleteProject() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (id: string) => projectsApi.remove(id),
    onSuccess: () => {
      toast.success('Project deleted')
      qc.invalidateQueries({ queryKey: queryKeys.projects.all })
    },
    onError: (error) => toast.error('Could not delete project', { description: extractErrorMessage(error) }),
  })
}

export function useAssignProjectManager() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ id, managerId }: { id: string; managerId: string }) =>
      projectsApi.assignManager(id, managerId),
    onSuccess: (_d, vars) => {
      toast.success('Manager assigned to project')
      qc.invalidateQueries({ queryKey: queryKeys.projects.managers(vars.id) })
    },
    onError: (error) => toast.error('Could not assign manager', { description: extractErrorMessage(error) }),
  })
}

export function useUnassignProjectManager() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ id, managerId }: { id: string; managerId: string }) =>
      projectsApi.unassignManager(id, managerId),
    onSuccess: (_d, vars) => {
      toast.success('Manager removed from project')
      qc.invalidateQueries({ queryKey: queryKeys.projects.managers(vars.id) })
    },
    onError: (error) => toast.error('Could not remove manager', { description: extractErrorMessage(error) }),
  })
}

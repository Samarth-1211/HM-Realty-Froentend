import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
import { leadAllocationApi, type LeadAllocationMode } from '@/api/lead-allocation.api'
import { extractErrorMessage } from '@/lib/api-client'
import { queryKeys } from './query-keys'

export function useLeadAllocationSettings() {
  return useQuery({
    queryKey: queryKeys.leadAllocation.settings,
    queryFn: () => leadAllocationApi.getSettings(),
  })
}

export function useUpdateAutoAllocation() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (enabled: boolean) => leadAllocationApi.updateAutoAllocation(enabled),
    onSuccess: (data) => {
      toast.success(data.autoAllocationEnabled ? 'AutoPilot enabled' : 'AutoPilot disabled')
      qc.invalidateQueries({ queryKey: queryKeys.leadAllocation.settings })
    },
    onError: (error) =>
      toast.error('Could not update AutoPilot', { description: extractErrorMessage(error) }),
  })
}

export function useUpdateLeadAllocationMode() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (mode: LeadAllocationMode) => leadAllocationApi.updateMode(mode),
    onSuccess: (data) => {
      toast.success(data.mode === 'PROJECT_WISE' ? 'Project-wise routing enabled' : 'Project-wise routing disabled')
      qc.invalidateQueries({ queryKey: queryKeys.leadAllocation.settings })
    },
    onError: (error) =>
      toast.error('Could not update project-wise routing', { description: extractErrorMessage(error) }),
  })
}

export function useUpdatePlatformProjectRouting() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (enabled: boolean) => leadAllocationApi.updatePlatformProjectRouting(enabled),
    onSuccess: (data) => {
      toast.success(
        data.projectWisePlatformLeads
          ? 'Project-wise routing enabled for platform leads'
          : 'Project-wise routing disabled for platform leads',
      )
      qc.invalidateQueries({ queryKey: queryKeys.leadAllocation.settings })
    },
    onError: (error) =>
      toast.error('Could not update project-wise routing for platform leads', { description: extractErrorMessage(error) }),
  })
}

export function useUpdateLostLeadReallocation() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (enabled: boolean) => leadAllocationApi.updateLostLeadReallocation(enabled),
    onSuccess: (data) => {
      toast.success(data.autoReallocateLostLeads ? 'Auto-shuffle & allocation enabled' : 'Switched to manual shuffle')
      qc.invalidateQueries({ queryKey: queryKeys.leadAllocation.settings })
    },
    onError: (error) =>
      toast.error('Could not update lost-lead reallocation mode', { description: extractErrorMessage(error) }),
  })
}

export function useShuffleLostLeads() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (leadIds?: string[]) => leadAllocationApi.shuffleLostLeads(leadIds),
    onSuccess: (data) => {
      toast.success(`Shuffled ${data.reassigned} of ${data.attempted} lost lead(s)`)
      qc.invalidateQueries({ queryKey: ['leads'] })
    },
    onError: (error) => toast.error('Could not shuffle lost leads', { description: extractErrorMessage(error) }),
  })
}

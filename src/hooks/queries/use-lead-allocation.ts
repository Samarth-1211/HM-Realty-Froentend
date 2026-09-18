import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
import { leadAllocationApi } from '@/api/lead-allocation.api'
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

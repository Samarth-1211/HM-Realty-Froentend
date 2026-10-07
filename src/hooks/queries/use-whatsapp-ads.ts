import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
import { whatsappAdsApi } from '@/api/whatsapp-ads.api'
import { extractErrorMessage } from '@/lib/api-client'
import { REFRESH_INTERVAL_MS } from '@/lib/constants'
import { queryKeys } from './query-keys'

const plural = (count: number, noun: string) => `${count} ${noun}${count === 1 ? '' : 's'}`

export function useWhatsAppAds() {
  return useQuery({
    queryKey: queryKeys.whatsappAds.all,
    queryFn: whatsappAdsApi.list,
    refetchInterval: REFRESH_INTERVAL_MS,
  })
}

export function useMapWhatsAppAd() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ id, projectId }: { id: string; projectId: string | null }) => whatsappAdsApi.map(id, projectId),
    onSuccess: (result) => {
      if (!result.project) {
        toast.success('Ad unlinked')
      } else {
        const handedOut = result.assignedLeads > 0 ? ` — ${plural(result.assignedLeads, 'waiting lead')} assigned` : ''
        toast.success(`Ad linked to ${result.project.name}${handedOut}`)
        if (result.projectManagerCount === 0) {
          toast.warning(`${result.project.name} has no managers yet`, {
            description: 'Its leads go to the general manager rotation until you assign managers to the project.',
          })
        } else if (result.unassignedLeads > 0) {
          toast.warning(`${plural(result.unassignedLeads, 'lead')} still unassigned`, {
            description: 'No manager on the project is available right now — assign them from the Leads page.',
          })
        }
      }
      qc.invalidateQueries({ queryKey: queryKeys.whatsappAds.all })
      qc.invalidateQueries({ queryKey: ['leads'] })
    },
    onError: (error) => toast.error('Could not update the ad', { description: extractErrorMessage(error) }),
  })
}

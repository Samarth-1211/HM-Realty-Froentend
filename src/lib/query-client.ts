import { QueryClient } from '@tanstack/react-query'
import { MUTATION_RETRY_COUNT, QUERY_RETRY_COUNT, QUERY_STALE_TIME_MS } from '@/lib/constants'

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: QUERY_RETRY_COUNT,
      staleTime: QUERY_STALE_TIME_MS,
      refetchOnWindowFocus: true,
    },
    mutations: {
      retry: MUTATION_RETRY_COUNT,
    },
  },
})

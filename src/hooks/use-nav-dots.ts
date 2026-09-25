import { useUnseenLeadsCount } from '@/hooks/queries/use-leads'

/**
 * Which nav items have something new waiting — shown as a dot on the item in
 * the sidebar, mobile bottom bar and drawer. Today that's Leads, lit while
 * leads have come in since the user last opened the Leads list.
 */
export function useNavDots(): (to: string) => boolean {
  const { data: unseenLeads } = useUnseenLeadsCount()
  return (to) => to === '/leads' && !!unseenLeads
}

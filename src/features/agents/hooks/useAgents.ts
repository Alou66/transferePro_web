import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { agentService } from '../services/agentService'
import { UserStatus } from '../../../types/index'

export const agentKeys = {
  all: ['agents'] as const,
  list: () => [...agentKeys.all, 'list'] as const,
  detail: (id: string) => [...agentKeys.all, 'detail', id] as const,
  pending: () => [...agentKeys.all, 'pending'] as const,
  statistics: (id: string) => [...agentKeys.all, 'statistics', id] as const,
}

// Les statistiques financières bougent à chaque transfert/encaissement :
// staleTime plus court que le défaut global pour rester fiable après une
// action (paiement, récupération de fonds) sans pour autant re-fetcher à
// chaque re-render.
const AGENT_STATISTICS_STALE_TIME = 30_000

export function useAgents() {
  return useQuery({
    queryKey: agentKeys.list(),
    queryFn: agentService.getAll,
  })
}

export function useAgent(id: string | undefined) {
  return useQuery({
    queryKey: agentKeys.detail(id ?? ''),
    queryFn: () => agentService.getById(id as string),
    enabled: Boolean(id),
  })
}

export function useAgentStatistics(agentId: string | undefined) {
  return useQuery({
    queryKey: agentKeys.statistics(agentId ?? ''),
    queryFn: () => agentService.getStatistics(agentId as string),
    enabled: Boolean(agentId),
    staleTime: AGENT_STATISTICS_STALE_TIME,
  })
}

export function usePendingAgents() {
  return useQuery({
    queryKey: agentKeys.pending(),
    queryFn: agentService.getPendingAgents,
  })
}

export function useUpdateAgentStatus() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ id, status }: { id: string; status: UserStatus }) => agentService.updateStatus(id, status),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: agentKeys.all })
    },
  })
}

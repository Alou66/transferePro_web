import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { getByAgentId, create } from '../services/cashCollectionService'
import type { CashCollectionCreateInput } from '../services/cashCollectionService'
import { agentKeys } from '../../agents/hooks/useAgents'

export const cashCollectionKeys = {
  all: ['cashCollections'] as const,
  byAgent: (agentId: string) => [...cashCollectionKeys.all, agentId] as const,
}

export function useCashCollections(agentId: string | undefined) {
  return useQuery({
    queryKey: cashCollectionKeys.byAgent(agentId ?? ''),
    queryFn: () => getByAgentId(agentId as string),
    enabled: Boolean(agentId),
  })
}

export function useCreateCashCollection() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (input: CashCollectionCreateInput) => create(input),
    onSuccess: (_collection, input) => {
      queryClient.invalidateQueries({ queryKey: cashCollectionKeys.byAgent(input.agentId) })
      // Une récupération de fonds clôture la période de calcul du solde agent.
      queryClient.invalidateQueries({ queryKey: agentKeys.statistics(input.agentId) })
    },
  })
}

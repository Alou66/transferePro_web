import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { agentService } from '../services/agentService'
import type { Agent, CreateAgentInput } from '../../../types/index'
import { UserStatus } from '../../../types/index'

export const agentKeys = {
  all: ['agents'] as const,
  list: () => [...agentKeys.all, 'list'] as const,
  detail: (id: string) => [...agentKeys.all, 'detail', id] as const,
  pending: () => [...agentKeys.all, 'pending'] as const,
}

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

export function usePendingAgents() {
  return useQuery({
    queryKey: agentKeys.pending(),
    queryFn: agentService.getPendingAgents,
  })
}

export function useCreateAgent() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (input: CreateAgentInput) => agentService.create(input),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: agentKeys.all })
    },
  })
}

export function useUpdateAgent() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: Partial<Agent> }) => agentService.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: agentKeys.all })
    },
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

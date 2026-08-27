import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { transferService } from '../services/transferService'
import type { CreateTransferInput, TransferStatus } from '../../../types/index'
import { agentKeys } from '../../agents/hooks/useAgents'

// Les transferts changent en permanence (création, paiement, annulation) :
// staleTime nettement plus court que le défaut global (villes, agents) pour
// éviter d'afficher un statut périmé après une action.
const TRANSFERS_STALE_TIME = 15_000

export const transferKeys = {
  all: ['transfers'] as const,
  list: (page: number, limit: number) => [...transferKeys.all, 'list', page, limit] as const,
  allExhaustive: () => [...transferKeys.all, 'all-exhaustive'] as const,
  myAll: () => [...transferKeys.all, 'my-all'] as const,
  incoming: (page: number, limit: number, statuses?: TransferStatus[]) =>
    [...transferKeys.all, 'incoming', page, limit, statuses ?? []] as const,
  detail: (id: string) => [...transferKeys.all, 'detail', id] as const,
  withdrawalCode: (id: string) => [...transferKeys.all, 'withdrawal-code', id] as const,
}

export function useTransfers(page = 1, limit = 20) {
  return useQuery({
    queryKey: transferKeys.list(page, limit),
    queryFn: () => transferService.getAll(page, limit),
    staleTime: TRANSFERS_STALE_TIME,
  })
}

export function useAllTransfersExhaustive() {
  return useQuery({
    queryKey: transferKeys.allExhaustive(),
    queryFn: transferService.getAllExhaustive,
    staleTime: TRANSFERS_STALE_TIME,
  })
}

export function useMyTransfers() {
  return useQuery({
    queryKey: transferKeys.myAll(),
    queryFn: transferService.getAllForAgent,
    staleTime: TRANSFERS_STALE_TIME,
  })
}

export function useIncomingTransfers(page = 1, limit = 20, statuses?: TransferStatus[]) {
  return useQuery({
    queryKey: transferKeys.incoming(page, limit, statuses),
    queryFn: () => transferService.getIncomingForAgent(page, limit, statuses),
    staleTime: TRANSFERS_STALE_TIME,
  })
}

export function useTransfer(id: string | undefined) {
  return useQuery({
    queryKey: transferKeys.detail(id ?? ''),
    queryFn: () => transferService.getById(id as string),
    enabled: Boolean(id),
    staleTime: TRANSFERS_STALE_TIME,
  })
}

export function useWithdrawalCode(id: string | undefined) {
  return useQuery({
    queryKey: transferKeys.withdrawalCode(id ?? ''),
    queryFn: () => transferService.getWithdrawalCode(id as string),
    enabled: Boolean(id),
    staleTime: TRANSFERS_STALE_TIME,
  })
}

// Toute mutation change potentiellement un statut, un solde agent ou une
// liste affichée ailleurs : on invalide largement (['transfers']) plutôt que
// de maintenir une liste de clés précises à jour à chaque nouvel écran. Les
// statistiques agent (soldes) dépendent aussi des transferts, donc on les
// invalide dans la foulée.
function useInvalidateTransfers() {
  const queryClient = useQueryClient()
  return () => {
    queryClient.invalidateQueries({ queryKey: transferKeys.all })
    queryClient.invalidateQueries({ queryKey: agentKeys.all })
  }
}

export function useCreateTransfer() {
  const queryClient = useQueryClient()
  const invalidate = useInvalidateTransfers()
  return useMutation({
    mutationFn: (input: CreateTransferInput) => transferService.create(input),
    onSuccess: (transfer) => {
      invalidate()
      // Évite un GET immédiat sur TransferCreatedPage : la réponse de
      // création contient déjà le transfert complet (dont le code de retrait).
      // Doit rester après invalidate() : sinon la sweep d'invalidation
      // marquerait aussi cette entrée comme périmée.
      queryClient.setQueryData(transferKeys.detail(transfer.id), transfer)
    },
  })
}

export function useCancelTransfer() {
  const invalidate = useInvalidateTransfers()
  return useMutation({
    mutationFn: (id: string) => transferService.cancel(id),
    onSuccess: () => invalidate(),
  })
}

export function useAdminCancelTransfer() {
  const invalidate = useInvalidateTransfers()
  return useMutation({
    mutationFn: (id: string) => transferService.adminCancel(id),
    onSuccess: () => invalidate(),
  })
}

export function useMarkTransferAsPaid() {
  const queryClient = useQueryClient()
  const invalidate = useInvalidateTransfers()
  return useMutation({
    mutationFn: (id: string) => transferService.markAsPaid(id),
    onSuccess: (transfer) => {
      invalidate()
      // Évite un GET immédiat sur PaymentSuccessPage.
      queryClient.setQueryData(transferKeys.detail(transfer.id), transfer)
    },
  })
}

export function useVerifyWithdrawalCode() {
  const invalidate = useInvalidateTransfers()
  return useMutation({
    mutationFn: ({ id, code }: { id: string; code: string }) => transferService.verifyWithdrawalCode(id, code),
    onSuccess: () => invalidate(),
  })
}

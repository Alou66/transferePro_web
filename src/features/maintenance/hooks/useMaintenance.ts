import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import {
  DATA_RESET_CONFIRMATION_WORD,
  maintenanceService,
  type DataResetResult,
} from '../services/maintenanceService'
import { transferKeys } from '../../transfers/hooks/useTransfers'
import { agentKeys } from '../../agents/hooks/useAgents'
import { cashCollectionKeys } from '../../transfers/hooks/useCashCollections'

export const maintenanceKeys = {
  all: ['maintenance'] as const,
  dataResetAvailability: () => [...maintenanceKeys.all, 'data-reset-availability'] as const,
}

/**
 * Indique au frontend si la réinitialisation est autorisée sur cet
 * environnement. Ce n'est qu'un affichage : le backend applique son propre
 * contrôle via la variable ENABLE_DATA_RESET.
 */
export function useDataResetAvailability() {
  return useQuery({
    queryKey: maintenanceKeys.dataResetAvailability(),
    queryFn: maintenanceService.isDataResetAvailable,
    // L'autorisation dépend du redémarrage du conteneur backend : on évite
    // de re-demander à chaque navigation dans la section maintenance.
    staleTime: 60_000,
    retry: false,
  })
}

/**
 * Réinitialisation des données transactionnelles et des comptes agents.
 *
 * useMutation garantit qu'une seule requête est en vol à la fois pour un même
 * hook : le bouton reste désactivé pendant toute l'opération, ce qui empêche
 * les doubles soumissions.
 */
export function useResetTransactionalData() {
  const queryClient = useQueryClient()

  return useMutation<DataResetResult, Error, string>({
    mutationFn: (confirmation: string) => maintenanceService.resetTransactionalData(confirmation),
    onSuccess: () => {
      // Transferts, encaissements et comptes agents ont disparu : tout le
      // cache lié est devenu faux. Les villes sont conservées, leur cache
      // reste donc valide.
      queryClient.invalidateQueries({ queryKey: transferKeys.all })
      queryClient.invalidateQueries({ queryKey: agentKeys.all })
      queryClient.invalidateQueries({ queryKey: cashCollectionKeys.all })
    },
  })
}

export { DATA_RESET_CONFIRMATION_WORD }
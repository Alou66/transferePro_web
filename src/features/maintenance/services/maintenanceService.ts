import { api } from '../../../services/api'

/**
 * Opérations de maintenance réservées aux administrateurs.
 *
 * Précaution : ce service ne constitue en aucun cas une barrière de sécurité.
 * Le backend applique ses propres contrôles (authentification, rôle ADMIN,
 * double confirmation, variable ENABLE_DATA_RESET). Masquer le bouton dans
 * l'interface est un confort d'affichage, pas une protection.
 */
export const DATA_RESET_CONFIRMATION_WORD = 'RESET'

export interface DataResetAvailability {
  enabled: boolean
}

export interface DataResetResult {
  cashCollections: number
  transfers: number
  agents: number
}

export async function isDataResetAvailable(): Promise<DataResetAvailability> {
  return api.get<DataResetAvailability>('/admin/maintenance/reset-data/available')
}

export async function resetTransactionalData(confirmation: string): Promise<DataResetResult> {
  // Contrôle de confort, répété côté serveur : le backend refuse toute valeur
  // autre que la chaîne exacte « RESET ».
  if (confirmation !== DATA_RESET_CONFIRMATION_WORD) {
    throw new Error('Vous devez saisir exactement RESET pour confirmer la réinitialisation.')
  }

  return api.post<DataResetResult>('/admin/maintenance/reset-data', { confirmation })
}

export const maintenanceService = {
  isDataResetAvailable,
  resetTransactionalData,
}
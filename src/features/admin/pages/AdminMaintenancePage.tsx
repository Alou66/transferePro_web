import { useState } from 'react'
import {
  DATA_RESET_CONFIRMATION_WORD,
  useDataResetAvailability,
  useResetTransactionalData,
} from '../../maintenance/hooks/useMaintenance'
import type { DataResetResult } from '../../maintenance/services/maintenanceService'
import './AdminMaintenancePage.css'

export default function AdminMaintenancePage() {
  const {
    data: availability,
    isLoading: availabilityLoading,
    error: availabilityError,
    refetch,
  } = useDataResetAvailability()
  const resetData = useResetTransactionalData()

  const [showConfirmModal, setShowConfirmModal] = useState(false)
  const [confirmation, setConfirmation] = useState('')
  const [result, setResult] = useState<DataResetResult | null>(null)

  const isEnabled = availability?.enabled === true
  const isResetting = resetData.isPending
  // Comparaison stricte, en accord avec le contrôle du backend : « reset » ou
  // « RESET » suivi d'un espace ne débloquent pas le bouton.
  const confirmationMatches = confirmation === DATA_RESET_CONFIRMATION_WORD

  const openConfirmModal = () => {
    setResult(null)
    setConfirmation('')
    resetData.reset()
    setShowConfirmModal(true)
  }

  const closeConfirmModal = () => {
    // La modale ne comporte ni croix ni fermeture par l'arrière-plan : la
    // seule issue pendant l'opération est le bouton « Annuler », désactivé
    // ci-dessous pour ne pas interrompre une réinitialisation en cours.
    setShowConfirmModal(false)
    setConfirmation('')
    resetData.reset()
  }

  const handleReset = async () => {
    if (!confirmationMatches || isResetting) {
      return
    }

    try {
      const resetResult = await resetData.mutateAsync(confirmation)
      setResult(resetResult)
      setShowConfirmModal(false)
      setConfirmation('')
    } catch {
      // L'erreur est exposée par le backend dans le message de la réponse :
      // elle est affichée dans la modale via resetData.error.
    }
  }

  return (
    <div className="admin-maintenance-page">
      <div className="admin-maintenance-header">
        <div>
          <h1>Maintenance</h1>
          <p className="admin-maintenance-subtitle">
            Opérations d&apos;administration sur les données de la plateforme
          </p>
        </div>
      </div>

      <section className="admin-maintenance-section">
        <h2>Réinitialisation des données</h2>

        {availabilityLoading && (
          <div className="admin-maintenance-loading">
            <div className="admin-loading-spinner" />
            <p>Chargement de la configuration...</p>
          </div>
        )}

        {availabilityError && !availabilityLoading && (
          <div className="admin-maintenance-error">
            <p>Impossible de vérifier si la réinitialisation est disponible.</p>
            <button onClick={() => refetch()} className="btn btn-secondary">
              Réessayer
            </button>
          </div>
        )}

        {!availabilityLoading && !availabilityError && !isEnabled && (
          <div className="admin-maintenance-notice">
            <p>
              La réinitialisation des données est désactivée sur cet environnement.
              Elle est réservée au remise à zéro des données de test, avant le démarrage
              réel de la plateforme.
            </p>
          </div>
        )}

        {!availabilityLoading && !availabilityError && isEnabled && (
          <>
            <div className="admin-danger-zone">
              <div className="admin-danger-zone-header">
                <span className="admin-danger-zone-badge">Opération irréversible</span>
                <h3>Réinitialiser les données</h3>
              </div>

              <p>
                Supprime définitivement les transferts, les encaissements et
                l&apos;ensemble des comptes agents.
              </p>
              <p>
                Les villes et votre compte administrateur sont conservés : vous
                pourrez continuer à vous connecter et à valider de nouveaux agents
                juste après l&apos;opération.
              </p>

              <ul className="admin-danger-zone-list">
                <li>Transferts, bénéficiaires et paiements associés : supprimés</li>
                <li>Encaissements d&apos;espèces : supprimés</li>
                <li>Comptes agents (tous les agents) : supprimés</li>
                <li>Villes et compte administrateur : conservés</li>
              </ul>

              <button
                onClick={openConfirmModal}
                className="btn btn-danger"
                disabled={isResetting}
              >
                Réinitialiser les données
              </button>
            </div>

            {result && (
              <div className="admin-maintenance-success">
                <p>Les données transactionnelles ont été réinitialisées.</p>
                <ul>
                  <li>{result.transfers} transfert(s) supprimé(s)</li>
                  <li>{result.cashCollections} encaissement(s) supprimé(s)</li>
                  <li>{result.agents} compte(s) agent supprimé(s)</li>
                </ul>
              </div>
            )}
          </>
        )}
      </section>

      {showConfirmModal && (
        <div className="admin-modal-overlay">
          <div className="admin-modal">
            <h2>Réinitialiser les données ?</h2>

            {isResetting ? (
              <div className="admin-modal-progress">
                <div className="admin-loading-spinner" />
                <p>Réinitialisation en cours...</p>
                <p className="admin-modal-hint">
                  Ne fermez pas cette page. L&apos;opération est irréversible.
                </p>
              </div>
            ) : (
              <>
                <p>
                  Cette opération supprimera définitivement les transferts, les
                  encaissements et tous les comptes agents.
                </p>
                <p>
                  Les villes et votre compte administrateur seront conservés.
                </p>
                <p className="admin-modal-warning">Cette opération est irréversible.</p>

                <div className="form-group">
                  <label htmlFor="reset-confirmation">
                    Pour confirmer, saisez&nbsp;: <strong>{DATA_RESET_CONFIRMATION_WORD}</strong>
                  </label>
                  <input
                    id="reset-confirmation"
                    type="text"
                    className="form-input"
                    value={confirmation}
                    onChange={(e) => setConfirmation(e.target.value)}
                    placeholder={DATA_RESET_CONFIRMATION_WORD}
                    autoComplete="off"
                    autoFocus
                    disabled={isResetting}
                  />
                </div>

                {resetData.error && (
                  <div className="admin-modal-error">{resetData.error.message}</div>
                )}

                <div className="admin-modal-actions">
                  <button
                    onClick={closeConfirmModal}
                    className="btn btn-secondary"
                    disabled={isResetting}
                  >
                    Annuler
                  </button>
                  <button
                    onClick={handleReset}
                    className="btn btn-danger"
                    disabled={!confirmationMatches || isResetting}
                  >
                    {isResetting ? 'Réinitialisation...' : 'Réinitialiser'}
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
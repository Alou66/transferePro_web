import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../../auth/hooks/useAuth'
import { useCreateTransfer } from '../hooks/useTransfers'
import { useActiveCities } from '../../cities/hooks/useCities'
import TransferForm from '../components/TransferForm'
import './CreateTransferPage.css'

export default function CreateTransferPage() {
  const navigate = useNavigate()
  const { user } = useAuth()

  const [error, setError] = useState<string | null>(null)
  const [showCancelConfirm, setShowCancelConfirm] = useState(false)

  const { data: cities = [], isLoading: citiesLoading, isError: citiesFailed } = useActiveCities()
  const createTransfer = useCreateTransfer()
  const loading = createTransfer.isPending

  const handleSubmit = async (values: {
    senderName: string
    senderPhone: string
    recipientName: string
    recipientPhone: string
    destinationCityId: string
    amount: number
  }) => {
    if (!user) {
      return
    }

    try {
      const transfer = await createTransfer.mutateAsync(values)
      navigate(`/agent/transfers/${transfer.id}/success`)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Une erreur est survenue lors de la création du transfert.')
    }
  }

  const handleCancel = () => {
    setShowCancelConfirm(true)
  }

  const confirmCancel = () => {
    setShowCancelConfirm(false)
    navigate('/agent')
  }

  return (
    <div className="create-transfer-page">
      <div className="create-transfer-card">
        <h1>Nouveau transfert</h1>
        <p className="create-transfer-subtitle">Enregistrez les informations du transfert.</p>

        <TransferForm
          originCityName={user?.city ?? ''}
          cities={cities}
          citiesLoading={citiesLoading}
          error={citiesFailed ? 'Impossible de charger les villes.' : error}
          successMessage={null}
          onSubmit={handleSubmit}
          onCancel={handleCancel}
          submitLabel="Créer le transfert"
          loadingLabel="Création en cours..."
          loading={loading}
        />
      </div>

      {showCancelConfirm && (
        <div className="cancel-modal-overlay">
          <div className="cancel-modal">
            <h2>Confirmer l'annulation</h2>
            <p>Voulez-vous vraiment annuler la création de ce transfert ? Aucune donnée ne sera enregistrée.</p>
            <div className="cancel-modal-actions">
              <button onClick={() => setShowCancelConfirm(false)} className="cancel-modal-button secondary">
                Continuer la saisie
              </button>
              <button onClick={confirmCancel} className="cancel-modal-button danger">
                Annuler le transfert
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

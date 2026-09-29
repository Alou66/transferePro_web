import { useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { useAuth } from '../../auth/hooks/useAuth'
import { useTransfer, useUpdateTransfer } from '../hooks/useTransfers'
import { useActiveCities } from '../../cities/hooks/useCities'
import TransferForm from '../components/TransferForm'
import { TransferStatus } from '../../../types/index'
import PageLoader from '../../../shared/components/PageLoader'
import './CreateTransferPage.css'

export default function EditTransferPage() {
  const { transferId } = useParams<{ transferId: string }>()
  const navigate = useNavigate()
  const { user } = useAuth()

  const { data: transfer, isLoading, isError } = useTransfer(transferId)
  const { data: cities = [], isLoading: citiesLoading, isError: citiesFailed } = useActiveCities()
  const updateTransfer = useUpdateTransfer()

  const [error, setError] = useState<string | null>(null)
  const [successMessage, setSuccessMessage] = useState<string | null>(null)

  if (isLoading || citiesLoading) {
    return <PageLoader />
  }

  if (isError || !transfer || !transferId) {
    return (
      <div className="create-transfer-page">
        <div className="create-transfer-card">
          <h1>Modifier le transfert</h1>
          <p className="create-transfer-subtitle">{error ?? 'Transfert introuvable.'}</p>
        </div>
      </div>
    )
  }

  if (transfer.originAgentId !== user?.id) {
    return (
      <div className="create-transfer-page">
        <div className="create-transfer-card">
          <h1>Modifier le transfert</h1>
          <p className="create-transfer-subtitle">Vous n'êtes pas autorisé à modifier ce transfert.</p>
        </div>
      </div>
    )
  }

  // Garde d'affichage, alignée sur la règle métier du backend : seul un
  // transfert payé est refusé. Le backend reste l'autorité : si le transfert
  // est payé entre l'affichage et la soumission, il répond 409 et le message
  // métier est affiché.
  if (transfer.status === TransferStatus.PAID) {
    return (
      <div className="create-transfer-page">
        <div className="create-transfer-card">
          <h1>Modifier le transfert</h1>
          <p className="create-transfer-subtitle">
            Ce transfert a déjà été payé, il ne peut plus être modifié.
          </p>
        </div>
      </div>
    )
  }

  if (transfer.status === TransferStatus.CANCELLED) {
    return (
      <div className="create-transfer-page">
        <div className="create-transfer-card">
          <h1>Modifier le transfert</h1>
          <p className="create-transfer-subtitle">Un transfert annulé ne peut pas être modifié.</p>
        </div>
      </div>
    )
  }

  const handleSubmit = async (values: {
    senderName: string
    senderPhone: string
    recipientName: string
    recipientPhone: string
    destinationCityId: string
    amount: number
  }) => {
    setError(null)
    setSuccessMessage(null)

    try {
      const updated = await updateTransfer.mutateAsync({ id: transfer.id, input: values })
      setSuccessMessage(`Transfert ${updated.reference} modifié avec succès.`)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Une erreur est survenue lors de la modification du transfert.')
    }
  }

  return (
    <div className="create-transfer-page">
      <div className="create-transfer-card">
        <h1>Modifier le transfert</h1>
        <p className="create-transfer-subtitle">
          Référence {transfer.reference}. Les modifications ne sont possibles que tant que le transfert n'est pas payé.
        </p>

        <TransferForm
          initialValues={{
            senderName: transfer.senderName,
            senderPhone: transfer.senderPhone,
            recipientName: transfer.recipientName,
            recipientPhone: transfer.recipientPhone,
            destinationCityId: transfer.destinationCity.id,
            amount: transfer.amount,
          }}
          originCityName={transfer.originCity?.name ?? ''}
          cities={cities}
          citiesLoading={citiesLoading}
          error={citiesFailed ? 'Impossible de charger les villes.' : error}
          successMessage={successMessage}
          onSubmit={handleSubmit}
          onCancel={() => navigate(`/agent/transfers/${transfer.id}`, { state: { from: '/agent/transfers/history' } })}
          submitLabel="Enregistrer les modifications"
          loadingLabel="Modification en cours..."
          loading={updateTransfer.isPending}
        />
      </div>
    </div>
  )
}

import { useState, useMemo } from 'react'
import { useParams, NavLink } from 'react-router-dom'
import { useTransfer, useAdminCancelTransfer } from '../../transfers/hooks/useTransfers'
import { useAgent } from '../../agents/hooks/useAgents'
import { TransferStatus } from '../../../types/index'
import TransferStatusBadge from '../../transfers/components/TransferStatusBadge'
import { formatCurrency } from '../../../shared/utils/formatCurrency'
import { formatDate } from '../../../shared/utils/formatDate'
import BackButton from '../../../components/common/BackButton'
import './AdminTransferDetailsPage.css'

export default function AdminTransferDetailsPage() {
  const { transferId } = useParams<{ transferId: string }>()
  const { data: transfer, isLoading: transferLoading, isError: transferFailed } = useTransfer(transferId)
  const { data: originAgent, isLoading: originLoading } = useAgent(transfer?.originAgentId)
  const { data: destinationAgent, isLoading: destinationLoading } = useAgent(transfer?.destinationAgentId)
  const adminCancelTransfer = useAdminCancelTransfer()
  const [showCancelModal, setShowCancelModal] = useState(false)
  const [cancelError, setCancelError] = useState<string | null>(null)

  const loading = transferLoading || (Boolean(transfer) && (originLoading || destinationLoading))
  const error = !transferId || transferFailed ? 'Transfert introuvable.' : null
  const cancelling = adminCancelTransfer.isPending

  const lifecycleSteps = useMemo(() => {
    if (!transfer) return []

    const steps = [
      { status: TransferStatus.CREATED, label: 'Créé' },
      { status: TransferStatus.READY_FOR_PAYMENT, label: 'Prêt au paiement' },
      { status: TransferStatus.PAID, label: 'Payé' },
    ]

    if (transfer.status === TransferStatus.CANCELLED) {
      return [{ status: TransferStatus.CANCELLED, label: 'Annulé' }]
    }

    return steps
  }, [transfer])

  const getCurrentStepIndex = (): number => {
    if (!transfer) return -1
    if (transfer.status === TransferStatus.CANCELLED) return 0
    if (transfer.status === TransferStatus.PAID) return 2
    if (transfer.status === TransferStatus.READY_FOR_PAYMENT) return 1
    return 0
  }

  const canCancel = transfer?.status === TransferStatus.CREATED

  const handleCancel = async () => {
    if (!transfer) return

    setCancelError(null)

    try {
      await adminCancelTransfer.mutateAsync(transfer.id)
      setShowCancelModal(false)
    } catch (err) {
      setCancelError(err instanceof Error ? err.message : 'Une erreur est survenue lors de l\'annulation.')
    }
  }

  if (loading) {
    return (
      <div className="admin-transfer-details-page">
        <div className="admin-transfer-details-loading">
          <div className="admin-loading-spinner" />
          <p>Chargement du transfert...</p>
        </div>
      </div>
    )
  }

  if (error || !transfer) {
    return (
      <div className="admin-transfer-details-page">
        <div className="admin-transfer-details-error">
          <p>{error || 'Transfert introuvable.'}</p>
          <NavLink to="/admin/transfers" className="admin-transfer-details-link">
            Retour à la liste
          </NavLink>
        </div>
      </div>
    )
  }

  const currentStepIndex = getCurrentStepIndex()

  return (
    <div className="admin-transfer-details-page">
      <BackButton to="/admin/transfers" />
      <div className="admin-transfer-details-card">
        <div className="admin-transfer-details-header">
          <div>
            <h1>Détails du transfert</h1>
            <span className="admin-transfer-details-reference">{transfer.reference}</span>
          </div>
          <TransferStatusBadge status={transfer.status} />
        </div>

        <div className="admin-transfer-details-section">
          <h2>Informations du transfert</h2>
          <div className="admin-transfer-details-grid">
            <div>
              <span className="admin-transfer-details-label">Statut</span>
              <p className="admin-transfer-details-value">
                <TransferStatusBadge status={transfer.status} />
              </p>
            </div>
            <div>
              <span className="admin-transfer-details-label">Date de création</span>
              <p className="admin-transfer-details-value">{formatDate(transfer.createdAt)}</p>
            </div>
            {transfer.paidAt && (
              <div>
                <span className="admin-transfer-details-label">Date de paiement</span>
                <p className="admin-transfer-details-value">{formatDate(transfer.paidAt)}</p>
              </div>
            )}
            <div>
              <span className="admin-transfer-details-label">Montant</span>
              <p className="admin-transfer-details-value">{formatCurrency(transfer.amount)}</p>
            </div>
            <div>
              <span className="admin-transfer-details-label">Frais</span>
              <p className="admin-transfer-details-value">{formatCurrency(transfer.fee)}</p>
            </div>
            <div>
              <span className="admin-transfer-details-label">Montant total</span>
              <p className="admin-transfer-details-value">{formatCurrency(transfer.amount + transfer.fee)}</p>
            </div>
          </div>
        </div>

        <div className="admin-transfer-details-section">
          <h2>Expéditeur</h2>
          <div className="admin-transfer-details-grid">
            <div>
              <span className="admin-transfer-details-label">Nom</span>
              <p className="admin-transfer-details-value">{transfer.senderName}</p>
            </div>
            <div>
              <span className="admin-transfer-details-label">Téléphone</span>
              <p className="admin-transfer-details-value">{transfer.senderPhone}</p>
            </div>
          </div>
        </div>

        <div className="admin-transfer-details-section">
          <h2>Bénéficiaire</h2>
          <div className="admin-transfer-details-grid">
            <div>
              <span className="admin-transfer-details-label">Nom</span>
              <p className="admin-transfer-details-value">{transfer.recipientName}</p>
            </div>
            <div>
              <span className="admin-transfer-details-label">Téléphone</span>
              <p className="admin-transfer-details-value">{transfer.recipientPhone}</p>
            </div>
          </div>
        </div>

        <div className="admin-transfer-details-section">
          <h2>Trajet</h2>
          <div className="admin-transfer-details-grid">
            <div>
              <span className="admin-transfer-details-label">Ville d'origine</span>
              <p className="admin-transfer-details-value">{transfer.originCity?.name ?? ''}</p>
            </div>
            <div>
              <span className="admin-transfer-details-label">Ville de destination</span>
              <p className="admin-transfer-details-value">{transfer.destinationCity?.name ?? ''}</p>
            </div>
          </div>
        </div>

        <div className="admin-transfer-details-section">
          <h2>Agents impliqués</h2>
          <div className="admin-agents-involved">
            <div className="admin-agent-info-card">
              <span className="admin-agent-info-label">Agent d'origine</span>
              {originAgent ? (
                <>
                  <p className="admin-agent-info-name">{originAgent.firstName} {originAgent.lastName}</p>
                  <p className="admin-agent-info-detail">{originAgent.email}</p>
                  <p className="admin-agent-info-detail">{originAgent.phone}</p>
                  <p className="admin-agent-info-detail">{originAgent.city}</p>
                </>
              ) : (
                <p className="admin-agent-info-detail">Agent introuvable</p>
              )}
            </div>
            <div className="admin-agent-info-card">
              <span className="admin-agent-info-label">Agent destinataire</span>
              {destinationAgent ? (
                <>
                  <p className="admin-agent-info-name">{destinationAgent.firstName} {destinationAgent.lastName}</p>
                  <p className="admin-agent-info-detail">{destinationAgent.email}</p>
                  <p className="admin-agent-info-detail">{destinationAgent.phone}</p>
                  <p className="admin-agent-info-detail">{destinationAgent.city}</p>
                </>
              ) : (
                <p className="admin-agent-info-detail">Agent introuvable</p>
              )}
            </div>
          </div>
        </div>

        <div className="admin-transfer-details-section">
          <h2>Cycle de vie</h2>
          <div className="admin-transfer-lifecycle">
            {lifecycleSteps.map((step, index) => (
              <div
                key={step.status}
                className={`admin-transfer-lifecycle-step ${index <= currentStepIndex ? 'active' : ''} ${index < currentStepIndex ? 'completed' : ''}`}
              >
                <div className="admin-transfer-lifecycle-dot" />
                <span className="admin-transfer-lifecycle-label">{step.label}</span>
              </div>
            ))}
          </div>
          {transfer.status === TransferStatus.CANCELLED && (
            <p className="admin-transfer-cancelled-notice">Ce transfert a été annulé.</p>
          )}
        </div>

        <div className="admin-transfer-details-actions">
          {canCancel && (
            <button
              onClick={() => setShowCancelModal(true)}
              className="admin-transfer-details-button danger"
            >
              Annuler le transfert
            </button>
          )}
          {!canCancel && transfer.status !== TransferStatus.CANCELLED && (
            <p className="admin-transfer-cannot-cancel">
              Ce transfert ne peut plus être annulé.
            </p>
          )}
        </div>
      </div>

      {showCancelModal && (
        <div className="admin-transfer-cancel-modal-overlay">
          <div className="admin-transfer-cancel-modal">
            <h2>Confirmer l'annulation</h2>
            <div className="admin-transfer-cancel-summary">
              <p><strong>Référence :</strong> {transfer.reference}</p>
              <p><strong>Montant :</strong> {formatCurrency(transfer.amount)}</p>
              <p><strong>Bénéficiaire :</strong> {transfer.recipientName}</p>
            </div>
            <p className="admin-transfer-cancel-warning">Cette action est définitive.</p>
            {cancelError && (
              <p className="admin-transfer-cancel-error">{cancelError}</p>
            )}
            <div className="admin-transfer-cancel-actions">
              <button
                onClick={() => {
                  setShowCancelModal(false)
                  setCancelError(null)
                }}
                className="admin-transfer-cancel-button secondary"
                disabled={cancelling}
              >
                Retour
              </button>
              <button
                onClick={handleCancel}
                className="admin-transfer-cancel-button danger"
                disabled={cancelling}
              >
                {cancelling ? 'Annulation...' : 'Confirmer l\'annulation'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

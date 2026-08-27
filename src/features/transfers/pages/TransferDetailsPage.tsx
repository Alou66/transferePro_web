import { useState, useEffect } from 'react'
import { useParams, useNavigate, NavLink } from 'react-router-dom'
import { useAuth } from '../../auth/hooks/useAuth'
import {
  useTransfer,
  useWithdrawalCode,
  useMarkTransferAsPaid,
  useCancelTransfer,
} from '../hooks/useTransfers'
import { TransferStatus } from '../../../types/index'
import TransferStatusBadge from '../components/TransferStatusBadge'
import { formatCurrency } from '../../../shared/utils/formatCurrency'
import { formatDate } from '../../../shared/utils/formatDate'
import BackButton from '../../../components/common/BackButton'
import './TransferDetailsPage.css'

export default function TransferDetailsPage() {
  const { transferId } = useParams<{ transferId: string }>()
  const { user } = useAuth()
  const navigate = useNavigate()
  const { data: transfer, isLoading: loading, isError: transferFailed } = useTransfer(transferId)
  const [showPaymentModal, setShowPaymentModal] = useState(false)
  const [codeRevealed, setCodeRevealed] = useState(false)
  const [showCancelModal, setShowCancelModal] = useState(false)
  const [actionError, setActionError] = useState<string | null>(null)
  const [cancelError, setCancelError] = useState<string | null>(null)

  const markAsPaid = useMarkTransferAsPaid()
  const cancelTransfer = useCancelTransfer()
  const {
    data: withdrawalCodeData,
    isFetching: withdrawalCodeLoading,
    error: withdrawalCodeQueryError,
  } = useWithdrawalCode(codeRevealed ? transfer?.id : undefined)

  const paying = markAsPaid.isPending
  const cancelling = cancelTransfer.isPending
  const withdrawalCode = codeRevealed ? withdrawalCodeData?.withdrawalCode ?? null : null
  const withdrawalCodeError = withdrawalCodeQueryError ? 'Impossible de récupérer le code de retrait.' : null

  const isAuthorized = transfer
    ? transfer.originAgentId === user?.id ||
      transfer.destinationAgentId === user?.id ||
      transfer.paidByAgentId === user?.id
    : true

  const error = transferFailed
    ? 'Transfert introuvable.'
    : transfer && !isAuthorized
      ? "Vous n'êtes pas autorisé à consulter ce transfert."
      : actionError

  useEffect(() => {
    if (showPaymentModal) {
      document.body.style.overflow = 'hidden'
    } else {
      document.body.style.overflow = ''
    }
    return () => {
      document.body.style.overflow = ''
    }
  }, [showPaymentModal])

  const handleToggleWithdrawalCode = () => {
    setCodeRevealed((revealed) => !revealed)
  }

  const handleVerifyCode = () => {
    if (!transferId || !transfer) return
    if (transfer.destinationAgentId !== user?.id) return
    navigate(`/agent/transfers/${transferId}/verify`)
  }

  const handlePayment = async () => {
    if (!transfer || !user) return

    try {
      await markAsPaid.mutateAsync(transfer.id)
      setShowPaymentModal(false)
      navigate(`/agent/transfers/${transfer.id}/payment-success`)
    } catch (err) {
      setActionError(err instanceof Error ? err.message : 'Une erreur est survenue lors du paiement.')
    }
  }

  const handleCancel = async () => {
    if (!transfer || !user) return

    setCancelError(null)

    try {
      await cancelTransfer.mutateAsync(transfer.id)
      setShowCancelModal(false)
    } catch (err) {
      setCancelError(err instanceof Error ? err.message : 'Une erreur est survenue lors de l\'annulation.')
    }
  }

  if (loading) {
    return (
      <div className="transfer-details-page">
        <div className="transfer-details-loading">
          <div className="transfer-details-spinner" />
          <p>Chargement...</p>
        </div>
      </div>
    )
  }

  if (error || !transfer) {
    return (
      <div className="transfer-details-page">
        <div className="transfer-details-error">
          <p>{error || 'Transfert introuvable.'}</p>
          <NavLink to="/agent" className="transfer-details-link">
            Retour à l'accueil
          </NavLink>
        </div>
      </div>
    )
  }

  const isCreated = transfer.status === TransferStatus.CREATED
  const isReadyForPayment = transfer.status === TransferStatus.READY_FOR_PAYMENT
  const isPaid = transfer.status === TransferStatus.PAID
  const isCancelled = transfer.status === TransferStatus.CANCELLED

  const isDestinationAgent = transfer.destinationAgentId === user?.id
  const isOriginAgent = transfer.originAgentId === user?.id
  const canVerifyCode = isCreated && isDestinationAgent
  const canPay = isReadyForPayment && isDestinationAgent
  const canCancel = isCreated && isOriginAgent
  const canViewWithdrawalCode = isOriginAgent

  return (
    <div className="transfer-details-page">
      <BackButton to="/agent/transfers/incoming" />
      <div className="transfer-details-card">
        <div className="transfer-details-header">
          <div>
            <h1>Détails du transfert</h1>
            <span className="transfer-details-reference">{transfer.reference}</span>
          </div>
          <TransferStatusBadge status={transfer.status} />
        </div>

        <div className="transfer-details-sections">
          <div className="transfer-details-section">
            <h2>Expéditeur</h2>
            <p><strong>Nom :</strong> {transfer.senderName}</p>
            <p><strong>Téléphone :</strong> {transfer.senderPhone}</p>
          </div>

          <div className="transfer-details-section">
            <h2>Bénéficiaire</h2>
            <p><strong>Nom :</strong> {transfer.recipientName}</p>
            <p><strong>Téléphone :</strong> {transfer.recipientPhone}</p>
          </div>

          <div className="transfer-details-section">
            <h2>Trajet</h2>
            <p><strong>Origine :</strong> {transfer.originCity?.name ?? ''}</p>
            <p><strong>Destination :</strong> {transfer.destinationCity?.name ?? ''}</p>
          </div>

          <div className="transfer-details-section">
            <h2>Montant</h2>
            <p className="transfer-details-amount">{formatCurrency(transfer.amount)}</p>
            <p className="transfer-details-fee">Frais : {formatCurrency(transfer.fee)}</p>
            <p className="transfer-details-total">
              Total à recevoir : <strong>{formatCurrency(transfer.amount + transfer.fee)}</strong>
            </p>
          </div>

          <div className="transfer-details-section">
            <h2>Date</h2>
            <p>{formatDate(transfer.createdAt)}</p>
          </div>

          {isPaid && transfer.paidAt && (
            <div className="transfer-details-section">
              <h2>Paiement</h2>
              <p><strong>Date de paiement :</strong> {formatDate(transfer.paidAt)}</p>
            </div>
          )}

          {canViewWithdrawalCode && (
            <div className="transfer-details-section">
              <h2>Code secret de retrait</h2>
              <div className="withdrawal-code-container">
                <span className="withdrawal-code-value">
                  {withdrawalCode ?? '••••'}
                </span>
                <button
                  type="button"
                  onClick={handleToggleWithdrawalCode}
                  className="withdrawal-code-toggle"
                  disabled={withdrawalCodeLoading}
                >
                  {withdrawalCodeLoading
                    ? 'Chargement...'
                    : withdrawalCode !== null
                      ? 'Masquer le code'
                      : 'Afficher le code'}
                </button>
              </div>
              {withdrawalCodeError && (
                <p className="withdrawal-code-error">{withdrawalCodeError}</p>
              )}
              <p className="withdrawal-code-hint">
                Communiquez ce code uniquement après avoir vérifié l'identité du client.
              </p>
            </div>
          )}
        </div>

        <div className="transfer-details-actions">
          {canVerifyCode && (
            <button onClick={handleVerifyCode} className="transfer-details-button primary">
              Vérifier le code de retrait
            </button>
          )}

          {canPay && (
            <>
              <span className="transfer-details-verified-badge">✓ Code vérifié</span>
              <span className="transfer-details-verified-text">Le bénéficiaire peut recevoir son argent.</span>
              <button
                onClick={() => setShowPaymentModal(true)}
                className="transfer-details-button primary"
              >
                Effectuer le paiement
              </button>
            </>
          )}

          {canCancel && (
            <button
              onClick={() => setShowCancelModal(true)}
              className="transfer-details-button danger"
              disabled={cancelling}
            >
              Annuler le transfert
            </button>
          )}

          {isPaid && (
            <div className="transfer-details-paid-badge">
              ✓ Transfert payé
            </div>
          )}

          {isCancelled && (
            <div className="transfer-details-cancelled-badge">
              Transfert annulé
            </div>
          )}
        </div>
      </div>

      {showPaymentModal && (
        <div
          className="payment-modal-overlay"
          role="dialog"
          aria-modal="true"
          aria-labelledby="payment-modal-title"
        >
          <div className="payment-modal">
            <h2 id="payment-modal-title">Confirmer le paiement</h2>
            <p className="payment-modal-amount">
              Vous êtes sur le point de remettre :
              <strong>{formatCurrency(transfer.amount)}</strong>
            </p>
            <p className="payment-modal-recipient">
              à : <strong>{transfer.recipientName}</strong>
            </p>
            <p className="payment-modal-warning">⚠ Cette opération est définitive.</p>
            <div className="payment-modal-actions">
              <button
                onClick={() => setShowPaymentModal(false)}
                className="payment-modal-button secondary"
                disabled={paying}
              >
                Annuler
              </button>
              <button
                onClick={handlePayment}
                className="payment-modal-button danger"
                disabled={paying}
              >
                {paying ? 'Paiement en cours...' : 'Confirmer le paiement'}
              </button>
            </div>
          </div>
        </div>
      )}

      {showCancelModal && (
        <div
          className="payment-modal-overlay"
          role="dialog"
          aria-modal="true"
          aria-labelledby="cancel-modal-title"
        >
          <div className="payment-modal">
            <h2 id="cancel-modal-title">Annuler le transfert</h2>
            <p className="payment-modal-amount">
              Vous êtes sur le point d'annuler le transfert :
              <strong>{transfer.reference}</strong>
            </p>
            <p className="payment-modal-warning">⚠ Cette opération est définitive.</p>
            {cancelError && <p className="payment-modal-error">{cancelError}</p>}
            <div className="payment-modal-actions">
              <button
                onClick={() => setShowCancelModal(false)}
                className="payment-modal-button secondary"
                disabled={cancelling}
              >
                Retour
              </button>
              <button
                onClick={handleCancel}
                className="payment-modal-button danger"
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

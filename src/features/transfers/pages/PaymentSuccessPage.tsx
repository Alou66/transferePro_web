import { useParams, NavLink } from 'react-router-dom'
import { useAuth } from '../../auth/hooks/useAuth'
import { useTransfer } from '../hooks/useTransfers'
import { TransferStatus } from '../../../types/index'
import TransferStatusBadge from '../components/TransferStatusBadge'
import { formatCurrency } from '../../../shared/utils/formatCurrency'
import { formatDate } from '../../../shared/utils/formatDate'
import './PaymentSuccessPage.css'

export default function PaymentSuccessPage() {
  const { transferId } = useParams<{ transferId: string }>()
  const { user } = useAuth()
  const { data: transfer, isLoading: loading, isError: transferFailed } = useTransfer(transferId)

  const isAuthorized = transfer
    ? transfer.destinationAgentId === user?.id &&
      transfer.paidByAgentId === user?.id &&
      transfer.status === TransferStatus.PAID
    : true

  const error =
    transferFailed || !transferId
      ? 'Transfert introuvable.'
      : transfer && !isAuthorized
        ? "Vous n'êtes pas autorisé à consulter cette confirmation."
        : null

  if (loading) {
    return (
      <div className="payment-success-page">
        <div className="payment-success-loading">
          <div className="payment-success-spinner" />
          <p>Chargement...</p>
        </div>
      </div>
    )
  }

  if (error || !transfer) {
    return (
      <div className="payment-success-page">
        <div className="payment-success-error">
          <p>{error || 'Transfert introuvable.'}</p>
          <NavLink to="/agent" className="payment-success-link">
            Retour à l'accueil
          </NavLink>
        </div>
      </div>
    )
  }

  return (
    <div className="payment-success-page">
      <div className="payment-success-card">
        <div className="payment-success-icon">✓</div>
        <h1>Paiement effectué avec succès</h1>

        <div className="payment-success-details">
          <div className="payment-success-row">
            <span>Référence</span>
            <strong>{transfer.reference}</strong>
          </div>
          <div className="payment-success-row">
            <span>Montant remis</span>
            <strong>{formatCurrency(transfer.amount)}</strong>
          </div>
            <div className="payment-success-row">
              <span>Bénéficiaire</span>
              <strong>{transfer.recipientName}</strong>
            </div>
          <div className="payment-success-row">
            <span>Statut</span>
            <TransferStatusBadge status={transfer.status} />
          </div>
          <div className="payment-success-row">
            <span>Agent ayant effectué le paiement</span>
            <span>{user?.firstName} {user?.lastName}</span>
          </div>
          <div className="payment-success-row">
            <span>Date du paiement</span>
            <span>{transfer.paidAt ? formatDate(transfer.paidAt) : '—'}</span>
          </div>
        </div>

        <div className="payment-success-actions">
          <NavLink to="/agent/transfers/incoming" className="payment-success-button secondary">
            Retour aux transferts
          </NavLink>
          <NavLink to="/agent" className="payment-success-button primary">
            Accueil
          </NavLink>
        </div>
      </div>
    </div>
  )
}

import { useParams, NavLink } from 'react-router-dom'
import { useAuth } from '../../auth/hooks/useAuth'
import { useTransfer } from '../hooks/useTransfers'
import TransferStatusBadge from '../components/TransferStatusBadge'
import { formatCurrency } from '../../../shared/utils/formatCurrency'
import { formatDate } from '../../../shared/utils/formatDate'
import './TransferCreatedPage.css'

export default function TransferCreatedPage() {
  const { transferId } = useParams<{ transferId: string }>()
  const { user } = useAuth()
  const { data: transfer, isLoading: loading, isError: transferFailed } = useTransfer(transferId)

  const error =
    transferFailed || !transferId
      ? 'Transfert introuvable.'
      : transfer && transfer.originAgentId !== user?.id
        ? 'Vous n\'êtes pas autorisé à consulter ce transfert.'
        : null

  if (loading) {
    return (
      <div className="transfer-created-loading">
        <div className="transfer-created-loading-spinner" />
        <p>Chargement...</p>
      </div>
    )
  }

  if (error || !transfer) {
    return (
      <div className="transfer-created-error">
        <p>{error || 'Transfert introuvable.'}</p>
        <NavLink to="/agent" className="transfer-created-link">
          Retour à l'accueil
        </NavLink>
      </div>
    )
  }

  return (
    <div className="transfer-created-page">
      <div className="transfer-created-card">
        <div className="transfer-created-icon">✓</div>
        <h1>Transfert enregistré avec succès</h1>

        <div className="transfer-created-details">
          <div className="transfer-created-row">
            <span>Référence</span>
            <strong>{transfer.reference}</strong>
          </div>
          <div className="transfer-created-row">
            <span>Montant</span>
            <strong>{formatCurrency(transfer.amount)}</strong>
          </div>
          <div className="transfer-created-row">
            <span>Destination</span>
            <strong>{transfer.destinationCity?.name ?? ''}</strong>
          </div>
          <div className="transfer-created-row">
            <span>Nom du bénéficiaire</span>
            <strong>{transfer.recipientName}</strong>
          </div>
          <div className="transfer-created-row">
            <span>Statut</span>
            <TransferStatusBadge status={transfer.status} />
          </div>
          <div className="transfer-created-row">
            <span>Date</span>
            <span>{formatDate(transfer.createdAt)}</span>
          </div>
        </div>

        <div className="transfer-created-code">
          <span className="transfer-created-code-label">CODE SECRET DE RETRAIT</span>
          <span className="transfer-created-code-value">{transfer.withdrawalCode}</span>
          <p className="transfer-created-code-hint">
            Communiquez ce code au bénéficiaire de manière sécurisée. Il sera demandé lors du retrait de l'argent.
          </p>
        </div>

        <NavLink to="/agent" className="transfer-created-button">
          Retour à l'accueil
        </NavLink>
      </div>
    </div>
  )
}

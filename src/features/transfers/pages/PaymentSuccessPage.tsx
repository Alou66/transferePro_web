import { useEffect, useState } from 'react'
import { useParams, NavLink } from 'react-router-dom'
import { useAuth } from '../../auth/hooks/useAuth'
import { transferService } from '../services/transferService'
import type { Transfer } from '../../../types/index'
import { TransferStatus } from '../../../types/index'
import TransferStatusBadge from '../components/TransferStatusBadge'
import { formatCurrency } from '../../../shared/utils/formatCurrency'
import { formatDate } from '../../../shared/utils/formatDate'
import './PaymentSuccessPage.css'

export default function PaymentSuccessPage() {
  const { transferId } = useParams<{ transferId: string }>()
  const { user } = useAuth()
  const [transfer, setTransfer] = useState<Transfer | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    async function load() {
      if (!transferId) {
        setError('Transfert introuvable.')
        setLoading(false)
        return
      }

      try {
        const data = await transferService.getById(transferId)
        setTransfer(data)

        if (
          data.destinationAgentId !== user?.id ||
          data.paidByAgentId !== user?.id ||
          data.status !== TransferStatus.PAID
        ) {
          setError("Vous n'êtes pas autorisé à consulter cette confirmation.")
        }
      } catch {
        setError('Transfert introuvable.')
      } finally {
        setLoading(false)
      }
    }

    load()
  }, [transferId, user?.id])

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
            <strong>{transfer.receiverName}</strong>
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

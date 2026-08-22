import { useState, useEffect, useCallback } from 'react'
import { useAuth } from '../../auth/hooks/useAuth'
import { useNavigate } from 'react-router-dom'
import { transferService } from '../services/transferService'
import { TransferStatus, type Transfer } from '../../../types/index'
import TransferStatusBadge from '../components/TransferStatusBadge'
import { formatCurrency } from '../../../shared/utils/formatCurrency'
import { formatDate } from '../../../shared/utils/formatDate'
import './IncomingTransfersPage.css'

export default function IncomingTransfersPage() {
  const { user } = useAuth()
  const navigate = useNavigate()
  const [transfers, setTransfers] = useState<Transfer[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [refreshing, setRefreshing] = useState(false)

  const loadData = useCallback(async () => {
    if (!user) return

    setLoading(true)
    setError(null)

    try {
      const allIncoming = await transferService.getIncomingForAgent(user.id)

      const filtered = allIncoming
        .filter(
          (t) =>
            t.status === TransferStatus.CREATED ||
            t.status === TransferStatus.READY_FOR_PAYMENT,
        )
        .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())

      setTransfers(filtered)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Impossible de charger les transferts entrants.')
    } finally {
      setLoading(false)
      setRefreshing(false)
    }
  }, [user])

  useEffect(() => {
    // oxlint-disable-next-line react-hooks/set-state-in-effect
    loadData()
  }, [loadData])

  const handleRefresh = () => {
    setRefreshing(true)
    loadData()
  }

  const handleRetry = () => {
    loadData()
  }

  if (loading) {
    return (
      <div className="incoming-page">
        <div className="incoming-header">
          <h1>Transferts entrants</h1>
        </div>
        <div className="incoming-loading">
          <div className="incoming-loading-spinner" />
          <p>Chargement des transferts entrants...</p>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="incoming-page">
        <div className="incoming-header">
          <h1>Transferts entrants</h1>
        </div>
        <div className="incoming-error">
          <p>{error}</p>
          <button onClick={handleRetry} className="incoming-retry-button">
            Réessayer
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="incoming-page">
      <div className="incoming-header">
        <div>
          <h1>Transferts entrants</h1>
          <p className="incoming-summary">
            {transfers.length} transfert{transfers.length !== 1 ? 's' : ''} à traiter
          </p>
        </div>
        <button
          onClick={handleRefresh}
          disabled={refreshing || loading}
          className="incoming-refresh-button"
        >
          {refreshing ? 'Actualisation...' : 'Actualiser'}
        </button>
      </div>

      {transfers.length === 0 ? (
        <div className="incoming-empty">
          <p>Aucun transfert entrant pour le moment.</p>
          <p className="incoming-empty-hint">
            Les nouveaux transferts destinés à votre ville apparaîtront ici.
          </p>
        </div>
      ) : (
        <div className="incoming-list">
          {transfers.map((transfer) => (
            <button
              key={transfer.id}
              onClick={() => navigate(`/agent/transfers/${transfer.id}`)}
              className="incoming-card-button"
              type="button"
            >
              <div className="incoming-card">
                <div className="incoming-card-header">
                  <span className="incoming-reference">{transfer.reference}</span>
                  <TransferStatusBadge status={transfer.status} />
                </div>

                <div className="incoming-card-body">
                  <p className="incoming-route">
                    <span className="incoming-name">{transfer.senderName}</span>
                    <span className="incoming-arrow">→</span>
                    <span className="incoming-name">{transfer.receiverName}</span>
                  </p>

                  <p className="incoming-traject">
                    <span className="incoming-traject-icon">📍</span>
                    <span className="incoming-traject-text">
                      {transfer.originCity} → {transfer.destinationCity}
                    </span>
                  </p>

                  <div className="incoming-card-footer">
                    <div className="incoming-amount">
                      <span className="incoming-amount-label">Montant</span>
                      <span className="incoming-amount-value">
                        {formatCurrency(transfer.amount)}
                      </span>
                    </div>
                    <div className="incoming-date">
                      {formatDate(transfer.createdAt)}
                    </div>
                  </div>
                </div>

                <div className="incoming-card-action">
                  <span className="incoming-details-link">
                    Voir les détails <span className="incoming-details-arrow">→</span>
                  </span>
                </div>
              </div>
            </button>
          ))}
        </div>
      )}
    </div>
  )
}
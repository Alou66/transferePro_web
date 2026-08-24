import { useState, useEffect, useCallback, useMemo } from 'react'
import { useAuth } from '../../auth/hooks/useAuth'
import { useNavigate } from 'react-router-dom'
import { transferService } from '../services/transferService'
import type { Transfer } from '../../../types/index'
import { TransferStatus } from '../../../types/index'
import { calculateAgentStats, getActivePeriodStart } from '../utils/agentStatsUtils'
import TransferStatusBadge from '../components/TransferStatusBadge'
import { formatCurrency } from '../../../shared/utils/formatCurrency'
import { formatDate } from '../../../shared/utils/formatDate'
import './TransferHistoryPage.css'

type TransferType = 'ALL' | 'SENT' | 'INCOMING' | 'PAID'
type StatusFilter = 'ALL' | TransferStatus

const TRANSFER_TYPE_LABELS: Record<TransferType, string> = {
  ALL: 'Tous',
  SENT: 'Envoyés',
  INCOMING: 'Entrants',
  PAID: 'Payés',
}

const STATUS_FILTER_OPTIONS: { value: StatusFilter; label: string }[] = [
  { value: 'ALL', label: 'Tous les statuts' },
  { value: TransferStatus.CREATED, label: 'Créé' },
  { value: TransferStatus.READY_FOR_PAYMENT, label: 'Prêt au paiement' },
  { value: TransferStatus.PAID, label: 'Payé' },
  { value: TransferStatus.CANCELLED, label: 'Annulé' },
]

export default function TransferHistoryPage() {
  const { user } = useAuth()
  const navigate = useNavigate()
  const [allTransfers, setAllTransfers] = useState<Transfer[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [refreshing, setRefreshing] = useState(false)
  const [typeFilter, setTypeFilter] = useState<TransferType>('ALL')
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('ALL')
  const [search, setSearch] = useState('')
  const [activeFrom, setActiveFrom] = useState<string | null>(null)
  const [cancelTargetId, setCancelTargetId] = useState<string | null>(null)
  const [cancelling, setCancelling] = useState(false)
  const [cancelError, setCancelError] = useState<string | null>(null)

  const loadData = useCallback(async () => {
    if (!user) return

    setLoading(true)
    setError(null)

    try {
      const data = await transferService.getAllForAgent(user.id)
      setAllTransfers(data)

      const periodStart = await getActivePeriodStart(user.id)
      setActiveFrom(periodStart)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Impossible de charger l\'historique des transferts.')
    } finally {
      setLoading(false)
      setRefreshing(false)
    }
  }, [user])

  useEffect(() => {
    // oxlint-disable-next-line react-hooks/set-state-in-effect
    loadData()
  }, [loadData])

  const getTransferType = useCallback((transfer: Transfer): TransferType => {
    if (transfer.paidByAgentId === user?.id && transfer.status === TransferStatus.PAID) {
      return 'PAID'
    }
    if (transfer.destinationAgentId === user?.id) {
      return 'INCOMING'
    }
    if (transfer.originAgentId === user?.id) {
      return 'SENT'
    }
    return 'SENT'
  }, [user?.id])

  const filteredTransfers = useMemo(() => {
    let result = allTransfers

    if (typeFilter !== 'ALL') {
      result = result.filter((t) => getTransferType(t) === typeFilter)
    }

    if (statusFilter !== 'ALL') {
      result = result.filter((t) => t.status === statusFilter)
    }

    if (search.trim()) {
      const query = search.trim().toLowerCase()
      result = result.filter((t) =>
        t.reference.toLowerCase().includes(query) ||
        t.senderName.toLowerCase().includes(query) ||
        t.senderPhone.includes(query) ||
        t.receiverName.toLowerCase().includes(query) ||
        t.receiverPhone.includes(query),
      )
    }

    return result
  }, [allTransfers, typeFilter, statusFilter, search, getTransferType])

  const stats = useMemo(() => {
    if (!user) {
      return {
        total: 0,
        sent: 0,
        paid: 0,
        totalCollected: 0,
      }
    }
    const sent = allTransfers.filter((t) => t.originAgentId === user.id)
    const paid = allTransfers.filter((t) => t.paidByAgentId === user.id && t.status === TransferStatus.PAID)
    const agentStats = calculateAgentStats(allTransfers, user.id, activeFrom ?? undefined)

    return {
      total: allTransfers.length,
      sent: sent.length,
      paid: paid.length,
      totalCollected: agentStats.totalCollected,
    }
  }, [allTransfers, user, activeFrom])

  const handleRefresh = () => {
    setRefreshing(true)
    loadData()
  }

  const handleCancel = async () => {
    if (!cancelTargetId || !user) return

    setCancelling(true)
    setCancelError(null)

    try {
      await transferService.cancel(cancelTargetId, user.id)
      setAllTransfers((prev) =>
        prev.map((t) =>
          t.id === cancelTargetId ? { ...t, status: TransferStatus.CANCELLED } : t,
        ),
      )
      setCancelTargetId(null)
    } catch (err) {
      setCancelError(err instanceof Error ? err.message : 'Une erreur est survenue lors de l\'annulation.')
    } finally {
      setCancelling(false)
    }
  }

  if (loading) {
    return (
      <div className="history-page">
        <div className="history-header">
          <h1>Historique des transferts</h1>
        </div>
        <div className="history-loading">
          <div className="history-loading-spinner" />
          <p>Chargement de l'historique...</p>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="history-page">
        <div className="history-header">
          <h1>Historique des transferts</h1>
        </div>
        <div className="history-error">
          <p>{error}</p>
          <button onClick={loadData} className="history-retry-button">
            Réessayer
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="history-page">
      <div className="history-header">
        <div>
          <h1>Historique des transferts</h1>
          <p className="history-subtitle">
            {stats.total} transfert{stats.total !== 1 ? 's' : ''} au total
          </p>
        </div>
        <button
          onClick={handleRefresh}
          disabled={refreshing || loading}
          className="history-refresh-button"
        >
          {refreshing ? 'Actualisation...' : 'Actualiser'}
        </button>
      </div>

      <div className="history-stats">
        <div className="history-stat-card">
          <span className="history-stat-value">{stats.total}</span>
          <span className="history-stat-label">Total</span>
        </div>
        <div className="history-stat-card">
          <span className="history-stat-value">{stats.sent}</span>
          <span className="history-stat-label">Envoyés</span>
        </div>
        <div className="history-stat-card">
          <span className="history-stat-value">{stats.paid}</span>
          <span className="history-stat-label">Payés</span>
        </div>
        <div className="history-stat-card">
          <span className="history-stat-value">{formatCurrency(stats.totalCollected)}</span>
          <span className="history-stat-label">Montant total encaissé</span>
        </div>
      </div>

      <div className="history-filters">
        <div className="history-filter-group">
          {Object.entries(TRANSFER_TYPE_LABELS).map(([key, label]) => (
            <button
              key={key}
              onClick={() => setTypeFilter(key as TransferType)}
              className={`history-filter-button ${typeFilter === key ? 'active' : ''}`}
            >
              {label}
            </button>
          ))}
        </div>

        <div className="history-filter-row">
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value as StatusFilter)}
            className="history-select"
          >
            {STATUS_FILTER_OPTIONS.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>

          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Rechercher..."
            className="history-search"
          />
        </div>
      </div>

      {filteredTransfers.length === 0 ? (
        <div className="history-empty">
          <p>
            {allTransfers.length === 0
              ? 'Aucun transfert dans votre historique.'
              : 'Aucun transfert ne correspond à votre recherche.'}
          </p>
        </div>
      ) : (
        <div className="history-list">
          {filteredTransfers.map((transfer) => {
            const typeLabel = TRANSFER_TYPE_LABELS[getTransferType(transfer)]
            return (
              <div key={transfer.id} className="history-card">
                <div className="history-card-header">
                  <span className="history-reference">{transfer.reference}</span>
                  <TransferStatusBadge status={transfer.status} />
                </div>

                  <div className="history-card-body">
                    <div className="history-type-badge">{typeLabel}</div>

                    <div className="history-section">
                      <span className="history-section-label">Trajet</span>
                      <p className="history-section-value">
                        {transfer.originCity} → {transfer.destinationCity}
                      </p>
                    </div>

                    <div className="history-card-footer">
                      <div className="history-amount">
                        <span className="history-amount-label">Montant</span>
                        <span className="history-amount-value">
                          {formatCurrency(transfer.amount)}
                        </span>
                      </div>
                      <div className="history-date">
                        {formatDate(transfer.createdAt)}
                      </div>
                    </div>

                    <button
                      onClick={() => navigate(`/agent/transfers/${transfer.id}`)}
                      className="history-details-button"
                    >
                      Voir les détails
                    </button>

                    {user && transfer.originAgentId === user.id && transfer.status === TransferStatus.CREATED && (
                      <button
                        onClick={() => setCancelTargetId(transfer.id)}
                        className="history-cancel-button"
                        type="button"
                      >
                        Annuler
                      </button>
                    )}
                  </div>
              </div>
            )
          })}
        </div>
      )}
      {cancelTargetId && (
        <div className="history-cancel-modal-overlay">
          <div className="history-cancel-modal">
            <h2>Annuler le transfert</h2>
            <p>Vous êtes sur le point d'annuler ce transfert. Cette opération est définitive.</p>
            {cancelError && (
              <p className="history-cancel-error">{cancelError}</p>
            )}
            <div className="history-cancel-actions">
              <button
                onClick={() => {
                  setCancelTargetId(null)
                  setCancelError(null)
                }}
                className="history-cancel-button-secondary"
                disabled={cancelling}
              >
                Retour
              </button>
              <button
                onClick={handleCancel}
                className="history-cancel-button-danger"
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

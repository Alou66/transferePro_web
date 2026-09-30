import { useState, useCallback, useMemo } from 'react'
import { useAuth } from '../../auth/hooks/useAuth'
import { useNavigate } from 'react-router-dom'
import { useMyTransfers } from '../hooks/useTransfers'
import type { Transfer } from '../../../types/index'
import { TransferStatus } from '../../../types/index'
import { useAgentStatistics } from '../../agents/hooks/useAgents'
import TransferStatusBadge from '../components/TransferStatusBadge'
import { formatCurrency } from '../../../shared/utils/formatCurrency'
import { formatDate } from '../../../shared/utils/formatDate'
import './TransferHistoryPage.css'

type TransferRole = 'SENT' | 'TO_PAY' | 'PAID'
type StatusFilter = 'ALL' | TransferStatus

// Rôle de l'agent dans le transfert. Ce n'est plus un filtre : la page ne
// propose que le statut et la recherche. Le rôle reste affiché sur le badge de
// chaque carte, où il renseigne l'agent sur le sens de l'argent pour ce
// transfert (il encaisse, il doit verser, il a versé).
const ROLE_BADGE_LABELS: Record<TransferRole, string> = {
  SENT: "J'ai envoyé",
  TO_PAY: 'À me verser',
  PAID: "J'ai versé",
}

// « Statut du transfert » répond à : où en est le cycle de vie de ce transfert ?
const STATUS_FILTERS: { value: StatusFilter; label: string }[] = [
  { value: 'ALL', label: 'Tous' },
  { value: TransferStatus.CREATED, label: 'Créé' },
  { value: TransferStatus.READY_FOR_PAYMENT, label: 'Prêt au paiement' },
  { value: TransferStatus.PAID, label: 'Payé' },
  { value: TransferStatus.CANCELLED, label: 'Annulé' },
]

export default function TransferHistoryPage() {
  const { user } = useAuth()
  const navigate = useNavigate()
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('ALL')
  const [search, setSearch] = useState('')

  const {
    data: allTransfers = [],
    isLoading: loading,
    isFetching,
    error: queryError,
    refetch: loadData,
  } = useMyTransfers()

  const error = queryError ? 'Impossible de charger l\'historique des transferts.' : null
  const refreshing = isFetching && !loading

  const {
    data: statistics,
    isLoading: statsLoading,
    isError: statsFailed,
    refetch: refetchStatistics,
  } = useAgentStatistics(user?.id)

  const getTransferRole = useCallback(
    (transfer: Transfer): TransferRole => {
      if (transfer.paidByAgentId === user?.id && transfer.status === TransferStatus.PAID) {
        return 'PAID'
      }
      if (transfer.destinationAgentId === user?.id) {
        return 'TO_PAY'
      }
      return 'SENT'
    },
    [user?.id],
  )

  const filteredTransfers = useMemo(() => {
    let result = allTransfers

    if (statusFilter !== 'ALL') {
      result = result.filter((t) => t.status === statusFilter)
    }

    if (search.trim()) {
      const query = search.trim().toLowerCase()
      result = result.filter((t) =>
        t.reference.toLowerCase().includes(query) ||
        t.senderName.toLowerCase().includes(query) ||
        t.senderPhone.includes(query) ||
        t.recipientName.toLowerCase().includes(query) ||
        t.recipientPhone.includes(query),
      )
    }

    return result
  }, [allTransfers, statusFilter, search])

  const isFiltering = statusFilter !== 'ALL' || search.trim() !== ''

  const handleRefresh = () => {
    loadData()
  }

  const handleResetFilters = () => {
    setStatusFilter('ALL')
    setSearch('')
  }

  if (loading || statsLoading) {
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

  if (error || statsFailed) {
    return (
      <div className="history-page">
        <div className="history-header">
          <h1>Historique des transferts</h1>
        </div>
        <div className="history-error">
          <p>{error ?? 'Impossible de charger les statistiques financières.'}</p>
          <button
            onClick={() => {
              loadData()
              refetchStatistics()
            }}
            className="history-retry-button"
          >
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
            {allTransfers.length} transfert{allTransfers.length !== 1 ? 's' : ''} au total
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

      <div className="history-summary">
        <span className="history-summary-label">Montant total encaissé</span>
        <span className="history-summary-value">
          {formatCurrency(statistics?.financial.totalCreated ?? 0)}
        </span>
      </div>

      <div className="history-filters">
        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Rechercher un nom, une référence ou un téléphone"
          aria-label="Rechercher un transfert"
          className="history-search"
        />

        <div className="history-filter-group">
          <span className="history-filter-label" id="history-status-label">
            Statut du transfert
          </span>
          <div className="history-filter-buttons" role="group" aria-labelledby="history-status-label">
            {STATUS_FILTERS.map((filter) => (
              <button
                key={filter.value}
                onClick={() => setStatusFilter(filter.value)}
                className={`history-filter-button ${statusFilter === filter.value ? 'active' : ''}`}
                aria-pressed={statusFilter === filter.value}
              >
                {filter.label}
              </button>
            ))}
          </div>
        </div>

        <div className="history-results-bar">
          <p className="history-result-count">
            {isFiltering
              ? `${filteredTransfers.length} transfert${filteredTransfers.length !== 1 ? 's' : ''} sur ${allTransfers.length}`
              : `${allTransfers.length} transfert${allTransfers.length !== 1 ? 's' : ''}`}
          </p>
          {isFiltering && (
            <button onClick={handleResetFilters} className="history-reset-button" type="button">
              Réinitialiser les filtres
            </button>
          )}
        </div>
      </div>

      {filteredTransfers.length === 0 ? (
        <div className="history-empty">
          <p>
            {allTransfers.length === 0
              ? 'Aucun transfert dans votre historique.'
              : 'Aucun transfert ne correspond à ces filtres.'}
          </p>
          {allTransfers.length > 0 && (
            <button onClick={handleResetFilters} className="history-reset-button" type="button">
              Réinitialiser les filtres
            </button>
          )}
        </div>
      ) : (
        <div className="history-list">
          {filteredTransfers.map((transfer) => {
            const role = getTransferRole(transfer)
            return (
              <div key={transfer.id} className="history-card">
                <div className="history-card-header">
                  <span className="history-reference">{transfer.reference}</span>
                  <TransferStatusBadge status={transfer.status} />
                </div>

                  <div className="history-card-body">
                    <div className="history-type-badge">{ROLE_BADGE_LABELS[role]}</div>

                    <div className="history-section">
                      <span className="history-section-label">Trajet</span>
                      <p className="history-section-value">
                        {transfer.originCity?.name ?? ''} → {transfer.destinationCity?.name ?? ''}
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
                      onClick={() => navigate(`/agent/transfers/${transfer.id}`, { state: { from: '/agent/transfers/history' } })}
                      className="history-details-button"
                    >
                      Voir les détails
                    </button>
                  </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}

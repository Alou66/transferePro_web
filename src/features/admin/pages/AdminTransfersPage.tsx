import { useState, useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import { useTransfers } from '../../transfers/hooks/useTransfers'
import { TransferStatus } from '../../../types/index'
import TransferStatusBadge from '../../transfers/components/TransferStatusBadge'
import { formatCurrency } from '../../../shared/utils/formatCurrency'
import { formatDate } from '../../../shared/utils/formatDate'
import './AdminTransfersPage.css'

const STATUS_FILTER_OPTIONS = [
  { value: 'ALL', label: 'Tous les statuts' },
  { value: TransferStatus.CREATED, label: 'Créé' },
  { value: TransferStatus.READY_FOR_PAYMENT, label: 'Prêt au paiement' },
  { value: TransferStatus.PAID, label: 'Payé' },
  { value: TransferStatus.CANCELLED, label: 'Annulé' },
]

const CITY_FILTER_OPTIONS = [
  { value: 'ALL', label: 'Toutes les villes' },
]

const PAGE_SIZE = 20

export default function AdminTransfersPage() {
  const navigate = useNavigate()
  const [page, setPage] = useState(1)
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState<string>('ALL')
  const [cityFilter, setCityFilter] = useState<string>('ALL')

  const {
    data: result,
    isLoading: loading,
    isFetching,
    error: queryError,
    refetch: loadData,
  } = useTransfers(page, PAGE_SIZE)

  const transfers = result?.items ?? []
  const totalPages = result?.pagination.totalPages ?? 1
  const total = result?.pagination.total ?? 0
  const error = queryError ? 'Impossible de charger les transferts.' : null
  const refreshing = isFetching && !loading

  const sortedTransfers = useMemo(() => {
    return [...transfers].sort(
      (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
    )
  }, [transfers])

  const filteredTransfers = useMemo(() => {
    let result = sortedTransfers

    if (statusFilter !== 'ALL') {
      result = result.filter((t) => t.status === statusFilter)
    }

    if (cityFilter !== 'ALL') {
      result = result.filter((t) => t.destinationCity?.name === cityFilter)
    }

    if (search.trim()) {
      const query = search.trim().toLowerCase()
      result = result.filter((t) => {
        const fullSender = `${t.senderName} ${t.senderPhone}`.toLowerCase()
        const fullReceiver = `${t.recipientName} ${t.recipientPhone}`.toLowerCase()
        return (
          t.reference.toLowerCase().includes(query) ||
          t.senderName.toLowerCase().includes(query) ||
          t.recipientName.toLowerCase().includes(query) ||
          fullSender.includes(query) ||
          fullReceiver.includes(query)
        )
      })
    }

    return result
  }, [sortedTransfers, statusFilter, cityFilter, search])

  const handleRefresh = () => {
    loadData()
  }

  const handlePreviousPage = () => {
    setPage((current) => Math.max(1, current - 1))
  }

  const handleNextPage = () => {
    setPage((current) => Math.min(totalPages, current + 1))
  }

  if (loading) {
    return (
      <div className="admin-transfers-page">
        <div className="admin-transfers-loading">
          <div className="admin-loading-spinner" />
          <p>Chargement des transferts...</p>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="admin-transfers-page">
        <div className="admin-transfers-error">
          <p>{error}</p>
          <button onClick={() => loadData()} className="admin-retry-button">
            Réessayer
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="admin-transfers-page">
      <div className="admin-transfers-header">
        <div>
          <h1>Gestion des transferts</h1>
          <p className="admin-transfers-subtitle">
            {total} transfert{total !== 1 ? 's' : ''} au total
          </p>
        </div>
        <button
          onClick={handleRefresh}
          disabled={refreshing || loading}
          className="admin-refresh-button"
        >
          {refreshing ? 'Actualisation...' : 'Actualiser'}
        </button>
      </div>

      <div className="admin-transfers-filters">
        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Rechercher par référence, expéditeur ou bénéficiaire..."
          className="admin-search-input"
        />
        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="admin-filter-select"
        >
          {STATUS_FILTER_OPTIONS.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>
        <select
          value={cityFilter}
          onChange={(e) => setCityFilter(e.target.value)}
          className="admin-filter-select"
        >
          {CITY_FILTER_OPTIONS.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>
      </div>

      {filteredTransfers.length === 0 ? (
        <div className="admin-transfers-empty">
          <p>
            {transfers.length === 0
              ? 'Aucun transfert pour le moment.'
              : 'Aucun transfert ne correspond à votre recherche.'}
          </p>
        </div>
      ) : (
        <div className="admin-transfers-list">
          {filteredTransfers.map((transfer) => (
            <div key={transfer.id} className="admin-transfer-card">
              <div className="admin-transfer-header">
                <span className="admin-transfer-reference">{transfer.reference}</span>
                <TransferStatusBadge status={transfer.status} />
              </div>

              <div className="admin-transfer-body">
                <div className="admin-transfer-section">
                  <span className="admin-transfer-section-label">Expéditeur</span>
                  <p className="admin-transfer-section-value">{transfer.senderName}</p>
                </div>

                <div className="admin-transfer-section">
                  <span className="admin-transfer-section-label">Bénéficiaire</span>
                  <p className="admin-transfer-section-value">{transfer.recipientName}</p>
                </div>

                <div className="admin-transfer-section">
                  <span className="admin-transfer-section-label">Trajet</span>
                  <p className="admin-transfer-section-value">
                    {transfer.originCity?.name ?? ''} → {transfer.destinationCity?.name ?? ''}
                  </p>
                </div>
              </div>

              <div className="admin-transfer-footer">
                <div className="admin-transfer-amount">
                  <span className="admin-transfer-amount-label">Montant</span>
                  <span className="admin-transfer-amount-value">
                    {formatCurrency(transfer.amount)}
                  </span>
                </div>
                <div className="admin-transfer-date">
                  {formatDate(transfer.createdAt)}
                </div>
              </div>

              <button
                onClick={() => navigate(`/admin/transfers/${transfer.id}`)}
                className="admin-transfer-details-button"
              >
                Voir les détails
              </button>
            </div>
          ))}
        </div>
      )}

      {totalPages > 1 && (
        <div className="admin-transfers-pagination">
          <button
            onClick={handlePreviousPage}
            disabled={page <= 1}
            className="admin-pagination-button"
          >
            Précédent
          </button>
          <span className="admin-pagination-status">
            Page {page} / {totalPages}
          </span>
          <button
            onClick={handleNextPage}
            disabled={page >= totalPages}
            className="admin-pagination-button"
          >
            Suivant
          </button>
        </div>
      )}
    </div>
  )
}

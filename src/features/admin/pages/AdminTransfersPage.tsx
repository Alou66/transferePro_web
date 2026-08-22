import { useState, useEffect, useCallback, useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import { transferService } from '../../transfers/services/transferService'
import { TransferStatus, type Transfer } from '../../../types/index'
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

export default function AdminTransfersPage() {
  const navigate = useNavigate()
  const [transfers, setTransfers] = useState<Transfer[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [refreshing, setRefreshing] = useState(false)
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState<string>('ALL')
  const [cityFilter, setCityFilter] = useState<string>('ALL')

  const loadData = useCallback(async () => {
    setLoading(true)
    setError(null)

    try {
      const data = await transferService.getAll()
      setTransfers(data)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Impossible de charger les transferts.')
    } finally {
      setLoading(false)
      setRefreshing(false)
    }
  }, [])

  useEffect(() => {
    // oxlint-disable-next-line react-hooks/set-state-in-effect
    loadData()
  }, [loadData])

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
      result = result.filter((t) => t.destinationCity === cityFilter)
    }

    if (search.trim()) {
      const query = search.trim().toLowerCase()
      result = result.filter((t) => {
        const fullSender = `${t.senderName} ${t.senderPhone}`.toLowerCase()
        const fullReceiver = `${t.receiverName} ${t.receiverPhone}`.toLowerCase()
        return (
          t.reference.toLowerCase().includes(query) ||
          t.senderName.toLowerCase().includes(query) ||
          t.receiverName.toLowerCase().includes(query) ||
          fullSender.includes(query) ||
          fullReceiver.includes(query)
        )
      })
    }

    return result
  }, [sortedTransfers, statusFilter, cityFilter, search])

  const handleRefresh = () => {
    setRefreshing(true)
    loadData()
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
          <button onClick={loadData} className="admin-retry-button">
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
            {transfers.length} transfert{transfers.length !== 1 ? 's' : ''} au total
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
                  <p className="admin-transfer-section-value">{transfer.receiverName}</p>
                </div>

                <div className="admin-transfer-section">
                  <span className="admin-transfer-section-label">Trajet</span>
                  <p className="admin-transfer-section-value">
                    {transfer.originCity} → {transfer.destinationCity}
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
    </div>
  )
}

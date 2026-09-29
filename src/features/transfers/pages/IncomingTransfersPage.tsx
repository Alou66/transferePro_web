import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useIncomingTransfers } from '../hooks/useTransfers'
import { TransferStatus } from '../../../types/index'
import TransferStatusBadge from '../components/TransferStatusBadge'
import { formatCurrency } from '../../../shared/utils/formatCurrency'
import { formatDate } from '../../../shared/utils/formatDate'
import { useDebouncedValue } from '../../../shared/hooks/useDebouncedValue'
import './IncomingTransfersPage.css'

const PAGE_SIZE = 20
const PENDING_STATUSES = [TransferStatus.CREATED, TransferStatus.READY_FOR_PAYMENT]

export default function IncomingTransfersPage() {
  const navigate = useNavigate()
  const [page, setPage] = useState(1)
  // search : saisie immédiate (contrôle du champ)
  // debouncedSearch : valeur réellement envoyée au serveur
  const [search, setSearch] = useState('')
  const debouncedSearch = useDebouncedValue(search, 300)

  // Toute nouvelle recherche repart de la première page : sinon on peut atterrir
  // sur une page 3 d'un résultat filtré qui n'en compte qu'une. Le retour à la
  // page 1 se fait dans le handler (et non dans un effet) pour éviter un rendu
  // supplémentaire à chaque frappe.
  const handleSearchChange = (value: string) => {
    setSearch(value)
    setPage(1)
  }

  const {
    data: result,
    isLoading: loading,
    isFetching,
    error: queryError,
    refetch: loadData,
  } = useIncomingTransfers(page, PAGE_SIZE, PENDING_STATUSES, debouncedSearch)

  const transfers = result?.items ?? []
  const totalPages = result?.pagination.totalPages ?? 1
  const error = queryError ? 'Impossible de charger les transferts entrants.' : null
  const refreshing = isFetching && !loading

  const handleRefresh = () => {
    loadData()
  }

  const handleRetry = () => {
    loadData()
  }

  const handlePreviousPage = () => {
    setPage((current) => Math.max(1, current - 1))
  }

  const handleNextPage = () => {
    setPage((current) => Math.min(totalPages, current + 1))
  }

  const handleClearSearch = () => {
    handleSearchChange('')
  }

  const hasSearch = search.trim().length > 0

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

      <div className="incoming-search">
        <input
          type="text"
          value={search}
          onChange={(e) => handleSearchChange(e.target.value)}
          placeholder="Rechercher par nom d'expéditeur ou de bénéficiaire"
          aria-label="Rechercher un transfert par nom d'expéditeur ou de bénéficiaire"
          className="incoming-search-input"
        />
        {hasSearch && (
          <button
            type="button"
            onClick={handleClearSearch}
            className="incoming-search-clear"
            aria-label="Effacer la recherche"
          >
            ✕
          </button>
        )}
      </div>

      {transfers.length === 0 ? (
        <div className="incoming-empty">
          {hasSearch ? (
            <>
              <p>Aucun transfert ne correspond à « {search.trim()} ».</p>
              <p className="incoming-empty-hint">
                Vérifiez l'orthographe, ou effacez la recherche pour voir tous les transferts à traiter.
              </p>
            </>
          ) : (
            <>
              <p>Aucun transfert entrant pour le moment.</p>
              <p className="incoming-empty-hint">
                Les nouveaux transferts destinés à votre ville apparaîtront ici.
              </p>
            </>
          )}
        </div>
      ) : (
        <div className="incoming-list">
          {transfers.map((transfer) => (
            <button
              key={transfer.id}
              onClick={() => navigate(`/agent/transfers/${transfer.id}`, { state: { from: '/agent/transfers/incoming' } })}
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
                    <span className="incoming-name">{transfer.recipientName}</span>
                  </p>

                  <p className="incoming-traject">
                    <span className="incoming-traject-icon">📍</span>
                    <span className="incoming-traject-text">
                      {transfer.originCity?.name ?? ''} → {transfer.destinationCity?.name ?? ''}
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

      {totalPages > 1 && (
        <div className="incoming-pagination">
          <button
            onClick={handlePreviousPage}
            disabled={page <= 1}
            className="incoming-pagination-button"
          >
            Précédent
          </button>
          <span className="incoming-pagination-status">
            Page {page} / {totalPages}
          </span>
          <button
            onClick={handleNextPage}
            disabled={page >= totalPages}
            className="incoming-pagination-button"
          >
            Suivant
          </button>
        </div>
      )}
    </div>
  )
}
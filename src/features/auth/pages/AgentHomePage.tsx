import { useState, useEffect, useCallback, useMemo } from 'react'
import { useAuth } from '../../auth/hooks/useAuth'
import { transferService } from '../../transfers/services/transferService'
import { TransferStatus, type Transfer } from '../../../types/index'
import { useAgentStatistics } from '../../agents/hooks/useAgents'
import TransferStatusBadge from '../../transfers/components/TransferStatusBadge'
import { formatCurrency } from '../../../shared/utils/formatCurrency'
import { formatDate } from '../../../shared/utils/formatDate'
import './AgentDashboard.css'

interface RecentActivity {
  id: string
  reference: string
  recipientName: string
  destinationCity: string
  amount: number
  status: TransferStatus
  createdAt: string
  label: string
}

export default function AgentHomePage() {
  const { user } = useAuth()
  const [allTransfers, setAllTransfers] = useState<Transfer[]>([])
  const [recentActivity, setRecentActivity] = useState<RecentActivity[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const {
    data: statistics,
    isLoading: statsLoading,
    isError: statsFailed,
    refetch: refetchStatistics,
  } = useAgentStatistics(user?.id)

  const loadData = useCallback(async () => {
    if (!user) return

    setLoading(true)
    setError(null)

    try {
      const all = await transferService.getAllForAgent()
      setAllTransfers(all)

      const activity: RecentActivity[] = all.slice(0, 5).map((transfer) => {
        let label = 'Transfert envoyé'
        if (transfer.paidByAgentId === user.id && transfer.originAgentId !== user.id) {
          label = 'Paiement effectué'
        } else if (transfer.destinationAgentId === user.id) {
          label = 'Transfert entrant'
        }
        return {
          id: transfer.id,
          reference: transfer.reference,
          recipientName: transfer.recipientName,
          destinationCity: transfer.destinationCity?.name ?? '',
          amount: transfer.amount,
          status: transfer.status,
          createdAt: transfer.createdAt,
          label,
        }
      })

      setRecentActivity(activity)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Impossible de charger les données. Veuillez réessayer.')
    } finally {
      setLoading(false)
    }
  }, [user])

  useEffect(() => {
    // oxlint-disable-next-line react-hooks/set-state-in-effect
    loadData()
  }, [loadData])

  const stats = useMemo(() => {
    if (!user) {
      return { created: 0, incoming: 0, paid: 0 }
    }
    const created = allTransfers.filter((t) => t.originAgentId === user.id)
    const incoming = allTransfers.filter((t) => t.destinationAgentId === user.id)
    const paid = allTransfers.filter((t) => t.paidByAgentId === user.id)

    return {
      created: created.length,
      incoming: incoming.filter(
        (t) => t.status === TransferStatus.CREATED || t.status === TransferStatus.READY_FOR_PAYMENT,
      ).length,
      paid: paid.length,
    }
  }, [allTransfers, user])

  const isFirstPeriod = statistics ? statistics.period.lastCollectionAt === null : true

  if (loading || statsLoading) {
    return (
      <div className="dashboard-loading">
        <div className="dashboard-loading-spinner" />
        <p>Chargement du tableau de bord...</p>
      </div>
    )
  }

  if (error || statsFailed) {
    return (
      <div className="dashboard-error">
        <p>{error ?? 'Impossible de charger les statistiques financières.'}</p>
        <button
          onClick={() => {
            loadData()
            refetchStatistics()
          }}
          className="dashboard-retry-button"
        >
          Réessayer
        </button>
      </div>
    )
  }

  if (!user) {
    return null
  }

  return (
    <div className="dashboard">
      <div className="dashboard-header">
        <h1>Bienvenue, {user.firstName}</h1>
        <p className="dashboard-subtitle">Tableau de bord agent — {user.city}</p>
        {statistics && (
          <p className="dashboard-period">
            Période actuelle :{' '}
            {isFirstPeriod
              ? 'depuis le début'
              : `depuis le ${formatDate(statistics.period.startedAt)}`}
          </p>
        )}
        {statistics && (
          <p className="dashboard-period-hint">
            Les statistiques financières ci-dessous concernent uniquement la période actuelle.
          </p>
        )}
      </div>

      <div className="dashboard-stats">
        <div className="stat-card">
          <span className="stat-value">{stats.created}</span>
          <span className="stat-label">Transferts créés</span>
        </div>
        <div className="stat-card">
          <span className="stat-value">{stats.incoming}</span>
          <span className="stat-label">À traiter</span>
        </div>
        <div className="stat-card">
          <span className="stat-value">{stats.paid}</span>
          <span className="stat-label">Transferts payés</span>
        </div>
        <div className="stat-card">
          <span className="stat-value">{formatCurrency(statistics?.financial.totalCreated ?? 0)}</span>
          <span className="stat-label">Montant total encaissé</span>
        </div>
        <div className="stat-card">
          <span className="stat-value">{formatCurrency(statistics?.financial.totalPaid ?? 0)}</span>
          <span className="stat-label">Montant total décaissé</span>
        </div>
        <div className="stat-card">
          <span className="stat-value">{formatCurrency(statistics?.financial.feesGenerated ?? 0)}</span>
          <span className="stat-label">Frais générés</span>
        </div>
        <div className="stat-card stat-card--highlight">
          <span className="stat-value">{formatCurrency(statistics?.financial.currentBalance ?? 0)}</span>
          <span className="stat-label">Solde opérationnel</span>
        </div>
      </div>

      <section className="dashboard-section">
        <h2>Activité récente</h2>
        {recentActivity.length === 0 ? (
          <div className="dashboard-empty">
            <p>Aucune activité pour le moment.</p>
          </div>
        ) : (
          <div className="dashboard-activity">
            {recentActivity.map((item) => (
              <div key={item.id} className="activity-card">
                <div className="activity-header">
                  <span className="activity-reference">{item.reference}</span>
                  <TransferStatusBadge status={item.status} />
                </div>
                <div className="activity-body">
                  <p className="activity-label">{item.label}</p>
                  <p className="activity-details">
                    Vers {item.recipientName} — {item.destinationCity}
                  </p>
                  <p className="activity-amount">{formatCurrency(item.amount)}</p>
                  <p className="activity-date">{formatDate(item.createdAt)}</p>
                </div>
              </div>
            ))}
          </div>
        )}
      </section>
    </div>
  )
}

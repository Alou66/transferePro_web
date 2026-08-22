import { useState, useEffect, useCallback } from 'react'
import { useAuth } from '../../auth/hooks/useAuth'
import { transferService } from '../../transfers/services/transferService'
import { TransferStatus } from '../../../types/index'
import TransferStatusBadge from '../../transfers/components/TransferStatusBadge'
import { formatCurrency } from '../../../shared/utils/formatCurrency'
import { formatDate } from '../../../shared/utils/formatDate'
import './AgentDashboard.css'

interface DashboardStats {
  created: number
  incoming: number
  paid: number
  totalSent: number
  totalCollected: number
}

interface RecentActivity {
  id: string
  reference: string
  receiverName: string
  destinationCity: string
  amount: number
  status: TransferStatus
  createdAt: string
  label: string
}

export default function AgentHomePage() {
  const { user } = useAuth()
  const [stats, setStats] = useState<DashboardStats>({
    created: 0,
    incoming: 0,
    paid: 0,
    totalSent: 0,
    totalCollected: 0,
  })
  const [recentActivity, setRecentActivity] = useState<RecentActivity[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const loadData = useCallback(async () => {
    if (!user) return

    setLoading(true)
    setError(null)

    try {
      const [created, incoming, paid, all] = await Promise.all([
        transferService.getCreatedByAgent(user.id),
        transferService.getIncomingForAgent(user.id),
        transferService.getPaidByAgent(user.id),
        transferService.getAllForAgent(user.id),
      ])

      const totalSent = created.reduce((sum, t) => sum + t.amount, 0)
      const totalCollected = incoming
        .filter((t) => t.status === TransferStatus.PAID)
        .reduce((sum, t) => sum + t.amount, 0)

      setStats({
        created: created.length,
        incoming: incoming.filter(
          (t) => t.status === TransferStatus.CREATED || t.status === TransferStatus.READY_FOR_PAYMENT,
        ).length,
        paid: paid.length,
        totalSent,
        totalCollected,
      })

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
          receiverName: transfer.receiverName,
          destinationCity: transfer.destinationCity,
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

  if (loading) {
    return (
      <div className="dashboard-loading">
        <div className="dashboard-loading-spinner" />
        <p>Chargement du tableau de bord...</p>
      </div>
    )
  }

  if (error) {
    return (
      <div className="dashboard-error">
        <p>{error}</p>
        <button onClick={loadData} className="dashboard-retry-button">
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
          <span className="stat-value">{formatCurrency(stats.totalSent)}</span>
          <span className="stat-label">Montant total envoyé</span>
        </div>
        <div className="stat-card">
          <span className="stat-value">{formatCurrency(stats.totalCollected)}</span>
          <span className="stat-label">Montant total encaissé</span>
        </div>
        <div className="stat-card">
          <span className="stat-value">{formatCurrency(stats.totalCollected - stats.totalSent)}</span>
          <span className="stat-label">Différence encaissé / envoyé</span>
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
                    Vers {item.receiverName} — {item.destinationCity}
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

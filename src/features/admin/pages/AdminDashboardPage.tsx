import { useState, useEffect, useMemo } from 'react'
import { useAuth } from '../../auth/hooks/useAuth'
import { agentService } from '../../agents/services/agentService'
import { transferService } from '../../transfers/services/transferService'
import { UserRole, UserStatus, TransferStatus, type Agent, type Transfer } from '../../../types/index'
import TransferStatusBadge from '../../transfers/components/TransferStatusBadge'
import { formatCurrency } from '../../../shared/utils/formatCurrency'
import { formatDate } from '../../../shared/utils/formatDate'
import './AdminDashboardPage.css'

interface AgentStats {
  total: number
  active: number
  pending: number
  blocked: number
}

interface TransferStats {
  total: number
  toProcess: number
  paid: number
  cancelled: number
  totalAmount: number
}

interface RecentTransfer {
  id: string
  reference: string
  senderName: string
  receiverName: string
  destinationCity: string
  amount: number
  status: TransferStatus
  createdAt: string
}

export default function AdminDashboardPage() {
  const { user } = useAuth()
  const [agents, setAgents] = useState<Agent[]>([])
  const [transfers, setTransfers] = useState<Transfer[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [refreshing, setRefreshing] = useState(false)

  const loadData = async () => {
    setLoading(true)
    setError(null)

    try {
      const [agentsData, transfersData] = await Promise.all([
        agentService.getAll(),
        transferService.getAll(),
      ])
      setAgents(agentsData)
      setTransfers(transfersData)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Impossible de charger les données du tableau de bord.')
    } finally {
      setLoading(false)
      setRefreshing(false)
    }
  }

  useEffect(() => {
    // oxlint-disable-next-line react-hooks/set-state-in-effect
    loadData()
  }, [])

  const agentStats = useMemo<AgentStats>(() => {
    const agentsOnly = agents.filter((a) => a.role === UserRole.AGENT)
    return {
      total: agentsOnly.length,
      active: agentsOnly.filter((a) => a.status === UserStatus.ACTIVE).length,
      pending: agentsOnly.filter((a) => a.status === UserStatus.PENDING).length,
      blocked: agentsOnly.filter((a) => a.status === UserStatus.BLOCKED).length,
    }
  }, [agents])

  const transferStats = useMemo<TransferStats>(() => {
    const toProcess = transfers.filter(
      (t) => t.status === TransferStatus.CREATED || t.status === TransferStatus.READY_FOR_PAYMENT,
    ).length
    const paid = transfers.filter((t) => t.status === TransferStatus.PAID).length
    const cancelled = transfers.filter((t) => t.status === TransferStatus.CANCELLED).length
    const totalAmount = transfers
      .filter((t) => t.status !== TransferStatus.CANCELLED)
      .reduce((sum, t) => sum + t.amount, 0)

    return {
      total: transfers.length,
      toProcess,
      paid,
      cancelled,
      totalAmount,
    }
  }, [transfers])

  const recentTransfers = useMemo<RecentTransfer[]>(() => {
    return [...transfers]
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
      .slice(0, 5)
      .map((t) => ({
        id: t.id,
        reference: t.reference,
        senderName: t.senderName,
        receiverName: t.receiverName,
        destinationCity: t.destinationCity,
        amount: t.amount,
        status: t.status,
        createdAt: t.createdAt,
      }))
  }, [transfers])

  const pendingAgents = useMemo<Agent[]>(() => {
    return agents
      .filter((a) => a.role === UserRole.AGENT && a.status === UserStatus.PENDING)
      .slice(0, 5)
  }, [agents])

  const getTransferLabel = (status: TransferStatus): string => {
    switch (status) {
      case TransferStatus.CREATED:
        return 'Transfert créé'
      case TransferStatus.READY_FOR_PAYMENT:
        return 'Code vérifié'
      case TransferStatus.PAID:
        return 'Transfert payé'
      case TransferStatus.CANCELLED:
        return 'Transfert annulé'
    }
  }

  const handleRefresh = () => {
    setRefreshing(true)
    loadData()
  }

  if (loading) {
    return (
      <div className="admin-dashboard-page">
        <div className="admin-dashboard-loading">
          <div className="admin-loading-spinner" />
          <p>Chargement du tableau de bord...</p>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="admin-dashboard-page">
        <div className="admin-dashboard-error">
          <p>{error}</p>
          <button onClick={loadData} className="admin-retry-button">
            Réessayer
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="admin-dashboard-page">
      <div className="admin-dashboard-header">
        <div>
          <h1>Tableau de bord</h1>
          <p className="admin-dashboard-subtitle">Bienvenue, {user?.firstName}</p>
        </div>
        <button
          onClick={handleRefresh}
          disabled={refreshing || loading}
          className="admin-refresh-button"
        >
          {refreshing ? 'Actualisation...' : 'Actualiser'}
        </button>
      </div>

      <section className="admin-dashboard-section">
        <h2>Agents</h2>
        <div className="admin-stats-grid">
          <div className="admin-stat-card">
            <span className="admin-stat-value">{agentStats.total}</span>
            <span className="admin-stat-label">Total agents</span>
          </div>
          <div className="admin-stat-card">
            <span className="admin-stat-value">{agentStats.active}</span>
            <span className="admin-stat-label">Actifs</span>
          </div>
          <div className="admin-stat-card">
            <span className="admin-stat-value">{agentStats.pending}</span>
            <span className="admin-stat-label">En attente</span>
          </div>
          <div className="admin-stat-card">
            <span className="admin-stat-value">{agentStats.blocked}</span>
            <span className="admin-stat-label">Bloqués</span>
          </div>
        </div>
      </section>

      <section className="admin-dashboard-section">
        <h2>Transferts</h2>
        <div className="admin-stats-grid">
          <div className="admin-stat-card">
            <span className="admin-stat-value">{transferStats.total}</span>
            <span className="admin-stat-label">Total</span>
          </div>
          <div className="admin-stat-card">
            <span className="admin-stat-value">{transferStats.toProcess}</span>
            <span className="admin-stat-label">À traiter</span>
          </div>
          <div className="admin-stat-card">
            <span className="admin-stat-value">{transferStats.paid}</span>
            <span className="admin-stat-label">Payés</span>
          </div>
          <div className="admin-stat-card">
            <span className="admin-stat-value">{transferStats.cancelled}</span>
            <span className="admin-stat-label">Annulés</span>
          </div>
          <div className="admin-stat-card admin-stat-card--highlight">
            <span className="admin-stat-value">{formatCurrency(transferStats.totalAmount)}</span>
            <span className="admin-stat-label">Montant total transféré</span>
          </div>
        </div>
      </section>

      <section className="admin-dashboard-section">
        <div className="admin-section-header">
          <h2>Agents en attente</h2>
          <a href="/admin/agents" className="admin-link">Gérer les agents</a>
        </div>
        {pendingAgents.length === 0 ? (
          <div className="admin-empty-card">
            <p>Aucun agent en attente de validation.</p>
          </div>
        ) : (
          <div className="admin-pending-list">
            {pendingAgents.map((agent) => (
              <div key={agent.id} className="admin-pending-card">
                <div className="admin-pending-info">
                  <span className="admin-pending-name">{agent.firstName} {agent.lastName}</span>
                  <span className="admin-pending-detail">{agent.email}</span>
                  <span className="admin-pending-detail">{agent.phone}</span>
                  <span className="admin-pending-detail">{agent.city}</span>
                </div>
                <span className="admin-pending-date">
                  Inscrit le {formatDate(agent.createdAt)}
                </span>
              </div>
            ))}
          </div>
        )}
      </section>

      <section className="admin-dashboard-section">
        <h2>Activité récente</h2>
        {recentTransfers.length === 0 ? (
          <div className="admin-empty-card">
            <p>Aucune activité pour le moment.</p>
          </div>
        ) : (
          <div className="admin-recent-list">
            {recentTransfers.map((transfer) => (
              <div key={transfer.id} className="admin-recent-card">
                <div className="admin-recent-header">
                  <span className="admin-recent-reference">{transfer.reference}</span>
                  <TransferStatusBadge status={transfer.status} />
                </div>
                <div className="admin-recent-body">
                  <p className="admin-recent-label">{getTransferLabel(transfer.status)}</p>
                  <p className="admin-recent-route">
                    {transfer.senderName} → {transfer.receiverName} ({transfer.destinationCity})
                  </p>
                  <div className="admin-recent-footer">
                    <span className="admin-recent-amount">{formatCurrency(transfer.amount)}</span>
                    <span className="admin-recent-date">{formatDate(transfer.createdAt)}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </section>
    </div>
  )
}

import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAgents } from '../../agents/hooks/useAgents'
import { useCities } from '../../cities/hooks/useCities'
import { UserRole, UserStatus } from '../../../types/index'
import { formatDate } from '../../../shared/utils/formatDate'
import './AdminAgentsPage.css'

const STATUS_FILTER_OPTIONS = [
  { value: 'ALL', label: 'Tous les statuts' },
  { value: UserStatus.PENDING, label: 'En attente' },
  { value: UserStatus.ACTIVE, label: 'Actif' },
  { value: UserStatus.BLOCKED, label: 'Bloqué' },
  { value: UserStatus.REFUSED, label: 'Refusé' },
]

interface AgentRow {
  id: string
  firstName: string
  lastName: string
  email: string
  phone: string
  city: string
  role: UserRole
  status: UserStatus
  createdAt: string
  updatedAt: string
}

export default function AdminAgentsPage() {
  const navigate = useNavigate()
  const [search, setSearch] = useState('')
  const [cityFilter, setCityFilter] = useState<string>('ALL')
  const [statusFilter, setStatusFilter] = useState<string>('ALL')

  const {
    data: agentsData = [],
    isLoading: agentsLoading,
    isFetching: agentsFetching,
    error: agentsError,
    refetch: refetchAgents,
  } = useAgents()
  const {
    data: cities = [],
    isLoading: citiesLoading,
    isFetching: citiesFetching,
    error: citiesError,
    refetch: refetchCities,
  } = useCities()

  const agents: AgentRow[] = agentsData.filter((a) => a.role === UserRole.AGENT)
  const loading = agentsLoading || citiesLoading
  const refreshing = (agentsFetching || citiesFetching) && !loading
  const error = agentsError || citiesError ? 'Impossible de charger les agents.' : null

  const loadData = () => {
    refetchAgents()
    refetchCities()
  }

  const pendingCount = agents.filter((a) => a.status === UserStatus.PENDING).length

  const filteredAgents = agents.filter((agent) => {
    if (cityFilter !== 'ALL' && agent.city !== cityFilter) {
      return false
    }
    if (statusFilter !== 'ALL' && agent.status !== statusFilter) {
      return false
    }
    if (search.trim()) {
      const query = search.trim().toLowerCase()
      const fullName = `${agent.firstName} ${agent.lastName}`.toLowerCase()
      return (
        fullName.includes(query) ||
        agent.email.toLowerCase().includes(query) ||
        agent.phone.includes(query)
      )
    }
    return true
  })

  const handleRefresh = () => {
    loadData()
  }

  const cityFilterOptions = [
    { value: 'ALL', label: 'Toutes les villes' },
    ...cities.map((city) => ({
      value: city.name,
      label: city.name,
    })),
  ]

  return (
    <div className="admin-agents-page">
      <div className="admin-agents-header">
        <div>
          <h1>Gestion des agents</h1>
          <p className="admin-agents-subtitle">
            {pendingCount > 0 && (
              <span className="admin-pending-badge">
                {pendingCount} en attente
              </span>
            )}
            {' '}{agents.length} agent{agents.length !== 1 ? 's' : ''} au total
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

      <div className="admin-agents-filters">
        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Rechercher par nom, email ou téléphone..."
          className="admin-search-input"
        />
        <select
          value={cityFilter}
          onChange={(e) => setCityFilter(e.target.value)}
          className="admin-filter-select"
        >
          {cityFilterOptions.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>
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
      </div>

      {loading && (
        <div className="admin-agents-loading">
          <div className="admin-loading-spinner" />
          <p>Chargement des agents...</p>
        </div>
      )}

      {error && !loading && (
        <div className="admin-agents-error">
          <p>{error}</p>
          <button onClick={loadData} className="admin-retry-button">
            Réessayer
          </button>
        </div>
      )}

      {!loading && !error && filteredAgents.length === 0 && (
        <div className="admin-agents-empty">
          <p>Aucun agent ne correspond à votre recherche.</p>
        </div>
      )}

      {!loading && !error && filteredAgents.length > 0 && (
        <div className="admin-agents-list">
          {filteredAgents.map((agent) => (
            <div key={agent.id} className="admin-agent-card">
              <div className="admin-agent-info">
                <div className="admin-agent-name">
                  {agent.firstName} {agent.lastName}
                </div>
                <div className="admin-agent-details">
                  <span>{agent.email}</span>
                  <span>{agent.phone}</span>
                  <span>{agent.city}</span>
                </div>
                <div className="admin-agent-meta">
                  <AgentStatusBadge status={agent.status} />
                  <span className="admin-agent-date">
                    Créé le {formatDate(agent.createdAt)}
                  </span>
                </div>
              </div>
              <button
                onClick={() => navigate(`/admin/agents/${agent.id}`)}
                className="admin-agent-details-button"
              >
                Détails
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

function AgentStatusBadge({ status }: { status: UserStatus }) {
  const labels: Record<UserStatus, string> = {
    [UserStatus.PENDING]: 'En attente',
    [UserStatus.ACTIVE]: 'Actif',
    [UserStatus.BLOCKED]: 'Bloqué',
    [UserStatus.REFUSED]: 'Refusé',
  }

  return (
    <span className={`agent-status-badge agent-status-badge--${status.toLowerCase()}`}>
      {labels[status]}
    </span>
  )
}

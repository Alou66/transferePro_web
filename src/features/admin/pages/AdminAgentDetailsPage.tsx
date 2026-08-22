import { useState, useEffect } from 'react'
import { useParams, NavLink } from 'react-router-dom'
import { agentService } from '../../agents/services/agentService'
import { UserRole, UserStatus } from '../../../types/index'
import { formatDate } from '../../../shared/utils/formatDate'
import BackButton from '../../../components/common/BackButton'
import './AdminAgentDetailsPage.css'

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

export default function AdminAgentDetailsPage() {
  const { agentId } = useParams<{ agentId: string }>()
  const [agent, setAgent] = useState<AgentRow | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [actionLoading, setActionLoading] = useState(false)
  const [actionError, setActionError] = useState<string | null>(null)
  const [successMessage, setSuccessMessage] = useState<string | null>(null)
  const [confirmAction, setConfirmAction] = useState<{
    status: UserStatus
    label: string
    message: string
  } | null>(null)

  useEffect(() => {
    async function load() {
      if (!agentId) {
        setError('Agent introuvable.')
        setLoading(false)
        return
      }

      try {
        const data = await agentService.getById(agentId)
        setAgent(data)
      } catch {
        setError('Agent introuvable.')
      } finally {
        setLoading(false)
      }
    }

    load()
  }, [agentId])

  const handleStatusChange = async () => {
    if (!agent || !confirmAction) return

    setActionLoading(true)
    setActionError(null)
    setSuccessMessage(null)

    try {
      const updated = await agentService.updateStatus(agent.id, confirmAction.status)
      setAgent(updated)
      setSuccessMessage(`Statut mis à jour vers "${getStatusLabel(confirmAction.status)}" avec succès.`)
      setConfirmAction(null)
    } catch (err) {
      setActionError(err instanceof Error ? err.message : 'Une erreur est survenue lors de la mise à jour.')
    } finally {
      setActionLoading(false)
    }
  }

  if (loading) {
    return (
      <div className="admin-agent-details-page">
        <div className="admin-agent-details-loading">
          <div className="admin-loading-spinner" />
          <p>Chargement...</p>
        </div>
      </div>
    )
  }

  if (error || !agent) {
    return (
      <div className="admin-agent-details-page">
        <div className="admin-agent-details-error">
          <p>{error || 'Agent introuvable.'}</p>
          <NavLink to="/admin/agents" className="admin-back-link">
            Retour à la liste
          </NavLink>
        </div>
      </div>
    )
  }

  const isPending = agent.status === UserStatus.PENDING
  const isActive = agent.status === UserStatus.ACTIVE
  const isBlocked = agent.status === UserStatus.BLOCKED
  const isRefused = agent.status === UserStatus.REFUSED
  const isAdmin = agent.role === UserRole.ADMIN

  if (isAdmin) {
    return (
      <div className="admin-agent-details-page">
        <BackButton to="/admin/agents" />
        <div className="admin-agent-details-card">
          <div className="admin-agent-details-header">
            <div>
              <h1>Détails de l'utilisateur</h1>
              <p className="admin-agent-details-reference">
                {agent.firstName} {agent.lastName}
              </p>
            </div>
            <AgentStatusBadge status={agent.status} />
          </div>

          <div className="admin-agent-details-sections">
            <div className="admin-agent-details-section">
              <h2>Informations personnelles</h2>
              <p><strong>Prénom :</strong> {agent.firstName}</p>
              <p><strong>Nom :</strong> {agent.lastName}</p>
              <p><strong>Email :</strong> {agent.email}</p>
              <p><strong>Téléphone :</strong> {agent.phone}</p>
            </div>

            <div className="admin-agent-details-section">
              <h2>Affectation</h2>
              <p><strong>Ville :</strong> {agent.city}</p>
              <p><strong>Rôle :</strong> Administrateur</p>
            </div>

            <div className="admin-agent-details-section">
              <h2>Statut</h2>
              <p><strong>Statut actuel :</strong> <AgentStatusBadge status={agent.status} /></p>
              <p><strong>Date de création :</strong> {formatDate(agent.createdAt)}</p>
              <p><strong>Dernière modification :</strong> {formatDate(agent.updatedAt)}</p>
            </div>
          </div>

          <div className="admin-agent-details-actions">
            <p className="admin-agent-cannot-manage">
              Cet utilisateur n'est pas un agent. La gestion des agents concerne uniquement les utilisateurs ayant le rôle Agent.
            </p>
            <NavLink to="/admin/agents" className="admin-back-link">
              Retour à la liste des agents
            </NavLink>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="admin-agent-details-page">
      <BackButton to="/admin/agents" />
      <div className="admin-agent-details-card">
        <div className="admin-agent-details-header">
          <div>
            <h1>Détails de l'agent</h1>
            <p className="admin-agent-details-reference">
              {agent.firstName} {agent.lastName}
            </p>
          </div>
          <AgentStatusBadge status={agent.status} />
        </div>

        <div className="admin-agent-details-sections">
          <div className="admin-agent-details-section">
            <h2>Informations personnelles</h2>
            <p><strong>Prénom :</strong> {agent.firstName}</p>
            <p><strong>Nom :</strong> {agent.lastName}</p>
            <p><strong>Email :</strong> {agent.email}</p>
            <p><strong>Téléphone :</strong> {agent.phone}</p>
          </div>

          <div className="admin-agent-details-section">
            <h2>Affectation</h2>
            <p><strong>Ville :</strong> {agent.city}</p>
            <p><strong>Rôle :</strong> Agent</p>
          </div>

          <div className="admin-agent-details-section">
            <h2>Statut</h2>
            <p><strong>Statut actuel :</strong> <AgentStatusBadge status={agent.status} /></p>
            <p><strong>Date de création :</strong> {formatDate(agent.createdAt)}</p>
            <p><strong>Dernière modification :</strong> {formatDate(agent.updatedAt)}</p>
          </div>
        </div>

        <div className="admin-agent-details-actions">
          {isPending && (
            <>
              <button
                onClick={() =>
                  setConfirmAction({
                    status: UserStatus.ACTIVE,
                    label: 'Activer',
                    message: `Voulez-vous vraiment activer le compte de ${agent.firstName} ${agent.lastName} ?`,
                  })
                }
                className="admin-action-button success"
                disabled={actionLoading}
              >
                Activer le compte
              </button>
              <button
                onClick={() =>
                  setConfirmAction({
                    status: UserStatus.REFUSED,
                    label: 'Refuser',
                    message: `Voulez-vous vraiment refuser le compte de ${agent.firstName} ${agent.lastName} ?`,
                  })
                }
                className="admin-action-button danger"
                disabled={actionLoading}
              >
                Refuser le compte
              </button>
            </>
          )}

          {isActive && (
            <button
              onClick={() =>
                setConfirmAction({
                  status: UserStatus.BLOCKED,
                  label: 'Bloquer',
                  message: `Voulez-vous vraiment bloquer le compte de ${agent.firstName} ${agent.lastName} ?`,
                })
              }
              className="admin-action-button danger"
              disabled={actionLoading}
            >
              Bloquer le compte
            </button>
          )}

          {isBlocked && (
            <button
              onClick={() =>
                setConfirmAction({
                  status: UserStatus.ACTIVE,
                  label: 'Réactiver',
                  message: `Voulez-vous vraiment réactiver le compte de ${agent.firstName} ${agent.lastName} ?`,
                })
              }
              className="admin-action-button success"
              disabled={actionLoading}
            >
              Réactiver le compte
            </button>
          )}

          {isRefused && (
            <button
              onClick={() =>
                setConfirmAction({
                  status: UserStatus.ACTIVE,
                  label: 'Réactiver',
                  message: `Voulez-vous vraiment réactiver le compte de ${agent.firstName} ${agent.lastName} ?`,
                })
              }
              className="admin-action-button success"
              disabled={actionLoading}
            >
              Réactiver le compte
            </button>
          )}
        </div>

        {actionError && <div className="admin-agent-details-error-message">{actionError}</div>}
        {successMessage && <div className="admin-agent-details-success-message">{successMessage}</div>}
      </div>

      {confirmAction && (
        <div className="admin-confirm-overlay">
          <div className="admin-confirm-modal">
            <h2>Confirmer l'action</h2>
            <p>{confirmAction.message}</p>
            <div className="admin-confirm-actions">
              <button
                onClick={() => setConfirmAction(null)}
                className="admin-confirm-button secondary"
                disabled={actionLoading}
              >
                Annuler
              </button>
              <button
                onClick={handleStatusChange}
                className="admin-confirm-button primary"
                disabled={actionLoading}
              >
                {actionLoading ? 'Traitement...' : confirmAction.label}
              </button>
            </div>
          </div>
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

function getStatusLabel(status: UserStatus): string {
  const labels: Record<UserStatus, string> = {
    [UserStatus.PENDING]: 'En attente',
    [UserStatus.ACTIVE]: 'Actif',
    [UserStatus.BLOCKED]: 'Bloqué',
    [UserStatus.REFUSED]: 'Refusé',
  }
  return labels[status]
}

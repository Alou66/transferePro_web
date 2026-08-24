import { useState, useEffect } from 'react'
import { useParams, NavLink } from 'react-router-dom'
import { useAuth } from '../../auth/hooks/useAuth'
import { agentService } from '../../agents/services/agentService'
import { transferService } from '../../transfers/services/transferService'
import { calculateAgentStats, getCurrentCollectionPeriod } from '../../transfers/utils/agentStatsUtils'
import { create as createCashCollection, getByAgentId } from '../../transfers/services/cashCollectionService'
import { UserRole, UserStatus } from '../../../types/index'
import { formatCurrency } from '../../../shared/utils/formatCurrency'
import { formatDate } from '../../../shared/utils/formatDate'
import BackButton from '../../../components/common/BackButton'
import './AdminAgentDetailsPage.css'

interface CollectionRow {
  id: string
  amount: number
  collectedAt: string
  createdBy: string
  notes?: string
  createdAt: string
  creatorName?: string
}

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

interface AgentStats {
  totalCollected: number
  totalDebited: number
  feesGenerated: number
  operationalBalance: number
}

interface CollectionPeriod {
  agentId: string
  startDate: string | null
  endDate: string
  lastCollection: { id: string; amount: number; collectedAt: string; createdBy: string; notes?: string; createdAt: string } | null
  isFirstPeriod: boolean
}

export default function AdminAgentDetailsPage() {
  const { agentId } = useParams<{ agentId: string }>()
  const { user: adminUser } = useAuth()
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
  const [agentStats, setAgentStats] = useState<AgentStats | null>(null)
  const [collectionPeriod, setCollectionPeriod] = useState<CollectionPeriod | null>(null)
  const [collections, setCollections] = useState<CollectionRow[]>([])
  const [collectionsLoading, setCollectionsLoading] = useState(false)
  const [statsLoading, setStatsLoading] = useState(false)
  const [showCollectionModal, setShowCollectionModal] = useState(false)
  const [collectionAmount, setCollectionAmount] = useState('')
  const [collectionNotes, setCollectionNotes] = useState('')
  const [collecting, setCollecting] = useState(false)
  const [collectError, setCollectError] = useState<string | null>(null)

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

  useEffect(() => {
    if (showCollectionModal || confirmAction) {
      document.body.style.overflow = 'hidden'
    } else {
      document.body.style.overflow = ''
    }
    return () => {
      document.body.style.overflow = ''
    }
  }, [showCollectionModal, confirmAction])

  useEffect(() => {
    async function loadStats() {
      if (!agentId) return

      setStatsLoading(true)
      try {
        const [transfers, period] = await Promise.all([
          transferService.getAllForAgent(agentId),
          getCurrentCollectionPeriod(agentId),
        ])
        const stats = calculateAgentStats(transfers, agentId, period.startDate ?? undefined)
        setAgentStats(stats)
        setCollectionPeriod(period)
      } catch {
        // silent fail for stats
      } finally {
        setStatsLoading(false)
      }
    }

    loadStats()
  }, [agentId])

  useEffect(() => {
    async function loadCollections() {
      if (!agentId) return

      setCollectionsLoading(true)
      try {
        const items = await getByAgentId(agentId)
        const sorted = items
          .slice()
          .sort((a, b) => new Date(b.collectedAt).getTime() - new Date(a.collectedAt).getTime())

        const creatorIds = Array.from(new Set(sorted.map((c) => c.createdBy).filter(Boolean)))
        const creatorMap = new Map<string, string>()
        await Promise.all(
          creatorIds.map(async (id) => {
            try {
              const admin = await agentService.getById(id)
              creatorMap.set(id, `${admin.firstName} ${admin.lastName}`)
            } catch {
              creatorMap.set(id, 'Administrateur inconnu')
            }
          }),
        )

        const rows: CollectionRow[] = sorted.map((c) => ({
          id: c.id,
          amount: c.amount,
          collectedAt: c.collectedAt,
          createdBy: c.createdBy,
          notes: c.notes,
          createdAt: c.createdAt,
          creatorName: creatorMap.get(c.createdBy) || 'Administrateur inconnu',
        }))

        setCollections(rows)
      } catch {
        // silent fail for collections
      } finally {
        setCollectionsLoading(false)
      }
    }

    loadCollections()
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

  const handleCollect = async () => {
    if (!agent || !adminUser || !agentStats || !agentId) return

    const amount = Number(collectionAmount)
    if (Number.isNaN(amount) || amount <= 0) {
      setCollectError('Le montant doit être supérieur à 0.')
      return
    }

    if (amount > agentStats.operationalBalance) {
      setCollectError('Le montant ne peut pas dépasser le solde opérationnel actuel.')
      return
    }

    setCollecting(true)
    setCollectError(null)

    try {
      await createCashCollection({
        agentId: agent.id,
        amount,
        collectedAt: new Date().toISOString(),
        createdBy: adminUser.id,
        notes: collectionNotes.trim() || undefined,
      })

      setShowCollectionModal(false)
      setCollectionAmount('')
      setCollectionNotes('')
      setSuccessMessage(`Récupération de ${formatCurrency(amount)} enregistrée avec succès.`)

      const [transfers, updatedPeriod] = await Promise.all([
        transferService.getAllForAgent(agentId),
        getCurrentCollectionPeriod(agentId),
      ])
      const updatedStats = calculateAgentStats(transfers, agentId, updatedPeriod.startDate ?? undefined)
      setAgentStats(updatedStats)
      setCollectionPeriod(updatedPeriod)

      const updatedCollections = await getByAgentId(agentId)
      setCollections(
        updatedCollections
          .slice()
          .sort((a, b) => new Date(b.collectedAt).getTime() - new Date(a.collectedAt).getTime())
          .map((c) => ({
            id: c.id,
            amount: c.amount,
            collectedAt: c.collectedAt,
            createdBy: c.createdBy,
            notes: c.notes,
            createdAt: c.createdAt,
            creatorName: c.createdBy === adminUser?.id ? `${adminUser.firstName} ${adminUser.lastName}` : 'Administrateur inconnu',
          })),
      )
    } catch (err) {
      setCollectError(err instanceof Error ? err.message : 'Impossible d\'enregistrer la récupération.')
    } finally {
      setCollecting(false)
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

  const openCollectionModal = () => {
    if (!agentStats) return
    if (agentStats.operationalBalance <= 0) {
      setCollectError('Le solde opérationnel est nul ou négatif : aucune récupération possible.')
      return
    }
    setCollectError(null)
    setCollectionAmount('')
    setCollectionNotes('')
    setShowCollectionModal(true)
  }

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

        {statsLoading ? (
          <div className="admin-agent-stats-loading">
            <div className="admin-loading-spinner" />
            <p>Chargement des statistiques...</p>
          </div>
        ) : agentStats && collectionPeriod ? (
          <div className="admin-agent-collection-section">
            <h2>Situation financière actuelle</h2>
            <p className="admin-agent-period">
              Période : {collectionPeriod.isFirstPeriod ? 'Depuis le début' : `Depuis le ${formatDate(collectionPeriod.startDate!)}`}
            </p>
            <div className="admin-agent-stats-grid">
              <div className="admin-agent-stat-card">
                <span className="admin-agent-stat-value">{formatCurrency(agentStats.totalCollected)}</span>
                <span className="admin-agent-stat-label">Montant encaissé</span>
              </div>
              <div className="admin-agent-stat-card">
                <span className="admin-agent-stat-value">{formatCurrency(agentStats.totalDebited)}</span>
                <span className="admin-agent-stat-label">Montant décaissé</span>
              </div>
              <div className="admin-agent-stat-card">
                <span className="admin-agent-stat-value">{formatCurrency(agentStats.feesGenerated)}</span>
                <span className="admin-agent-stat-label">Frais générés</span>
              </div>
              <div className="admin-agent-stat-card admin-agent-stat-card--highlight">
                <span className="admin-agent-stat-value">{formatCurrency(agentStats.operationalBalance)}</span>
                <span className="admin-agent-stat-label">Solde opérationnel</span>
              </div>
            </div>
          </div>
        ) : null}

        <div className="admin-agent-collections-section">
          <h2>Historique des récupérations</h2>
          {collectionsLoading ? (
            <div className="admin-agent-stats-loading">
              <div className="admin-loading-spinner" />
              <p>Chargement de l'historique...</p>
            </div>
          ) : collections.length === 0 ? (
            <p className="admin-agent-collections-empty">
              Aucune récupération financière n'a encore été enregistrée pour cet agent.
            </p>
          ) : (
            <div className="admin-agent-collections-table-wrapper">
              <table className="admin-agent-collections-table">
                <thead>
                  <tr>
                    <th>Date</th>
                    <th>Montant</th>
                    <th>Effectuée par</th>
                    <th>Notes</th>
                  </tr>
                </thead>
                <tbody>
                  {collections.map((c) => (
                    <tr key={c.id}>
                      <td>{formatDate(c.collectedAt)}</td>
                      <td>{formatCurrency(c.amount)}</td>
                      <td>{c.creatorName}</td>
                      <td>{c.notes || '—'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
              <div className="admin-agent-collections-list">
                {collections.map((c) => (
                  <div key={c.id} className="admin-agent-collection-card">
                    <div className="admin-agent-collection-card-row">
                      <span className="admin-agent-collection-label">Date</span>
                      <span className="admin-agent-collection-value">{formatDate(c.collectedAt)}</span>
                    </div>
                    <div className="admin-agent-collection-card-row">
                      <span className="admin-agent-collection-label">Montant</span>
                      <span className="admin-agent-collection-value">{formatCurrency(c.amount)}</span>
                    </div>
                    <div className="admin-agent-collection-card-row">
                      <span className="admin-agent-collection-label">Effectuée par</span>
                      <span className="admin-agent-collection-value">{c.creatorName}</span>
                    </div>
                    <div className="admin-agent-collection-card-row">
                      <span className="admin-agent-collection-label">Notes</span>
                      <span className="admin-agent-collection-value">{c.notes || '—'}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
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
            <>
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
              <button
                onClick={openCollectionModal}
                className="admin-action-button primary"
                disabled={actionLoading || statsLoading}
              >
                Enregistrer une récupération
              </button>
            </>
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

      {showCollectionModal && agentStats && (
        <div className="admin-confirm-overlay">
          <div className="admin-confirm-modal">
            <h2>Enregistrer une récupération</h2>
            <p>
              Vous êtes sur le point d'enregistrer une récupération auprès de <strong>{agent.firstName} {agent.lastName}</strong>.
            </p>
            <div className="admin-collection-summary">
              <div className="admin-collection-summary-row">
                <span>Montant encaissé</span>
                <span>{formatCurrency(agentStats.totalCollected)}</span>
              </div>
              <div className="admin-collection-summary-row">
                <span>Montant décaissé</span>
                <span>{formatCurrency(agentStats.totalDebited)}</span>
              </div>
              <div className="admin-collection-summary-row">
                <span>Frais générés</span>
                <span>{formatCurrency(agentStats.feesGenerated)}</span>
              </div>
              <div className="admin-collection-summary-row admin-collection-summary-row--highlight">
                <span>Solde opérationnel</span>
                <span>{formatCurrency(agentStats.operationalBalance)}</span>
              </div>
            </div>
            <p className="admin-collection-warning">
              ⚠ Cette opération est définitive et clôturera la période financière actuelle. Une nouvelle période commencera après cette récupération.
            </p>
            <div className="form-group">
              <label htmlFor="collectionAmount">Montant récupéré (FCFA)</label>
              <input
                id="collectionAmount"
                type="number"
                value={collectionAmount}
                onChange={(e) => setCollectionAmount(e.target.value)}
                required
                min={1}
                max={agentStats.operationalBalance}
                step="1"
                placeholder={String(agentStats.operationalBalance)}
              />
            </div>
            <div className="form-group">
              <label htmlFor="collectionNotes">Notes (optionnel)</label>
              <input
                id="collectionNotes"
                type="text"
                value={collectionNotes}
                onChange={(e) => setCollectionNotes(e.target.value)}
                placeholder="Ex: Récupération du 23 août 2026"
              />
            </div>
            {collectError && <div className="admin-agent-details-error-message">{collectError}</div>}
            <div className="admin-confirm-actions">
              <button
                onClick={() => {
                  setShowCollectionModal(false)
                  setCollectionAmount('')
                  setCollectionNotes('')
                  setCollectError(null)
                }}
                className="admin-confirm-button secondary"
                disabled={collecting}
              >
                Annuler
              </button>
              <button
                onClick={handleCollect}
                className="admin-confirm-button primary"
                disabled={collecting}
              >
                {collecting ? 'Enregistrement...' : 'Confirmer la récupération'}
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

import { useState, useEffect } from 'react'
import { cityService } from '../../cities/services/cityService'
import type { CityModel } from '../../cities/services/cityService'
import './AdminCitiesPage.css'

export default function AdminCitiesPage() {
  const [cities, setCities] = useState<CityModel[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [refreshing, setRefreshing] = useState(false)
  const [showCreateModal, setShowCreateModal] = useState(false)
  const [showConfirmModal, setShowConfirmModal] = useState<CityModel | null>(null)
  const [newCityName, setNewCityName] = useState('')
  const [actionLoading, setActionLoading] = useState(false)
  const [actionError, setActionError] = useState<string | null>(null)

  const loadData = async () => {
    setLoading(true)
    setError(null)

    try {
      const data = await cityService.getAll()
      setCities(data)
    } catch {
      setError('Impossible de charger les villes.')
    } finally {
      setLoading(false)
      setRefreshing(false)
    }
  }

  useEffect(() => {
    // oxlint-disable-next-line react-hooks/set-state-in-effect
    loadData()
  }, [])

  const handleRefresh = () => {
    setRefreshing(true)
    loadData()
  }

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault()
    setActionLoading(true)
    setActionError(null)

    try {
      await cityService.create({ name: newCityName })
      setNewCityName('')
      setShowCreateModal(false)
      await loadData()
    } catch (err) {
      setActionError(err instanceof Error ? err.message : 'Impossible de créer la ville.')
    } finally {
      setActionLoading(false)
    }
  }

  const handleDeactivate = async () => {
    if (!showConfirmModal) return

    setActionLoading(true)
    setActionError(null)

    try {
      await cityService.deactivate(showConfirmModal.id)
      setShowConfirmModal(null)
      await loadData()
    } catch (err) {
      setActionError(err instanceof Error ? err.message : 'Impossible de désactiver la ville.')
    } finally {
      setActionLoading(false)
    }
  }

  const handleActivate = async (id: string) => {
    setActionLoading(true)
    setActionError(null)

    try {
      await cityService.activate(id)
      await loadData()
    } catch (err) {
      setActionError(err instanceof Error ? err.message : 'Impossible d\'activer la ville.')
    } finally {
      setActionLoading(false)
    }
  }

  return (
    <div className="admin-cities-page">
      <div className="admin-cities-header">
        <div>
          <h1>Gestion des villes</h1>
          <p className="admin-cities-subtitle">
            {cities.length} ville{cities.length !== 1 ? 's' : ''} au total
          </p>
        </div>
        <button
          onClick={() => setShowCreateModal(true)}
          className="admin-cities-create-button"
        >
          + Ajouter une ville
        </button>
        <button
          onClick={handleRefresh}
          disabled={refreshing || loading}
          className="admin-refresh-button"
        >
          {refreshing ? 'Actualisation...' : 'Actualiser'}
        </button>
      </div>

      {loading && (
        <div className="admin-cities-loading">
          <div className="admin-loading-spinner" />
          <p>Chargement des villes...</p>
        </div>
      )}

      {error && !loading && (
        <div className="admin-cities-error">
          <p>{error}</p>
          <button onClick={loadData} className="admin-retry-button">
            Réessayer
          </button>
        </div>
      )}

      {!loading && !error && cities.length === 0 && (
        <div className="admin-cities-empty">
          <p>Aucune ville enregistrée.</p>
        </div>
      )}

      {!loading && !error && cities.length > 0 && (
        <div className="admin-cities-list">
          {cities.map((city) => (
            <div key={city.id} className="admin-city-card">
              <div className="admin-city-info">
                <span className="admin-city-name">{city.name}</span>
                <div className="admin-city-meta">
                  <span className={`admin-city-status admin-city-status--${city.isActive ? 'active' : 'inactive'}`}>
                    {city.isActive ? 'Active' : 'Désactivée'}
                  </span>
                  <span className="admin-city-availability">
                    {city.isActive ? 'Disponible' : 'Indisponible'}
                  </span>
                </div>
                <span className="admin-city-date">
                  Créée le {new Date(city.createdAt).toLocaleDateString('fr-FR')}
                </span>
              </div>
              <div className="admin-city-actions">
                {city.isActive ? (
                  <button
                    onClick={() => setShowConfirmModal(city)}
                    className="admin-city-button danger"
                    disabled={actionLoading}
                  >
                    Désactiver
                  </button>
                ) : (
                  <button
                    onClick={() => handleActivate(city.id)}
                    className="admin-city-button primary"
                    disabled={actionLoading}
                  >
                    Activer
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {showCreateModal && (
        <div className="admin-modal-overlay">
          <div className="admin-modal">
            <h2>Ajouter une ville</h2>
            <form onSubmit={handleCreate}>
              <div className="form-group">
                <label htmlFor="cityName">Nom de la ville</label>
                <input
                  id="cityName"
                  type="text"
                  value={newCityName}
                  onChange={(e) => setNewCityName(e.target.value)}
                  required
                  minLength={2}
                  placeholder="Ex: Saint-Louis"
                />
              </div>
              {actionError && <div className="admin-modal-error">{actionError}</div>}
              <div className="admin-modal-actions">
                <button
                  type="button"
                  onClick={() => {
                    setShowCreateModal(false)
                    setNewCityName('')
                    setActionError(null)
                  }}
                  className="admin-modal-button secondary"
                  disabled={actionLoading}
                >
                  Annuler
                </button>
                <button
                  type="submit"
                  className="admin-modal-button primary"
                  disabled={actionLoading}
                >
                  {actionLoading ? 'Création...' : 'Créer'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {showConfirmModal && (
        <div className="admin-modal-overlay">
          <div className="admin-modal">
            <h2>Désactiver la ville</h2>
            <p>
              Voulez-vous vraiment désactiver la ville <strong>{showConfirmModal.name}</strong> ?
              Elle n'apparaîtra plus dans les inscriptions.
            </p>
            {actionError && <div className="admin-modal-error">{actionError}</div>}
            <div className="admin-modal-actions">
              <button
                onClick={() => {
                  setShowConfirmModal(null)
                  setActionError(null)
                }}
                className="admin-modal-button secondary"
                disabled={actionLoading}
              >
                Annuler
              </button>
              <button
                onClick={handleDeactivate}
                className="admin-modal-button danger"
                disabled={actionLoading}
              >
                {actionLoading ? 'Désactivation...' : 'Désactiver'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

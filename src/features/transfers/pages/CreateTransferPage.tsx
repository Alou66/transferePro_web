import { useState, useEffect, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../../auth/hooks/useAuth'
import { transferService } from '../services/transferService'
import { agentService } from '../../agents/services/agentService'
import { cityService } from '../../cities/services/cityService'
import type { CityModel } from '../../cities/services/cityService'
import { calculateTransferFee } from '../utils/calculateTransferFee'
import { formatCurrency } from '../../../shared/utils/formatCurrency'
import './CreateTransferPage.css'

const MIN_TRANSFER_AMOUNT = 1000

export default function CreateTransferPage() {
  const navigate = useNavigate()
  const { user } = useAuth()

  const [senderName, setSenderName] = useState('')
  const [senderPhone, setSenderPhone] = useState('')
  const [receiverName, setReceiverName] = useState('')
  const [receiverPhone, setReceiverPhone] = useState('')
  const [destinationCity, setDestinationCity] = useState('')
  const [amount, setAmount] = useState('')
  const [cities, setCities] = useState<CityModel[]>([])

  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [showCancelConfirm, setShowCancelConfirm] = useState(false)
  const [citiesLoading, setCitiesLoading] = useState(true)

  const numericAmount = Number(amount)
  const hasValidAmount = amount !== '' && !Number.isNaN(numericAmount) && numericAmount >= MIN_TRANSFER_AMOUNT
  const fee = hasValidAmount ? calculateTransferFee(numericAmount) : 0
  const totalAmount = hasValidAmount ? numericAmount + fee : 0

  const isFormValid =
    senderName.trim().length >= 2 &&
    senderPhone.trim().length >= 2 &&
    receiverName.trim().length >= 2 &&
    receiverPhone.trim().length >= 2 &&
    hasValidAmount &&
    destinationCity !== '' &&
    destinationCity !== user?.city

  const didSetDefaultCity = useRef(false)

  useEffect(() => {
    async function loadCities() {
      try {
        const data = await cityService.getAll()
        setCities(data)
        if (data.length > 0 && !didSetDefaultCity.current) {
          setDestinationCity(data[0].name)
          didSetDefaultCity.current = true
        }
      } catch {
        setError('Impossible de charger les villes.')
      } finally {
        setCitiesLoading(false)
      }
    }

    loadCities()
  }, [])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)

    if (!user) {
      return
    }

    if (destinationCity === user.city) {
      setError('La ville de destination doit être différente de votre ville.')
      return
    }

    const destinationAgent = await agentService.getActiveAgentByCity(destinationCity)
    if (!destinationAgent) {
      setError("Aucun agent actif n'est disponible dans cette ville pour le moment.")
      return
    }

    setLoading(true)

    try {
      const transfer = await transferService.create(
        {
          senderName: senderName.trim(),
          senderPhone: senderPhone.trim(),
          receiverName: receiverName.trim(),
          receiverPhone: receiverPhone.trim(),
          destinationCity,
          amount: numericAmount,
          fee,
        },
        user.id,
      )

      navigate(`/agent/transfers/${transfer.id}/success`)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Une erreur est survenue lors de la création du transfert.')
    } finally {
      setLoading(false)
    }
  }

  const handleCancel = () => {
    setShowCancelConfirm(true)
  }

  const confirmCancel = () => {
    setShowCancelConfirm(false)
    navigate('/agent')
  }

  return (
    <div className="create-transfer-page">
      <div className="create-transfer-card">
        <h1>Nouveau transfert</h1>
        <p className="create-transfer-subtitle">Enregistrez les informations du transfert.</p>

        {error && <div className="create-transfer-error">{error}</div>}

        <form onSubmit={handleSubmit} className="create-transfer-form">
          <fieldset className="create-transfer-fieldset">
            <legend className="create-transfer-legend">Informations de l'expéditeur</legend>
            <div className="form-group">
              <label htmlFor="senderName">Nom complet de l'expéditeur</label>
              <input
                id="senderName"
                type="text"
                value={senderName}
                onChange={(e) => setSenderName(e.target.value)}
                required
                minLength={2}
                placeholder="Mamadou Ndiaye"
              />
            </div>
            <div className="form-group">
              <label htmlFor="senderPhone">Téléphone de l'expéditeur</label>
              <input
                id="senderPhone"
                type="tel"
                value={senderPhone}
                onChange={(e) => setSenderPhone(e.target.value)}
                required
                minLength={2}
                placeholder="77 123 45 67"
              />
            </div>
          </fieldset>

          <fieldset className="create-transfer-fieldset">
            <legend className="create-transfer-legend">Informations du bénéficiaire</legend>
            <div className="form-group">
              <label htmlFor="receiverName">Nom complet du bénéficiaire</label>
              <input
                id="receiverName"
                type="text"
                value={receiverName}
                onChange={(e) => setReceiverName(e.target.value)}
                required
                minLength={2}
                placeholder="Ibrahima Camara"
              />
            </div>
            <div className="form-group">
              <label htmlFor="receiverPhone">Téléphone du bénéficiaire</label>
              <input
                id="receiverPhone"
                type="tel"
                value={receiverPhone}
                onChange={(e) => setReceiverPhone(e.target.value)}
                required
                minLength={2}
                placeholder="620 123 456"
              />
            </div>
          </fieldset>

          <fieldset className="create-transfer-fieldset">
            <legend className="create-transfer-legend">Destination</legend>
            <div className="form-group">
              <label htmlFor="originCity">Ville de départ</label>
              <input
                id="originCity"
                type="text"
                value={user?.city ?? ''}
                disabled
                className="create-transfer-input-disabled"
              />
            </div>
            <div className="form-group">
              <label htmlFor="destinationCity">Ville de destination</label>
              {citiesLoading ? (
                <p className="create-transfer-cities-loading">Chargement des villes...</p>
              ) : (
                <select
                  id="destinationCity"
                  value={destinationCity}
                  onChange={(e) => setDestinationCity(e.target.value)}
                  required
                >
                  {cities.map((city) => (
                    <option key={city.id} value={city.name}>
                      {city.name}
                    </option>
                  ))}
                </select>
              )}
            </div>
          </fieldset>

          <fieldset className="create-transfer-fieldset">
            <legend className="create-transfer-legend">Montant</legend>
            <div className="form-group">
              <label htmlFor="amount">Montant à transférer (FCFA)</label>
              <input
                id="amount"
                type="number"
                inputMode="numeric"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                required
                min={MIN_TRANSFER_AMOUNT}
                step="1"
                placeholder="100000"
              />
              <p className="create-transfer-hint">Montant minimum : {formatCurrency(MIN_TRANSFER_AMOUNT)}</p>
            </div>
          </fieldset>

          {hasValidAmount && (
            <div className="create-transfer-summary">
              <div className="summary-row">
                <span>Montant à transférer</span>
                <span>{formatCurrency(numericAmount)}</span>
              </div>
              <div className="summary-row">
                <span>Frais de transfert</span>
                <span>{formatCurrency(fee)}</span>
              </div>
              <div className="summary-row summary-row-total">
                <span>TOTAL À RECEVOIR DU CLIENT</span>
                <span>{formatCurrency(totalAmount)}</span>
              </div>
            </div>
          )}

          <div className="create-transfer-actions">
            <button type="button" onClick={handleCancel} className="create-transfer-button secondary" disabled={loading}>
              Annuler
            </button>
            <button type="submit" disabled={!isFormValid || loading} className="create-transfer-button primary">
              {loading ? 'Création en cours...' : 'Créer le transfert'}
            </button>
          </div>
        </form>
      </div>

      {showCancelConfirm && (
        <div className="cancel-modal-overlay">
          <div className="cancel-modal">
            <h2>Confirmer l'annulation</h2>
            <p>Voulez-vous vraiment annuler la création de ce transfert ? Aucune donnée ne sera enregistrée.</p>
            <div className="cancel-modal-actions">
              <button onClick={() => setShowCancelConfirm(false)} className="cancel-modal-button secondary">
                Continuer la saisie
              </button>
              <button onClick={confirmCancel} className="cancel-modal-button danger">
                Annuler le transfert
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

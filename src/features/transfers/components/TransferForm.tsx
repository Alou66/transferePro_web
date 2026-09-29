import { useEffect, useRef, useState } from 'react'
import { calculateTransferFee } from '../utils/calculateTransferFee'
import { formatCurrency } from '../../../shared/utils/formatCurrency'
import type { CityModel } from '../../../types/index'
import './TransferForm.css'

const MIN_TRANSFER_AMOUNT = 1000

export interface TransferFormValues {
  senderName: string
  senderPhone: string
  recipientName: string
  recipientPhone: string
  destinationCityId: string
  amount: number
}

interface TransferFormProps {
  // Valeurs de pré-remplissage (page de modification). Absentes à la création.
  initialValues?: Partial<TransferFormValues>
  originCityName: string
  cities: CityModel[]
  citiesLoading: boolean
  error: string | null
  successMessage: string | null
  onSubmit: (values: TransferFormValues) => void
  onCancel: () => void
  submitLabel: string
  loadingLabel: string
  loading: boolean
}

/**
 * Formulaire de saisie d'un transfert, partagé par la création et la
 * modification.
 *
 * Les champs, les règles de validation et le calcul du récapitulatif
 * (montant / frais / total) vivent ici : les deux pages restent ainsi
 * identiques et aucune validation n'est dupliquée.
 */
export default function TransferForm({
  initialValues,
  originCityName,
  cities,
  citiesLoading,
  error,
  successMessage,
  onSubmit,
  onCancel,
  submitLabel,
  loadingLabel,
  loading,
}: TransferFormProps) {
  const [senderName, setSenderName] = useState(initialValues?.senderName ?? '')
  const [senderPhone, setSenderPhone] = useState(initialValues?.senderPhone ?? '')
  const [recipientName, setRecipientName] = useState(initialValues?.recipientName ?? '')
  const [recipientPhone, setRecipientPhone] = useState(initialValues?.recipientPhone ?? '')
  const [destinationCityId, setDestinationCityId] = useState(initialValues?.destinationCityId ?? '')
  const [amount, setAmount] = useState(
    initialValues?.amount !== undefined ? String(initialValues.amount) : '',
  )
  const [formError, setFormError] = useState<string | null>(null)

  const numericAmount = Number(amount)
  const hasValidAmount = amount !== '' && !Number.isNaN(numericAmount) && numericAmount >= MIN_TRANSFER_AMOUNT
  const fee = hasValidAmount ? calculateTransferFee(numericAmount) : 0
  const totalAmount = hasValidAmount ? numericAmount + fee : 0

  const isFormValid =
    senderName.trim().length >= 2 &&
    recipientName.trim().length >= 2 &&
    hasValidAmount &&
    destinationCityId !== ''

  // À la création, on présélectionne la première ville disponible. En
  // modification la destination est déjà renseignée et ne doit jamais être
  // écrasée par ce défaut.
  const didSetDefaultCity = useRef(Boolean(initialValues?.destinationCityId))

  useEffect(() => {
    if (cities.length > 0 && !didSetDefaultCity.current) {
      setDestinationCityId(cities[0].id)
      didSetDefaultCity.current = true
    }
  }, [cities])

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    setFormError(null)

    const destinationCity = cities.find((c) => c.id === destinationCityId)
    if (destinationCity && destinationCity.name === originCityName) {
      setFormError('La ville de destination doit être différente de votre ville.')
      return
    }

    onSubmit({
      senderName: senderName.trim(),
      senderPhone: senderPhone.trim(),
      recipientName: recipientName.trim(),
      recipientPhone: recipientPhone.trim(),
      destinationCityId,
      amount: numericAmount,
    })
  }

  const displayedError = formError ?? error

  return (
    <form onSubmit={handleSubmit} className="create-transfer-form">
      {displayedError && (
        <div className="create-transfer-error">{displayedError}</div>
      )}

      {successMessage && (
        <div className="create-transfer-success">{successMessage}</div>
      )}

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
          <label htmlFor="senderPhone">Téléphone de l'expéditeur (optionnel)</label>
          <input
            id="senderPhone"
            type="tel"
            value={senderPhone}
            onChange={(e) => setSenderPhone(e.target.value)}
            placeholder="77 123 45 67"
          />
        </div>
      </fieldset>

      <fieldset className="create-transfer-fieldset">
        <legend className="create-transfer-legend">Informations du bénéficiaire</legend>
        <div className="form-group">
          <label htmlFor="recipientName">Nom complet du bénéficiaire</label>
          <input
            id="recipientName"
            type="text"
            value={recipientName}
            onChange={(e) => setRecipientName(e.target.value)}
            required
            minLength={2}
            placeholder="Ibrahima Camara"
          />
        </div>
        <div className="form-group">
          <label htmlFor="recipientPhone">Téléphone du bénéficiaire (optionnel)</label>
          <input
            id="recipientPhone"
            type="tel"
            value={recipientPhone}
            onChange={(e) => setRecipientPhone(e.target.value)}
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
            value={originCityName}
            disabled
            className="create-transfer-input-disabled"
          />
        </div>
        <div className="form-group">
          <label htmlFor="destinationCityId">Ville de destination</label>
          {citiesLoading ? (
            <p className="create-transfer-cities-loading">Chargement des villes...</p>
          ) : (
            <select
              id="destinationCityId"
              value={destinationCityId}
              onChange={(e) => setDestinationCityId(e.target.value)}
              required
            >
              {cities.map((city) => (
                <option key={city.id} value={city.id}>
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
        <button type="button" onClick={onCancel} className="create-transfer-button secondary" disabled={loading}>
          Annuler
        </button>
        <button type="submit" disabled={!isFormValid || loading} className="create-transfer-button primary">
          {loading ? loadingLabel : submitLabel}
        </button>
      </div>
    </form>
  )
}

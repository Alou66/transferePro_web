import { useState } from 'react'
import { useParams, useNavigate, NavLink } from 'react-router-dom'
import { useAuth } from '../../auth/hooks/useAuth'
import { useTransfer, useVerifyWithdrawalCode } from '../hooks/useTransfers'
import { TransferStatus } from '../../../types/index'
import { formatCurrency } from '../../../shared/utils/formatCurrency'
import BackButton from '../../../components/common/BackButton'
import './VerifyWithdrawalCodePage.css'

export default function VerifyWithdrawalCodePage() {
  const { transferId } = useParams<{ transferId: string }>()
  const { user } = useAuth()
  const navigate = useNavigate()
  const { data: transfer, isLoading: loading, isError: transferFailed } = useTransfer(transferId)
  const verifyCode = useVerifyWithdrawalCode()
  const [code, setCode] = useState('')
  const [submitError, setSubmitError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)

  const verifying = verifyCode.isPending

  const loadError =
    transferFailed || !transferId
      ? 'Transfert introuvable.'
      : transfer && transfer.destinationAgentId !== user?.id
        ? "Vous n'êtes pas autorisé à vérifier ce transfert."
        : transfer && transfer.status !== TransferStatus.CREATED
          ? 'Ce transfert ne peut plus être vérifié.'
          : null

  const error = submitError ?? loadError

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setSubmitError(null)

    if (!transfer || !code) {
      setSubmitError('Veuillez saisir le code de retrait.')
      return
    }

    if (!/^\d{4}$/.test(code)) {
      setSubmitError('Le code doit contenir exactement 4 chiffres.')
      return
    }

    try {
      await verifyCode.mutateAsync({ id: transfer.id, code })

      setSuccess(true)
      setTimeout(() => {
        if (transferId) {
          navigate(`/agent/transfers/${transferId}`)
        }
      }, 1500)
    } catch (err) {
      setSubmitError(err instanceof Error ? err.message : 'Une erreur est survenue lors de la vérification.')
    }
  }

  if (loading) {
    return (
      <div className="verify-page">
        <div className="verify-loading">
          <div className="verify-spinner" />
          <p>Chargement...</p>
        </div>
      </div>
    )
  }

  if (error && !transfer) {
    return (
      <div className="verify-page">
        <div className="verify-error">
          <p>{error}</p>
          <NavLink to="/agent" className="verify-link">
            Retour à l'accueil
          </NavLink>
        </div>
      </div>
    )
  }

  if (!transfer) {
    return null
  }

  return (
    <div className="verify-page">
      <BackButton to="/agent/transfers/incoming" />
      <div className="verify-card">
        <h1>Vérification du code de retrait</h1>

        <div className="verify-transfer-info">
          <p><strong>Référence :</strong> {transfer.reference}</p>
          <p><strong>Bénéficiaire :</strong> {transfer.recipientName}</p>
          <p><strong>Montant :</strong> {formatCurrency(transfer.amount)}</p>
        </div>

        {success ? (
          <div className="verify-success">
            <p>✓ Code vérifié avec succès</p>
            <p className="verify-success-hint">Redirection...</p>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="verify-form">
            {error && <div className="verify-error-message">{error}</div>}

            <div className="verify-form-group">
              <label htmlFor="withdrawalCode">Code secret à 4 chiffres</label>
              <input
                id="withdrawalCode"
                type="text"
                inputMode="numeric"
                maxLength={4}
                value={code}
                onChange={(e) => setCode(e.target.value.replace(/\D/g, '').slice(0, 4))}
                placeholder="0000"
                required
                disabled={verifying}
                className="verify-code-input"
              />
              <p className="verify-hint">
                Demandez le code au bénéficiaire. Il contient exactement 4 chiffres.
              </p>
            </div>

            <button
              type="submit"
              disabled={verifying || code.length !== 4}
              className="verify-button"
            >
              {verifying ? 'Vérification...' : 'Vérifier le code'}
            </button>
          </form>
        )}
      </div>
    </div>
  )
}

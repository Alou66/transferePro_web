import { useState, useEffect } from 'react'
import { useParams, useNavigate, NavLink } from 'react-router-dom'
import { useAuth } from '../../auth/hooks/useAuth'
import { transferService } from '../services/transferService'
import type { Transfer } from '../../../types/index'
import { TransferStatus } from '../../../types/index'
import { formatCurrency } from '../../../shared/utils/formatCurrency'
import './VerifyWithdrawalCodePage.css'

export default function VerifyWithdrawalCodePage() {
  const { transferId } = useParams<{ transferId: string }>()
  const { user } = useAuth()
  const navigate = useNavigate()
  const [transfer, setTransfer] = useState<Transfer | null>(null)
  const [code, setCode] = useState('')
  const [loading, setLoading] = useState(true)
  const [verifying, setVerifying] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)

  useEffect(() => {
    async function load() {
      if (!transferId) {
        setError('Transfert introuvable.')
        setLoading(false)
        return
      }

      try {
        const data = await transferService.getById(transferId)
        setTransfer(data)

        if (data.destinationAgentId !== user?.id) {
          setError("Vous n'êtes pas autorisé à vérifier ce transfert.")
        } else if (data.status !== TransferStatus.CREATED) {
          setError('Ce transfert ne peut plus être vérifié.')
        }
      } catch {
        setError('Transfert introuvable.')
      } finally {
        setLoading(false)
      }
    }

    load()
  }, [transferId, user?.id])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)

    if (!transfer || !code) {
      setError('Veuillez saisir le code de retrait.')
      return
    }

    if (!/^\d{4}$/.test(code)) {
      setError('Le code doit contenir exactement 4 chiffres.')
      return
    }

    setVerifying(true)

    try {
      if (code !== transfer.withdrawalCode) {
        setError('Le code secret est incorrect. Veuillez vérifier le code fourni par le bénéficiaire.')
        setVerifying(false)
        return
      }

      await transferService.updateStatus(transfer.id, {
        status: TransferStatus.READY_FOR_PAYMENT,
      })

      setSuccess(true)
      setTimeout(() => {
        if (transferId) {
          navigate(`/agent/transfers/${transferId}`)
        }
      }, 1500)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Une erreur est survenue lors de la vérification.')
    } finally {
      setVerifying(false)
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
      <div className="verify-card">
        <h1>Vérification du code de retrait</h1>

        <div className="verify-transfer-info">
          <p><strong>Référence :</strong> {transfer.reference}</p>
          <p><strong>Bénéficiaire :</strong> {transfer.receiverName}</p>
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

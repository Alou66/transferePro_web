import { useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { authService } from '../services/authService'
import '../pages/LoginPage.css'
import './ForgotPasswordPage.css'

function EyeIcon() {
  return (
    <svg viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <path d="M1.5 10S4.5 4 10 4s8.5 6 8.5 6-3 6-8.5 6-8.5-6-8.5-6Z" />
      <circle cx="10" cy="10" r="2.25" />
    </svg>
  )
}

function EyeOffIcon() {
  return (
    <svg viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <path d="M2.5 2.5l15 15" />
      <path d="M8.36 4.24A8.8 8.8 0 0 1 10 4c5.5 0 8.5 6 8.5 6a15 15 0 0 1-2.44 3.31M5.6 5.6C3.13 7.13 1.5 10 1.5 10s3 6 8.5 6a8.6 8.6 0 0 0 3.4-.7" />
      <path d="M8.05 8.05a2.25 2.25 0 0 0 3.18 3.18" />
    </svg>
  )
}

type Step = 'phone' | 'reset' | 'done'

export default function ForgotPasswordPage() {
  const navigate = useNavigate()
  const [step, setStep] = useState<Step>('phone')

  const [phone, setPhone] = useState('')
  const [account, setAccount] = useState<{ firstName: string; lastName: string; resetToken: string } | null>(null)

  const [newPassword, setNewPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [showNewPassword, setShowNewPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)

  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)

  const handleVerifyPhone = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    setLoading(true)

    try {
      const result = await authService.verifyPhoneForReset(phone.trim())
      setAccount(result)
      setStep('reset')
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Une erreur est survenue')
    } finally {
      setLoading(false)
    }
  }

  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)

    if (newPassword.length < 6) {
      setError('Le mot de passe doit contenir au moins 6 caractères')
      return
    }

    if (newPassword !== confirmPassword) {
      setError('Les mots de passe ne correspondent pas')
      return
    }

    if (!account) {
      setError('Une erreur est survenue, veuillez recommencer')
      setStep('phone')
      return
    }

    setLoading(true)

    try {
      await authService.resetPassword(account.resetToken, newPassword)
      setStep('done')
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Une erreur est survenue')
    } finally {
      setLoading(false)
    }
  }

  const handleChangePhone = () => {
    setError(null)
    setAccount(null)
    setNewPassword('')
    setConfirmPassword('')
    setStep('phone')
  }

  return (
    <div className="login-page">
      <div className="login-brand">
        <span className="login-brand-icon">
          <img src="/favicon.svg" alt="" />
        </span>
        <span className="login-brand-text">
          <span className="login-brand-name">Transfere</span>
          <span className="login-brand-pro">Pro</span>
        </span>
        <span className="login-brand-divider" aria-hidden="true" />
        <span className="login-brand-description">Espace agent</span>
      </div>

      <div className="login-card">
        {step === 'phone' && (
          <>
            <h1>Mot de passe oublié</h1>
            <p className="login-subtitle">Saisissez votre numéro de téléphone pour retrouver votre compte</p>

            {error && (
              <div className="login-error" role="alert">
                {error}
              </div>
            )}

            <form onSubmit={handleVerifyPhone} className="login-form" noValidate>
              <div className="form-group">
                <label htmlFor="phone">Numéro de téléphone</label>
                <div className="input-with-icon">
                  <input
                    id="phone"
                    name="phone"
                    type="tel"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    required
                    autoComplete="tel"
                    autoFocus
                    placeholder="Votre numéro de téléphone"
                  />
                </div>
              </div>

              <button type="submit" disabled={loading} className="login-button">
                {loading && <span className="login-spinner" aria-hidden="true" />}
                {loading ? 'Recherche en cours...' : 'Rechercher mon compte'}
              </button>
            </form>

            <p className="login-footer">
              <Link to="/login" className="login-link">
                ← Retour à la connexion
              </Link>
            </p>
          </>
        )}

        {step === 'reset' && account && (
          <>
            <h1>Nouveau mot de passe</h1>
            <div className="fpw-account-found">
              Compte trouvé : {account.firstName} {account.lastName}
            </div>
            <p className="login-subtitle">Choisissez un nouveau mot de passe</p>

            {error && (
              <div className="login-error" role="alert">
                {error}
              </div>
            )}

            <form onSubmit={handleResetPassword} className="login-form" noValidate>
              <div className="form-group">
                <label htmlFor="newPassword">Nouveau mot de passe</label>
                <div className="input-with-icon password-field">
                  <input
                    id="newPassword"
                    name="newPassword"
                    type={showNewPassword ? 'text' : 'password'}
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    required
                    autoComplete="new-password"
                    autoFocus
                    placeholder="Minimum 6 caractères"
                  />
                  <button
                    type="button"
                    className="password-toggle"
                    onClick={() => setShowNewPassword((prev) => !prev)}
                    aria-label={showNewPassword ? 'Masquer le mot de passe' : 'Afficher le mot de passe'}
                  >
                    {showNewPassword ? <EyeOffIcon /> : <EyeIcon />}
                  </button>
                </div>
              </div>

              <div className="form-group">
                <label htmlFor="confirmPassword">Confirmer le mot de passe</label>
                <div className="input-with-icon password-field">
                  <input
                    id="confirmPassword"
                    name="confirmPassword"
                    type={showConfirmPassword ? 'text' : 'password'}
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    required
                    autoComplete="new-password"
                    placeholder="Répétez le mot de passe"
                  />
                  <button
                    type="button"
                    className="password-toggle"
                    onClick={() => setShowConfirmPassword((prev) => !prev)}
                    aria-label={showConfirmPassword ? 'Masquer le mot de passe' : 'Afficher le mot de passe'}
                  >
                    {showConfirmPassword ? <EyeOffIcon /> : <EyeIcon />}
                  </button>
                </div>
              </div>

              <button type="submit" disabled={loading} className="login-button">
                {loading && <span className="login-spinner" aria-hidden="true" />}
                {loading ? 'Réinitialisation...' : 'Réinitialiser le mot de passe'}
              </button>
            </form>

            <p className="login-footer fpw-footer-links">
              <button type="button" className="login-link fpw-link-button" onClick={handleChangePhone}>
                ← Changer de numéro
              </button>
              <Link to="/login" className="login-link">
                ← Retour à la connexion
              </Link>
            </p>
          </>
        )}

        {step === 'done' && (
          <>
            <h1>Mot de passe réinitialisé</h1>
            <p className="login-subtitle">
              Votre mot de passe a été mis à jour avec succès. Vous pouvez maintenant vous connecter.
            </p>

            <button type="button" className="login-button" onClick={() => navigate('/login')}>
              Aller à la connexion
            </button>
          </>
        )}
      </div>
    </div>
  )
}

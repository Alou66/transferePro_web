import { useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { useAuth } from '../hooks/useAuth'
import { UserRole } from '../../../types/index'
import './LoginPage.css'


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

export default function LoginPage() {
  const navigate = useNavigate()
  const { login } = useAuth()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    setLoading(true)

    try {
      const session = await login({ email, password })
      if (session.agent.role === UserRole.ADMIN) {
        navigate('/admin')
      } else {
        navigate('/agent')
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Une erreur est survenue')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="login-page">
      <div className="login-brand">
        <span className="login-brand-icon">
          <img src="/favicon.svg" alt="" />
        </span>
        <span className="login-brand-text">
          <span className="login-brand-name">Transfert</span>
          <span className="login-brand-pro">Pro</span>
        </span>
        <span className="login-brand-divider" aria-hidden="true" />
        <span className="login-brand-description">Espace agent</span>
      </div>

      <div className="login-card">
        <h1>Connexion</h1>
        <p className="login-subtitle">Accédez à votre espace agent</p>

        {error && (
          <div className="login-error" role="alert">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="login-form" noValidate>
          <div className="form-group">
            <label htmlFor="email">Adresse email</label>
            <div className="input-with-icon">
              <input
                id="email"
                name="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                autoComplete="email"
                autoFocus
                placeholder="nom@exemple.com"
              />
            </div>
          </div>

          <div className="form-group">
            <label htmlFor="password">Mot de passe</label>
            <div className="input-with-icon password-field">
              <input
                id="password"
                name="password"
                type={showPassword ? 'text' : 'password'}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                autoComplete="current-password"
                placeholder="••••••••"
              />
              <button
                type="button"
                className="password-toggle"
                onClick={() => setShowPassword((prev) => !prev)}
                aria-label={showPassword ? 'Masquer le mot de passe' : 'Afficher le mot de passe'}
              >
                {showPassword ? <EyeOffIcon /> : <EyeIcon />}
              </button>
            </div>
            <Link to="/forgot-password" className="login-link login-forgot-link">
              Mot de passe oublié ?
            </Link>
          </div>

          <button type="submit" disabled={loading} className="login-button">
            {loading && <span className="login-spinner" aria-hidden="true" />}
            {loading ? 'Connexion en cours...' : 'Se connecter'}
          </button>
        </form>

        <p className="login-footer">
          Pas encore de compte ?{' '}
          <Link to="/register" className="login-link">
            Créer un compte
          </Link>
        </p>
      </div>
    </div>
  )
}

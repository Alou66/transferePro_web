import { useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { useAuth } from '../hooks/useAuth'
import { UserRole } from '../../../types/index'
import './LoginPage.css'

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
        <span className="login-brand-icon" aria-hidden="true">
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M12 2v20M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6" />
          </svg>
        </span>
        <span className="login-brand-text">
          <span className="login-brand-name">Transfere</span>
          <span className="login-brand-pro">Pro</span>
        </span>
        <span className="login-brand-divider" aria-hidden="true" />
        <span className="login-brand-description">de Alassane</span>
      </div>
      <div className="login-card">
        <h1>Connexion</h1>
        <p className="login-subtitle">Accédez à votre espace agent</p>

        {error && <div className="login-error">{error}</div>}

        <form onSubmit={handleSubmit} className="login-form">
          <div className="form-group">
            <label htmlFor="email">Adresse email</label>
            <input
              id="email"
              name="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              placeholder="nom@exemple.com"
            />
          </div>

          <div className="form-group">
            <label htmlFor="password">Mot de passe</label>
            <div className="password-field">
              <input
                id="password"
                name="password"
                type={showPassword ? 'text' : 'password'}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                placeholder="••••••••"
              />
              <button
                type="button"
                className="password-toggle"
                onClick={() => setShowPassword((prev) => !prev)}
                aria-label={showPassword ? 'Masquer le mot de passe' : 'Afficher le mot de passe'}
              >
                {showPassword ? '👁️' : '👁️‍🗨️'}
              </button>
            </div>
          </div>

          <button type="submit" disabled={loading} className="login-button">
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

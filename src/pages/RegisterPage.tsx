import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { authService } from '../features/auth/services/authService'
import { useAvailableCitiesForRegistration } from '../features/cities/hooks/useCities'
import BackButton from '../components/common/BackButton'
import './RegisterPage.css'

export default function RegisterPage() {
  const navigate = useNavigate()
  const [form, setForm] = useState({
    firstName: '',
    lastName: '',
    phone: '',
    email: '',
    password: '',
    confirmPassword: '',
    cityId: '',
  })
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)

  const passwordsMismatch = form.confirmPassword.length > 0 && form.password !== form.confirmPassword

  const { data: cities = [], isLoading: citiesLoading, isError: citiesFailed } = useAvailableCitiesForRegistration()

  useEffect(() => {
    if (cities.length > 0 && !form.cityId) {
      setForm((prev) => ({ ...prev, cityId: cities[0].id }))
    }
    // oxlint-disable-next-line react-hooks/exhaustive-deps
  }, [cities])

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target
    setForm((prev) => ({ ...prev, [name]: value }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)

    if (form.password !== form.confirmPassword) {
      setError('Les mots de passe ne correspondent pas.')
      return
    }

    setLoading(true)

    try {
      const agent = await authService.register(form)
      navigate('/pending-validation', { state: { agent } })
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Une erreur est survenue')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="register-page">
      <div className="register-card">
        <BackButton to="/login" />
        <h1>Inscription agent</h1>
        <p className="register-subtitle">Créez votre compte pour accéder à la plateforme</p>

        {(error || citiesFailed) && (
          <div className="register-error">
            {error ?? 'Impossible de charger les villes disponibles.'}
          </div>
        )}

        <form onSubmit={handleSubmit} className="register-form">
          <div className="form-row">
            <div className="form-group">
              <label htmlFor="firstName">Prénom</label>
              <input
                id="firstName"
                name="firstName"
                type="text"
                value={form.firstName}
                onChange={handleChange}
                required
              />
            </div>
            <div className="form-group">
              <label htmlFor="lastName">Nom</label>
              <input
                id="lastName"
                name="lastName"
                type="text"
                value={form.lastName}
                onChange={handleChange}
                required
              />
            </div>
          </div>

          <div className="form-group">
            <label htmlFor="phone">Téléphone</label>
            <input
              id="phone"
              name="phone"
              type="tel"
              value={form.phone}
              onChange={handleChange}
              required
            />
          </div>

          <div className="form-group">
            <label htmlFor="email">Email</label>
            <input
              id="email"
              name="email"
              type="email"
              value={form.email}
              onChange={handleChange}
              required
            />
          </div>

          <div className="form-group">
            <label htmlFor="password">Mot de passe</label>
            <div className="password-field">
              <input
                id="password"
                name="password"
                type={showPassword ? 'text' : 'password'}
                value={form.password}
                onChange={handleChange}
                required
                minLength={6}
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

          <div className="form-group">
            <label htmlFor="confirmPassword">Confirmer le mot de passe</label>
            <div className="password-field">
              <input
                id="confirmPassword"
                name="confirmPassword"
                type={showConfirmPassword ? 'text' : 'password'}
                value={form.confirmPassword}
                onChange={handleChange}
                required
                minLength={6}
                placeholder="••••••••"
                aria-invalid={passwordsMismatch}
              />
              <button
                type="button"
                className="password-toggle"
                onClick={() => setShowConfirmPassword((prev) => !prev)}
                aria-label={showConfirmPassword ? 'Masquer le mot de passe' : 'Afficher le mot de passe'}
              >
                {showConfirmPassword ? '👁️' : '👁️‍🗨️'}
              </button>
            </div>
            {passwordsMismatch && (
              <p className="form-field-error">Les mots de passe ne correspondent pas.</p>
            )}
          </div>

          <div className="form-group">
            <label htmlFor="city">Ville</label>
            {citiesLoading ? (
              <p className="register-cities-loading">Chargement des villes...</p>
            ) : cities.length === 0 ? (
              <p className="register-cities-empty">
                Aucune ville n'est actuellement disponible pour l'inscription d'un nouvel agent.
                Veuillez réessayer plus tard.
              </p>
            ) : (
              <select
                id="cityId"
                name="cityId"
                value={form.cityId}
                onChange={handleChange}
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

          <button
            type="submit"
            disabled={loading || citiesLoading || cities.length === 0 || passwordsMismatch}
            className="register-button"
          >
            {loading ? 'Inscription en cours...' : "S'inscrire"}
          </button>
        </form>
      </div>
    </div>
  )
}

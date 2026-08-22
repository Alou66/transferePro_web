import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { authService } from '../features/auth/services/authService'
import { City } from '../types/index'
import './RegisterPage.css'

const CITIES = [City.DAKAR, City.ZIGUINCHOR, City.CONAKRY]

export default function RegisterPage() {
  const navigate = useNavigate()
  const [form, setForm] = useState({
    firstName: '',
    lastName: '',
    phone: '',
    email: '',
    password: '',
    city: City.DAKAR,
  })
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target
    setForm((prev) => ({ ...prev, [name]: value }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
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
        <h1>Inscription agent</h1>
        <p className="register-subtitle">Créez votre compte pour accéder à la plateforme</p>

        {error && <div className="register-error">{error}</div>}

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
            <input
              id="password"
              name="password"
              type="password"
              value={form.password}
              onChange={handleChange}
              required
            />
          </div>

          <div className="form-group">
            <label htmlFor="city">Ville</label>
            <select
              id="city"
              name="city"
              value={form.city}
              onChange={handleChange}
              required
            >
              {CITIES.map((city) => (
                <option key={city} value={city}>
                  {city}
                </option>
              ))}
            </select>
          </div>

          <button type="submit" disabled={loading} className="register-button">
            {loading ? 'Inscription en cours...' : "S'inscrire"}
          </button>
        </form>
      </div>
    </div>
  )
}

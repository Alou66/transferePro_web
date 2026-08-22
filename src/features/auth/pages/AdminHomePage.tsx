import { useAuth } from '../hooks/useAuth'
import { UserRole } from '../../../types/index'
import './AuthHomePage.css'

export default function AdminHomePage() {
  const { user } = useAuth()

  if (!user) {
    return null
  }

  return (
    <div className="auth-home-page">
      <div className="auth-home-card">
        <h1>Bienvenue {user.firstName}</h1>
        <p className="auth-home-subtitle">Vous êtes connecté en tant qu'administrateur.</p>
        <p className="auth-home-info">Rôle : {UserRole.ADMIN}</p>
      </div>
    </div>
  )
}

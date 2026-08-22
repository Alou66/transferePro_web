import { Navigate, NavLink } from 'react-router-dom'
import { useAuth } from '../../auth/hooks/useAuth'
import { UserRole } from '../../../types/index'

export default function HomePage() {
  const { user } = useAuth()

  if (user) {
    if (user.role === UserRole.ADMIN) {
      return <Navigate to="/admin" replace />
    }
    return <Navigate to="/agent" replace />
  }

  return (
    <div className="home-page">
      <div className="home-card">
        <h1>TransferePro Web</h1>
        <p className="home-subtitle">Application de gestion de transferts d'argent</p>
        <div className="home-actions">
          <NavLink to="/login" className="home-button primary">
            Se connecter
          </NavLink>
          <NavLink to="/register" className="home-button secondary">
            Créer un compte
          </NavLink>
        </div>
      </div>
    </div>
  )
}

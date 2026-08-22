import { Outlet, NavLink, useNavigate } from 'react-router-dom'
import { useAuth } from '../../auth/hooks/useAuth'
import { UserRole } from '../../../types/index'
import './Layout.css'

export default function AdminLayout() {
  const { user, logout } = useAuth()
  const navigate = useNavigate()

  const handleLogout = () => {
    logout()
    navigate('/login')
  }

  return (
    <div className="layout">
      <header className="layout-header">
        <div className="layout-header-content">
          <NavLink to="/admin" className="layout-brand">
            TransferePro
          </NavLink>
          <div className="layout-user">
            <span className="layout-user-name">
              {user?.firstName} {user?.lastName}
            </span>
            <span className="layout-user-role">{UserRole.ADMIN}</span>
            <button onClick={handleLogout} className="layout-logout">
              Déconnexion
            </button>
          </div>
        </div>
      </header>
      <main className="layout-main">
        <Outlet />
      </main>
    </div>
  )
}

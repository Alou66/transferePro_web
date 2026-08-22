import { Outlet, NavLink, useNavigate } from 'react-router-dom'
import { useAuth } from '../../auth/hooks/useAuth'
import './Layout.css'

export default function AgentLayout() {
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
          <NavLink to="/agent" className="layout-brand">
            TransferePro
          </NavLink>
          <nav className="layout-nav">
            <NavLink to="/agent" className="layout-nav-link">
              Accueil
            </NavLink>
            <NavLink to="/agent/transfers/new" className="layout-nav-link">
              Nouveau transfert
            </NavLink>
            <NavLink to="/agent/transfers/incoming" className="layout-nav-link">
              Transferts entrants
            </NavLink>
          </nav>
          <div className="layout-user">
            <span className="layout-user-name">
              {user?.firstName} {user?.lastName}
            </span>
            <span className="layout-user-city">{user?.city}</span>
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

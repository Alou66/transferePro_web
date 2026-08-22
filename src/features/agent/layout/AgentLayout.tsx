import { useState } from 'react'
import { Outlet, NavLink, useNavigate } from 'react-router-dom'
import { useAuth } from '../../auth/hooks/useAuth'
import './Layout.css'

export default function AgentLayout() {
  const { user, logout } = useAuth()
  const navigate = useNavigate()
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)

  const handleLogout = () => {
    logout()
    navigate('/login')
  }

  const handleNavClick = () => {
    setMobileMenuOpen(false)
  }

  return (
    <div className="layout">
      <header className="layout-header">
        <div className="layout-header-content">
          <NavLink to="/agent" className="layout-brand">
            TransferePro
          </NavLink>

          <button
            type="button"
            className="mobile-nav-toggle"
            aria-label="Menu de navigation"
            aria-expanded={mobileMenuOpen}
            onClick={() => setMobileMenuOpen((prev) => !prev)}
          >
            <span />
            <span />
            <span />
          </button>

          <nav className={`layout-nav ${mobileMenuOpen ? 'layout-nav--open' : ''}`}>
            <NavLink to="/agent" className="layout-nav-link" onClick={handleNavClick}>
              Accueil
            </NavLink>
            <NavLink to="/agent/transfers/new" className="layout-nav-link" onClick={handleNavClick}>
              Nouveau transfert
            </NavLink>
            <NavLink to="/agent/transfers/incoming" className="layout-nav-link" onClick={handleNavClick}>
              Transferts entrants
            </NavLink>
            <NavLink to="/agent/transfers/history" className="layout-nav-link" onClick={handleNavClick}>
              Historique
            </NavLink>

            <div className="layout-nav-user">
              <span className="layout-nav-user-name">
                {user?.firstName} {user?.lastName}
              </span>
              <span className="layout-user-city">{user?.city}</span>
              <button onClick={handleLogout} className="layout-nav-logout">
                Déconnexion
              </button>
            </div>
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

      {mobileMenuOpen && (
        <div
          className="mobile-nav-overlay"
          onClick={() => setMobileMenuOpen(false)}
          aria-hidden="true"
        />
      )}

      <main className="layout-main">
        <Outlet />
      </main>
    </div>
  )
}

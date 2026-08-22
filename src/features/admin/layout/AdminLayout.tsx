import { useState } from 'react'
import { Outlet, NavLink, useNavigate } from 'react-router-dom'
import { useAuth } from '../../auth/hooks/useAuth'
import { UserRole } from '../../../types/index'
import './Layout.css'

export default function AdminLayout() {
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
          <NavLink to="/admin" className="layout-brand">
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
            <NavLink to="/admin" className="layout-nav-link" onClick={handleNavClick}>
              Accueil
            </NavLink>
            <NavLink to="/admin/agents" className="layout-nav-link" onClick={handleNavClick}>
              Gestion des agents
            </NavLink>
            <NavLink to="/admin/cities" className="layout-nav-link" onClick={handleNavClick}>
              Gestion des villes
            </NavLink>
            <NavLink to="/admin/transfers" className="layout-nav-link" onClick={handleNavClick}>
              Gestion des transferts
            </NavLink>
            <NavLink to="/admin/financial-statistics" className="layout-nav-link" onClick={handleNavClick}>
              Statistiques financières
            </NavLink>

            <div className="layout-nav-user">
              <span className="layout-nav-user-name">
                {user?.firstName} {user?.lastName}
              </span>
              <span className="layout-user-role">{UserRole.ADMIN}</span>
              <button onClick={handleLogout} className="layout-nav-logout">
                Déconnexion
              </button>
            </div>
          </nav>

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

import { Navigate } from 'react-router-dom'
import { useAuth } from '../../auth/hooks/useAuth'
import './LoadingPage.css'

interface ProtectedRouteProps {
  children: React.ReactNode
}

export default function ProtectedRoute({ children }: ProtectedRouteProps) {
  const { isAuthenticated, loading } = useAuth()

  if (loading) {
    return (
      <div className="loading-page">
        <div className="loading-card">
          <div className="loading-spinner" />
          <p>Chargement...</p>
        </div>
      </div>
    )
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />
  }

  return <>{children}</>
}

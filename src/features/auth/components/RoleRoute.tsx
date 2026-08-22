import { Navigate } from 'react-router-dom'
import { useAuth } from '../../auth/hooks/useAuth'
import { UserRole } from '../../../types/index'

interface RoleRouteProps {
  children: React.ReactNode
  allowedRoles: UserRole[]
}

export default function RoleRoute({ children, allowedRoles }: RoleRouteProps) {
  const { user } = useAuth()

  if (!user || !allowedRoles.includes(user.role)) {
    if (user?.role === UserRole.ADMIN) {
      return <Navigate to="/admin" replace />
    }
    return <Navigate to="/agent" replace />
  }

  return <>{children}</>
}

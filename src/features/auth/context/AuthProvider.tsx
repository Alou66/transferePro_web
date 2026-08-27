import { useState, useEffect } from 'react'
import type { ReactNode } from 'react'
import type { Agent, LoginInput, AuthResponse } from '../../../types/index'
import { authService } from '../services/authService'
import { api } from '../../../services/api'
import { AuthContext } from './AuthContext'

interface AuthProviderProps {
  children: ReactNode
}

function mapBackendUserToAgent(user: {
  id: string
  firstName: string
  lastName: string
  email: string
  phone: string
  role: string
  status: string
  city: { id: string; name: string }
}): Agent {
  return {
    id: user.id,
    firstName: user.firstName,
    lastName: user.lastName,
    phone: user.phone,
    email: user.email,
    password: '',
    city: user.city?.name ?? '',
    role: user.role as Agent['role'],
    status: user.status as Agent['status'],
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  }
}

function getInitialUser(): Agent | null {
  const session = authService.getCurrentUser()
  if (!session?.agent || !session.token) {
    return null
  }

  const city = typeof session.agent.city === 'string'
    ? session.agent.city
    : (session.agent.city as { name?: string } | undefined)?.name ?? ''

  return {
    ...session.agent,
    city,
  }
}

export default function AuthProvider({ children }: AuthProviderProps) {
  const [user, setUser] = useState<Agent | null>(getInitialUser)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function restoreSession() {
      const session = authService.getCurrentUser()

      if (!session?.token) {
        setLoading(false)
        return
      }

      try {
        const me = await api.get<{
          id: string
          firstName: string
          lastName: string
          email: string
          phone: string
          role: string
          status: string
          city: { id: string; name: string }
        }>('/auth/me')
        setUser(mapBackendUserToAgent(me))
      } catch {
        authService.logout()
        setUser(null)
      } finally {
        setLoading(false)
      }
    }

    restoreSession()
  }, [])

  const login = async (input: LoginInput): Promise<AuthResponse> => {
    const response = await authService.login(input)
    setUser(response.agent)
    return response
  }

  const logout = () => {
    authService.logout()
    setUser(null)
  }

  const value = {
    user,
    loading,
    isAuthenticated: !!user,
    login,
    logout,
  }

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

import { useState } from 'react'
import type { ReactNode } from 'react'
import type { Agent, LoginInput, AuthResponse } from '../../../types/index'
import { authService } from '../services/authService'
import { AuthContext } from './AuthContext'

interface AuthProviderProps {
  children: ReactNode
}

function getInitialUser(): Agent | null {
  const session = authService.getCurrentUser()
  return session?.agent ?? null
}

export default function AuthProvider({ children }: AuthProviderProps) {
  const [user, setUser] = useState<Agent | null>(getInitialUser)
  const [loading] = useState(false)

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

import { createContext, useContext } from 'react'
import type { Agent, LoginInput, AuthResponse } from '../../../types/index'

export interface AuthContextValue {
  user: Agent | null
  loading: boolean
  isAuthenticated: boolean
  login: (input: LoginInput) => Promise<AuthResponse>
  logout: () => void
}

export const AuthContext = createContext<AuthContextValue | null>(null)

export function useAuth(): AuthContextValue {
  const context = useContext(AuthContext)
  if (!context) {
    throw new Error('useAuth doit être utilisé dans un AuthProvider')
  }
  return context
}

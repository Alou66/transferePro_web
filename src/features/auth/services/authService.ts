import type {
  Agent,
  LoginInput,
  RegisterAgentInput,
  AuthResponse,
} from '../../../types/index'
import { api } from '../../../services/api'

const SESSION_KEY = 'transferepro_session'

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

export const authService = {
  async login(input: LoginInput): Promise<AuthResponse> {
    const result = await api.post<{
      accessToken: string
      user: {
        id: string
        firstName: string
        lastName: string
        email: string
        phone: string
        role: string
        status: string
        city: { id: string; name: string }
      }
    }>('/auth/login', {
      email: input.email,
      password: input.password,
    })

    const agent = mapBackendUserToAgent(result.user)
    const session: AuthResponse = {
      agent,
      token: result.accessToken,
    }

    localStorage.setItem(SESSION_KEY, JSON.stringify(session))

    return session
  },

  async register(input: RegisterAgentInput): Promise<Agent> {
    const result = await api.post<{
      id: string
      firstName: string
      lastName: string
      email: string
      phone: string
      role: string
      status: string
      city: { id: string; name: string }
    }>('/auth/register', {
      firstName: input.firstName,
      lastName: input.lastName,
      email: input.email,
      phone: input.phone,
      password: input.password,
      cityId: input.cityId,
    })

    return mapBackendUserToAgent(result)
  },

  getCurrentUser(): AuthResponse | null {
    const raw = localStorage.getItem(SESSION_KEY)
    if (!raw) {
      return null
    }

    try {
      return JSON.parse(raw) as AuthResponse
    } catch {
      return null
    }
  },

  logout(): void {
    localStorage.removeItem(SESSION_KEY)
  },
}

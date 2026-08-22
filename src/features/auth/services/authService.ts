import type {
  Agent,
  LoginInput,
  RegisterAgentInput,
  AuthResponse,
  CreateAgentInput,
} from '../../../types/index'
import { UserRole, UserStatus } from '../../../types/index'
import { agentService } from '../../agents/services/agentService'

const SESSION_KEY = 'transferepro_session'

function generateDemoToken(agentId: string): string {
  return `demo-${agentId}-${Date.now()}`
}

export const authService = {
  async login(input: LoginInput): Promise<AuthResponse> {
    const agent = await agentService.getByEmail(input.email)

    if (!agent) {
      throw new Error('Aucun compte ne correspond à cette adresse email.')
    }

    if (agent.password !== input.password) {
      throw new Error('Mot de passe incorrect.')
    }

    if (agent.status === UserStatus.PENDING) {
      throw new Error('Votre compte est en attente de validation.')
    }

    if (agent.status === UserStatus.BLOCKED) {
      throw new Error('Votre compte a été bloqué. Veuillez contacter l\'administrateur.')
    }

    if (agent.status === UserStatus.REFUSED) {
      throw new Error('Votre demande de compte a été refusée.')
    }

    const token = generateDemoToken(agent.id)
    const session: AuthResponse = { agent, token }
    localStorage.setItem(SESSION_KEY, JSON.stringify(session))

    return session
  },

  async register(input: RegisterAgentInput): Promise<Agent> {
    const existingByEmail = await agentService.getByEmail(input.email)
    if (existingByEmail) {
      throw new Error('Un agent avec cet email existe déjà')
    }

    const existingByPhone = await agentService.getByPhone(input.phone)
    if (existingByPhone) {
      throw new Error('Un agent avec ce numéro de téléphone existe déjà')
    }

    const payload: CreateAgentInput = {
      ...input,
      role: UserRole.AGENT,
      status: UserStatus.PENDING,
    }

    return agentService.create(payload)
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

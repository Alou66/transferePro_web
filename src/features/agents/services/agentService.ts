import {
  get,
  post,
  patch,
} from '../../../services/api'
import type {
  Agent,
  City,
  CreateAgentInput,
} from '../../../types/index'
import { UserRole, UserStatus } from '../../../types/index'

export const agentService = {
  async getAll(): Promise<Agent[]> {
    return get<Agent[]>('/agents')
  },

  async getById(id: string): Promise<Agent> {
    return get<Agent>(`/agents/${id}`)
  },

  async getByEmail(email: string): Promise<Agent | null> {
    const agents = await get<Agent[]>(`/agents?email=${encodeURIComponent(email)}`)
    return agents.length > 0 ? agents[0] : null
  },

  async getByPhone(phone: string): Promise<Agent | null> {
    const agents = await get<Agent[]>(`/agents?phone=${encodeURIComponent(phone)}`)
    return agents.length > 0 ? agents[0] : null
  },

  async create(input: CreateAgentInput): Promise<Agent> {
    const now = new Date().toISOString()
    const payload = {
      ...input,
      createdAt: now,
      updatedAt: now,
    }
    return post<Agent>('/agents', payload)
  },

  async update(id: string, data: Partial<Agent>): Promise<Agent> {
    return patch<Agent>('/agents', id, {
      ...data,
      updatedAt: new Date().toISOString(),
    })
  },

  async updateStatus(id: string, status: UserStatus): Promise<Agent> {
    const agent = await agentService.getById(id)

    if (agent.role !== UserRole.AGENT) {
      throw new Error("Impossible de modifier le statut d'un administrateur")
    }

    if (status === UserStatus.ACTIVE) {
      const existingActive = await agentService.getActiveAgentByCity(agent.city)
      if (existingActive && existingActive.id !== id) {
        throw new Error(`Impossible d'activer cet agent : un agent actif est déjà affecté à la ville ${agent.city}.`)
      }
    }

    return agentService.update(id, { status })
  },

  async getActiveAgentByCity(city: City): Promise<Agent | null> {
    const agents = await get<Agent[]>(
      `/agents?city=${encodeURIComponent(city)}&role=${UserRole.AGENT}&status=${UserStatus.ACTIVE}`,
    )
    return agents.length > 0 ? agents[0] : null
  },

  async getPendingAgents(): Promise<Agent[]> {
    return get<Agent[]>(`/agents?role=${UserRole.AGENT}&status=${UserStatus.PENDING}`)
  },
}

import {
  get,
  post,
  patch,
} from '../../../services/api'
import type {
  Agent,
  CreateAgentInput,
} from '../../../types/index'
import { UserRole, UserStatus } from '../../../types/index'
import { cityService } from '../../cities/services/cityService'

function mapAgent(raw: {
  id: string
  firstName: string
  lastName: string
  phone: string
  email: string
  role: string
  status: string
  city: { id: string; name: string }
  createdAt?: string
  updatedAt?: string
}): Agent {
  return {
    id: raw.id,
    firstName: raw.firstName,
    lastName: raw.lastName,
    phone: raw.phone,
    email: raw.email,
    password: '',
    city: raw.city?.name ?? '',
    role: raw.role as Agent['role'],
    status: raw.status as Agent['status'],
    createdAt: raw.createdAt ?? new Date().toISOString(),
    updatedAt: raw.updatedAt ?? new Date().toISOString(),
  }
}

function mapAgents(raw: Array<{
  id: string
  firstName: string
  lastName: string
  phone: string
  email: string
  role: string
  status: string
  city: { id: string; name: string }
  createdAt?: string
  updatedAt?: string
}>): Agent[] {
  return raw.map(mapAgent)
}

export const agentService = {
  async getAll(): Promise<Agent[]> {
    const data = await get<Array<{
      id: string
      firstName: string
      lastName: string
      phone: string
      email: string
      role: string
      status: string
      city: { id: string; name: string }
      createdAt?: string
      updatedAt?: string
    }>>('/agents')
    return mapAgents(data)
  },

  async getById(id: string): Promise<Agent> {
    const data = await get<{
      id: string
      firstName: string
      lastName: string
      phone: string
      email: string
      role: string
      status: string
      city: { id: string; name: string }
      createdAt?: string
      updatedAt?: string
    }>(`/agents/${id}`)
    return mapAgent(data)
  },

  async create(input: CreateAgentInput): Promise<Agent> {
    const now = new Date().toISOString()
    const payload = {
      ...input,
      createdAt: now,
      updatedAt: now,
    }
    const data = await post<{
      id: string
      firstName: string
      lastName: string
      phone: string
      email: string
      role: string
      status: string
      city: { id: string; name: string }
      createdAt?: string
      updatedAt?: string
    }>('/agents', payload)
    return mapAgent(data)
  },

  async update(id: string, data: Partial<Agent>): Promise<Agent> {
    const updated = await patch<{
      id: string
      firstName: string
      lastName: string
      phone: string
      email: string
      role: string
      status: string
      city: { id: string; name: string }
      createdAt?: string
      updatedAt?: string
    }>('/agents', id, {
      ...data,
      updatedAt: new Date().toISOString(),
    })
    return mapAgent(updated)
  },

  async activateAgent(id: string): Promise<Agent> {
    const updated = await patch<{
      id: string
      firstName: string
      lastName: string
      phone: string
      email: string
      role: string
      status: string
      city: { id: string; name: string }
      createdAt?: string
      updatedAt?: string
    }>(`/agents/${id}/activate`, undefined, {})
    return mapAgent(updated)
  },

  async refuseAgent(id: string): Promise<Agent> {
    const updated = await patch<{
      id: string
      firstName: string
      lastName: string
      phone: string
      email: string
      role: string
      status: string
      city: { id: string; name: string }
      createdAt?: string
      updatedAt?: string
    }>(`/agents/${id}/refuse`, undefined, {})
    return mapAgent(updated)
  },

  async blockAgent(id: string): Promise<Agent> {
    const updated = await patch<{
      id: string
      firstName: string
      lastName: string
      phone: string
      email: string
      role: string
      status: string
      city: { id: string; name: string }
      createdAt?: string
      updatedAt?: string
    }>(`/agents/${id}/block`, undefined, {})
    return mapAgent(updated)
  },

  async reactivateAgent(id: string): Promise<Agent> {
    const updated = await patch<{
      id: string
      firstName: string
      lastName: string
      phone: string
      email: string
      role: string
      status: string
      city: { id: string; name: string }
      createdAt?: string
      updatedAt?: string
    }>(`/agents/${id}/reactivate`, undefined, {})
    return mapAgent(updated)
  },

  async updateStatus(id: string, status: UserStatus): Promise<Agent> {
    const agent = await agentService.getById(id)

    if (agent.role !== UserRole.AGENT) {
      throw new Error("Impossible de modifier le statut d'un administrateur")
    }

    if (status === UserStatus.ACTIVE && agent.status === UserStatus.ACTIVE) {
      return agent
    }

    if (status === UserStatus.ACTIVE) {
      const cities = await cityService.getAll()
      const city = cities.find((c) => c.name === agent.city)
      const cityId = city?.id

      if (!cityId) {
        throw new Error(`Ville introuvable pour l'agent : ${agent.city}`)
      }

      const existingActive = await agentService.getActiveAgentByCity(cityId)
      if (existingActive && existingActive.id !== id) {
        throw new Error(`Impossible d'activer cet agent : un agent actif est déjà affecté à la ville ${agent.city}.`)
      }
    }

    if (status === UserStatus.ACTIVE && (agent.status === UserStatus.BLOCKED || agent.status === UserStatus.REFUSED)) {
      return agentService.reactivateAgent(id)
    }

    switch (status) {
      case UserStatus.ACTIVE:
        return agentService.activateAgent(id)
      case UserStatus.REFUSED:
        return agentService.refuseAgent(id)
      case UserStatus.BLOCKED:
        return agentService.blockAgent(id)
      default:
        throw new Error(`Transition de statut non autorisée vers ${status}`)
    }
  },

  async getActiveAgentByCity(cityId: string): Promise<Agent | null> {
    const agents = await get<Array<{
      id: string
      firstName: string
      lastName: string
      phone: string
      email: string
      role: string
      status: string
      city: { id: string; name: string }
      createdAt?: string
      updatedAt?: string
    }>>(
      `/agents?cityId=${encodeURIComponent(cityId)}&role=${UserRole.AGENT}&status=${UserStatus.ACTIVE}`,
    )
    const mapped = mapAgents(agents)
    return mapped.length > 0 ? mapped[0] : null
  },

  async getPendingAgents(): Promise<Agent[]> {
    const data = await get<Array<{
      id: string
      firstName: string
      lastName: string
      phone: string
      email: string
      role: string
      status: string
      city: { id: string; name: string }
      createdAt?: string
      updatedAt?: string
    }>>(`/agents?role=${UserRole.AGENT}&status=${UserStatus.PENDING}`)
    return mapAgents(data)
  },
}

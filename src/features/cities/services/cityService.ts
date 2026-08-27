import { api } from '../../../services/api'
import { UserRole, UserStatus } from '../../../types/index'

export interface CityModel {
  id: string
  name: string
  isActive: boolean
  createdAt: string
}

export interface CityCreateInput {
  name: string
}

export interface CityUpdateInput {
  name?: string
  isActive?: boolean
}

export async function getAll(): Promise<CityModel[]> {
  const data = await api.get<CityModel[]>('/cities')
  return data.sort((a: CityModel, b: CityModel) => a.name.localeCompare(b.name))
}

export async function getActive(): Promise<CityModel[]> {
  return api.get<CityModel[]>('/cities/active')
}

export async function getById(id: string): Promise<CityModel> {
  return api.get<CityModel>(`/cities/${id}`)
}

export async function create(input: CityCreateInput): Promise<CityModel> {
  const name = input.name.trim()
  if (!name) {
    throw new Error('Le nom de la ville est requis.')
  }

  const existing = await api.get<CityModel[]>('/cities')
  const duplicate = existing.find(
    (city: CityModel) => city.name.toLowerCase() === name.toLowerCase(),
  )

  if (duplicate) {
    throw new Error('Une ville avec ce nom existe déjà.')
  }

  const now = new Date().toISOString()
  return api.post<CityModel>('/cities', {
    name,
    isActive: true,
    createdAt: now,
  })
}

export async function update(id: string, input: CityUpdateInput): Promise<CityModel> {
  if (input.name !== undefined) {
    const name = input.name.trim()
    if (!name) {
      throw new Error('Le nom de la ville est requis.')
    }

    const existing = await api.get<CityModel[]>('/cities')
    const duplicate = existing.find(
      (city: CityModel) => city.id !== id && city.name.toLowerCase() === name.toLowerCase(),
    )

    if (duplicate) {
      throw new Error('Une ville avec ce nom existe déjà.')
    }
  }

  return api.patch<CityModel>('/cities', id, input)
}

export async function activate(id: string): Promise<CityModel> {
  return api.patch<CityModel>(`/cities/${id}/activate`, undefined, {})
}

export async function deactivate(id: string): Promise<CityModel> {
  const city = await getById(id)
  const agents = await api.get<{
    id: string
    city: { id: string; name: string }
    role: string
    status: string
  }[]>('/agents')

  const hasActiveAgent = agents.some(
    (agent) =>
      agent.role === UserRole.AGENT &&
      agent.status === UserStatus.ACTIVE &&
      agent.city?.name?.toLowerCase() === city.name.toLowerCase(),
  )

  if (hasActiveAgent) {
    throw new Error(
      'Impossible de désactiver cette ville car un agent actif y est actuellement affecté. Veuillez d\'abord bloquer cet agent.',
    )
  }

  return api.patch<CityModel>(`/cities/${id}/deactivate`, undefined, {})
}

export async function getAvailableForRegistration(): Promise<CityModel[]> {
  return api.get<CityModel[]>('/cities/available-for-registration')
}

export const cityService = {
  getAll,
  getActive,
  getById,
  create,
  update,
  activate,
  deactivate,
  getAvailableForRegistration,
}

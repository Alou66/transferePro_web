import { api } from '../../../services/api'
import type { CashCollection } from '../../../types/index'

export interface CashCollectionCreateInput {
  agentId: string
  amount: number
  collectedAt: string
  createdBy: string
  notes?: string
}

export async function getAll(): Promise<CashCollection[]> {
  return api.get<CashCollection[]>('/cash-collections')
}

export async function getById(id: string): Promise<CashCollection> {
  return api.get<CashCollection>(`/cash-collections/${id}`)
}

export async function getByAgentId(agentId: string): Promise<CashCollection[]> {
  return api.get<CashCollection[]>(`/cash-collections?agentId=${agentId}`)
}

export async function getLastCollectionForAgent(agentId: string): Promise<CashCollection | null> {
  const collections = await getByAgentId(agentId)

  if (collections.length === 0) {
    return null
  }

  return collections.reduce((latest, current) => {
    return new Date(current.collectedAt).getTime() > new Date(latest.collectedAt).getTime()
      ? current
      : latest
  })
}

export async function create(input: CashCollectionCreateInput): Promise<CashCollection> {
  const now = new Date().toISOString()
  return api.post<CashCollection>('/cash-collections', {
    ...input,
    createdAt: now,
  })
}

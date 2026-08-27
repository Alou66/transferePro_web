import { api } from '../../../services/api'
import type { CashCollection, PaginatedResponse } from '../../../types/index'

export interface CashCollectionCreateInput {
  agentId: string
  amount: number
  collectedAt: string
  createdBy: string
  notes?: string
}

// Le back plafonne `limit` à 100 (voir cashCollectionsQuerySchema côté API).
const MAX_PAGE_SIZE = 100

// Utilisé pour l'affichage complet de l'historique des récupérations :
// récupère systématiquement l'intégralité des collectes, toutes pages confondues.
export async function getByAgentId(agentId: string): Promise<CashCollection[]> {
  const first = await api.get<PaginatedResponse<CashCollection>>(
    `/agents/${agentId}/cash-collections?page=1&limit=${MAX_PAGE_SIZE}`,
  )
  const items = first.items.slice()

  for (let page = 2; page <= first.pagination.totalPages; page++) {
    const next = await api.get<PaginatedResponse<CashCollection>>(
      `/agents/${agentId}/cash-collections?page=${page}&limit=${MAX_PAGE_SIZE}`,
    )
    items.push(...next.items)
  }

  return items
}

export async function create(input: CashCollectionCreateInput): Promise<CashCollection> {
  const now = new Date().toISOString()
  return api.post<CashCollection>(`/agents/${input.agentId}/cash-collections`, {
    ...input,
    createdAt: now,
  })
}

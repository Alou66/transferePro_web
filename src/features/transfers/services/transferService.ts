import {
  get,
  post,
} from '../../../services/api'
import type {
  Transfer,
  CreateTransferInput,
  PaginatedResponse,
} from '../../../types/index'
import { TransferStatus } from '../../../types/index'

// Le back plafonne `limit` à 100 (voir listTransfersQuerySchema côté API).
const MAX_PAGE_SIZE = 100

// Récupère toutes les pages d'un endpoint paginé. Réservé aux écrans qui ont
// besoin de la totalité des transferts pour un calcul (soldes, statistiques) :
// pour un simple affichage de liste, préférer une pagination réelle côté UI.
async function fetchAllPages(path: string): Promise<Transfer[]> {
  const separator = path.includes('?') ? '&' : '?'
  const first = await get<PaginatedResponse<Transfer>>(`${path}${separator}page=1&limit=${MAX_PAGE_SIZE}`)
  const items = first.items.slice()

  for (let page = 2; page <= first.pagination.totalPages; page++) {
    const next = await get<PaginatedResponse<Transfer>>(`${path}${separator}page=${page}&limit=${MAX_PAGE_SIZE}`)
    items.push(...next.items)
  }

  return items
}

export const transferService = {
  async getAll(page = 1, limit = 20): Promise<PaginatedResponse<Transfer>> {
    return get<PaginatedResponse<Transfer>>(`/transfers?page=${page}&limit=${limit}`)
  },

  // Récupère l'intégralité des transferts (toutes pages confondues), pour les
  // écrans qui calculent des totaux/statistiques sur l'ensemble des données.
  async getAllExhaustive(): Promise<Transfer[]> {
    return fetchAllPages('/transfers')
  },

  async getById(id: string): Promise<Transfer> {
    return get<Transfer>(`/transfers/${id}`)
  },

  async getWithdrawalCode(id: string): Promise<{ withdrawalCode: string }> {
    return get<{ withdrawalCode: string }>(`/transfers/${id}/withdrawal-code`)
  },

  async getIncomingForAgent(
    page = 1,
    limit = 20,
    statuses?: TransferStatus[],
  ): Promise<PaginatedResponse<Transfer>> {
    const statusParam = statuses?.length ? `&status=${statuses.join(',')}` : ''
    return get<PaginatedResponse<Transfer>>(`/transfers/incoming?page=${page}&limit=${limit}${statusParam}`)
  },

  // Utilisé uniquement pour des calculs (solde agent, historique complet) :
  // récupère systématiquement l'intégralité des transferts de l'agent.
  async getAllForAgent(): Promise<Transfer[]> {
    return fetchAllPages('/transfers/my-all')
  },

  // Utilisé uniquement pour calculer le solde opérationnel d'un agent (vue admin) :
  // récupère systématiquement l'intégralité de ses transferts.
  async getByAgentForAdmin(agentId: string): Promise<Transfer[]> {
    return fetchAllPages(`/transfers/agent/${agentId}`)
  },

  async create(input: CreateTransferInput): Promise<Transfer> {
    return post<Transfer>('/transfers', input)
  },

  async cancel(id: string): Promise<{ id: string; reference: string; status: TransferStatus; message: string }> {
    return post<{ id: string; reference: string; status: TransferStatus; message: string }>(`/transfers/${id}/cancel`, {})
  },

  async adminCancel(id: string): Promise<{ id: string; reference: string; status: TransferStatus; message: string }> {
    return post<{ id: string; reference: string; status: TransferStatus; message: string }>(`/transfers/${id}/admin-cancel`, {})
  },

  async markAsPaid(id: string): Promise<Transfer> {
    return post<Transfer>(`/transfers/${id}/pay`, {})
  },

  async verifyWithdrawalCode(id: string, code: string): Promise<{ id: string; reference: string; status: TransferStatus; message: string }> {
    return post<{ id: string; reference: string; status: TransferStatus; message: string }>(`/transfers/${id}/verify-code`, {
      withdrawalCode: code,
    })
  },
}

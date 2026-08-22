import {
  get,
  post,
  patch,
} from '../../../services/api'
import type {
  Transfer,
  CreateTransferInput,
  UpdateTransferStatusInput,
} from '../../../types/index'
import { TransferStatus } from '../../../types/index'
import { agentService } from '../../agents/services/agentService'

const generateReference = (): string => {
  const now = new Date()
  const year = now.getFullYear()
  const seq = String(now.getTime()).slice(-4)
  return `TRF-${year}-${seq}`
}

const generateWithdrawalCode = (): string => {
  return Math.floor(Math.random() * 10000)
    .toString()
    .padStart(4, '0')
}

export const transferService = {
  async getAll(): Promise<Transfer[]> {
    return get<Transfer[]>('/transfers')
  },

  async getById(id: string): Promise<Transfer> {
    return get<Transfer>(`/transfers/${id}`)
  },

  async getByOriginAgentId(agentId: string): Promise<Transfer[]> {
    return get<Transfer[]>(`/transfers?originAgentId=${agentId}`)
  },

  async getByDestinationAgentId(agentId: string): Promise<Transfer[]> {
    return get<Transfer[]>(`/transfers?destinationAgentId=${agentId}`)
  },

  async getCreatedByAgent(agentId: string): Promise<Transfer[]> {
    return transferService.getByOriginAgentId(agentId)
  },

  async getIncomingForAgent(agentId: string): Promise<Transfer[]> {
    return transferService.getByDestinationAgentId(agentId)
  },

  async getPaidByAgent(agentId: string): Promise<Transfer[]> {
    return get<Transfer[]>(`/transfers?paidByAgentId=${agentId}&status=${TransferStatus.PAID}`)
  },

  async getAllForAgent(agentId: string): Promise<Transfer[]> {
    const [created, incoming, paid] = await Promise.all([
      transferService.getByOriginAgentId(agentId),
      transferService.getByDestinationAgentId(agentId),
      transferService.getPaidByAgent(agentId),
    ])

    const map = new Map<string, Transfer>()
    for (const transfer of [...created, ...incoming, ...paid]) {
      map.set(transfer.id, transfer)
    }
    return Array.from(map.values()).sort((a, b) =>
      new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
    )
  },

  async getByStatus(status: TransferStatus): Promise<Transfer[]> {
    return get<Transfer[]>(`/transfers?status=${status}`)
  },

  async create(input: CreateTransferInput, originAgentId: string): Promise<Transfer> {
    const originAgent = await agentService.getById(originAgentId)
    const destinationAgent = await agentService.getActiveAgentByCity(input.destinationCity)

    if (!destinationAgent) {
      throw new Error("Aucun agent actif trouvé pour cette ville de destination")
    }

    if (destinationAgent.id === originAgentId) {
      throw new Error("L'agent de destination ne peut pas être le même que l'agent d'origine")
    }

    const totalAmount = input.amount + input.fee
    const now = new Date().toISOString()

    const payload = {
      reference: generateReference(),
      senderName: input.senderName,
      senderPhone: input.senderPhone,
      receiverName: input.receiverName,
      receiverPhone: input.receiverPhone,
      originAgentId,
      destinationAgentId: destinationAgent.id,
      originCity: originAgent.city,
      destinationCity: input.destinationCity,
      amount: input.amount,
      fee: input.fee,
      totalAmount,
      withdrawalCode: generateWithdrawalCode(),
      status: TransferStatus.CREATED,
      createdAt: now,
      updatedAt: now,
      paidAt: null,
      paidByAgentId: null,
    }

    return post<Transfer>('/transfers', payload)
  },

  async update(id: string, data: Partial<Transfer>): Promise<Transfer> {
    return patch<Transfer>('/transfers', id, {
      ...data,
      updatedAt: new Date().toISOString(),
    })
  },

  async updateStatus(id: string, statusData: UpdateTransferStatusInput): Promise<Transfer> {
    return transferService.update(id, statusData)
  },

  async cancel(id: string): Promise<Transfer> {
    const transfer = await transferService.getById(id)

    if (transfer.status === TransferStatus.PAID) {
      throw new Error("Impossible d'annuler un transfert déjà payé")
    }

    if (transfer.status === TransferStatus.CANCELLED) {
      throw new Error('Ce transfert est déjà annulé')
    }

    return transferService.updateStatus(id, { status: TransferStatus.CANCELLED })
  },

  async markAsPaid(id: string, paidByAgentId: string): Promise<Transfer> {
    const transfer = await transferService.getById(id)

    if (transfer.status === TransferStatus.PAID) {
      throw new Error('Ce transfert a déjà été payé')
    }

    if (transfer.status === TransferStatus.CANCELLED) {
      throw new Error("Impossible de payer un transfert annulé")
    }

    if (transfer.status !== TransferStatus.READY_FOR_PAYMENT) {
      throw new Error('Le code de retrait doit être vérifié avant de pouvoir effectuer le paiement.')
    }

    if (transfer.destinationAgentId !== paidByAgentId) {
      throw new Error("Vous n'êtes pas autorisé à effectuer le paiement de ce transfert.")
    }

    const now = new Date().toISOString()

    return transferService.update(id, {
      status: TransferStatus.PAID,
      paidAt: now,
      paidByAgentId,
      updatedAt: now,
    })
  },
}

import type { Transfer, CashCollection } from '../../../types/index'
import { TransferStatus } from '../../../types/index'
import { getLastCollectionForAgent } from '../services/cashCollectionService'

export interface AgentStats {
  totalCollected: number
  totalDebited: number
  feesGenerated: number
  operationalBalance: number
}

export interface CollectionPeriod {
  agentId: string
  startDate: string | null
  endDate: string
  lastCollection: CashCollection | null
  isFirstPeriod: boolean
}

export function calculateAgentStats(
  transfers: Transfer[],
  agentId: string,
  activeFrom?: string,
): AgentStats {
  let created = transfers.filter(
    (t) => t.originAgentId === agentId && t.status !== TransferStatus.CANCELLED,
  )

  let paid = transfers.filter(
    (t) => t.paidByAgentId === agentId && t.status === TransferStatus.PAID,
  )

  if (activeFrom) {
    const threshold = new Date(activeFrom).getTime()
    created = created.filter((t) => new Date(t.createdAt).getTime() > threshold)
    paid = paid.filter((t) => new Date(t.createdAt).getTime() > threshold)
  }

  const totalCollected = created.reduce((sum, t) => sum + t.amount + t.fee, 0)
  const totalDebited = paid.reduce((sum, t) => sum + t.amount, 0)
  const feesGenerated = created.reduce((sum, t) => sum + t.fee, 0)
  const operationalBalance = totalCollected - totalDebited

  return {
    totalCollected,
    totalDebited,
    feesGenerated,
    operationalBalance,
  }
}

export async function getActivePeriodStart(agentId: string): Promise<string | null> {
  const lastCollection = await getLastCollectionForAgent(agentId)
  return lastCollection?.collectedAt ?? null
}

export async function getCurrentCollectionPeriod(agentId: string): Promise<CollectionPeriod> {
  const lastCollection = await getLastCollectionForAgent(agentId)

  if (!lastCollection) {
    return {
      agentId,
      startDate: null,
      endDate: new Date().toISOString(),
      lastCollection: null,
      isFirstPeriod: true,
    }
  }

  return {
    agentId,
    startDate: lastCollection.collectedAt,
    endDate: new Date().toISOString(),
    lastCollection,
    isFirstPeriod: false,
  }
}

import { TransferStatus } from '../../../types/index'
import type { Transfer, Agent, City } from '../../../types/index'

export interface DateRange {
  startDate: string
  endDate: string
}

export interface FinancialIndicators {
  totalVolume: number
  paidAmount: number
  pendingAmount: number
  feesGenerated: number
}

export interface CityStats {
  city: City
  totalTransfers: number
  volume: number
  paidAmount: number
  pendingAmount: number
  feesGenerated: number
}

export interface AgentPerformance {
  agent: Agent
  createdTransfers: number
  receivedTransfers: number
  paymentsMade: number
  amountSent: number
  amountPaid: number
  feesGenerated: number
  activityScore: number
}

export function isWithinDateRange(createdAt: string, range: DateRange): boolean {
  const date = new Date(createdAt)
  const start = new Date(range.startDate)
  const end = new Date(range.endDate)
  end.setHours(23, 59, 59, 999)
  return date >= start && date <= end
}

export function filterTransfersByDateRange(transfers: Transfer[], range: DateRange): Transfer[] {
  return transfers.filter((t) => isWithinDateRange(t.createdAt, range))
}

export function calculateFinancialIndicators(transfers: Transfer[]): FinancialIndicators {
  const nonCancelled = transfers.filter((t) => t.status !== TransferStatus.CANCELLED)
  const paid = transfers.filter((t) => t.status === TransferStatus.PAID)
  const pending = transfers.filter((t) => t.status === TransferStatus.CREATED || t.status === TransferStatus.READY_FOR_PAYMENT)

  return {
    totalVolume: nonCancelled.reduce((sum, t) => sum + t.amount, 0),
    paidAmount: paid.reduce((sum, t) => sum + t.amount, 0),
    pendingAmount: pending.reduce((sum, t) => sum + t.amount, 0),
    feesGenerated: paid.reduce((sum, t) => sum + t.fee, 0),
  }
}

export function calculateCityStats(transfers: Transfer[], cities?: City[]): CityStats[] {
  const cityList = cities || Array.from(new Set(transfers.map((t) => t.destinationCity?.name ?? '')))

  return cityList.map((city) => {
    const cityTransfers = transfers.filter((t) => t.destinationCity?.name === city)
    const nonCancelled = cityTransfers.filter((t) => t.status !== TransferStatus.CANCELLED)
    const paid = cityTransfers.filter((t) => t.status === TransferStatus.PAID)

    return {
      city,
      totalTransfers: cityTransfers.length,
      volume: nonCancelled.reduce((sum, t) => sum + t.amount, 0),
      paidAmount: paid.reduce((sum, t) => sum + t.amount, 0),
      pendingAmount: cityTransfers
        .filter((t) => t.status === TransferStatus.CREATED || t.status === TransferStatus.READY_FOR_PAYMENT)
        .reduce((sum, t) => sum + t.amount, 0),
      feesGenerated: paid.reduce((sum, t) => sum + t.fee, 0),
    }
  })
}

export function calculateAgentPerformance(agents: Agent[], transfers: Transfer[]): AgentPerformance[] {
  return agents.map((agent) => {
    const created = transfers.filter((t) => t.originAgentId === agent.id && t.status !== TransferStatus.CANCELLED)
    const received = transfers.filter((t) => t.destinationAgentId === agent.id)
    const paid = transfers.filter((t) => t.paidByAgentId === agent.id && t.status === TransferStatus.PAID)

    const amountSent = created.reduce((sum, t) => sum + t.amount, 0)
    const amountPaid = paid.reduce((sum, t) => sum + t.amount, 0)
    const feesGenerated = paid.reduce((sum, t) => sum + t.fee, 0)

    const activityScore = created.length + received.length + paid.length

    return {
      agent,
      createdTransfers: created.length,
      receivedTransfers: received.length,
      paymentsMade: paid.length,
      amountSent,
      amountPaid,
      feesGenerated,
      activityScore,
    }
  })
}

export function getTopAgents(performances: AgentPerformance[], limit = 5): AgentPerformance[] {
  return [...performances]
    .sort((a, b) => b.activityScore - a.activityScore || b.amountPaid - a.amountPaid)
    .slice(0, limit)
}

export function getDefaultDateRange(): DateRange {
  const end = new Date()
  const start = new Date()
  start.setDate(end.getDate() - 30)

  return {
    startDate: start.toISOString().split('T')[0],
    endDate: end.toISOString().split('T')[0],
  }
}

export function getTodayRange(): DateRange {
  const today = new Date().toISOString().split('T')[0]
  return { startDate: today, endDate: today }
}

export function getLast7DaysRange(): DateRange {
  const end = new Date()
  const start = new Date()
  start.setDate(end.getDate() - 6)

  return {
    startDate: start.toISOString().split('T')[0],
    endDate: end.toISOString().split('T')[0],
  }
}

export function getLast30DaysRange(): DateRange {
  const end = new Date()
  const start = new Date()
  start.setDate(end.getDate() - 29)

  return {
    startDate: start.toISOString().split('T')[0],
    endDate: end.toISOString().split('T')[0],
  }
}

export function getAllTimeRange(): DateRange {
  return { startDate: '2000-01-01', endDate: '2100-12-31' }
}

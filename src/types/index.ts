export enum UserRole {
  ADMIN = 'ADMIN',
  AGENT = 'AGENT',
}

export enum UserStatus {
  PENDING = 'PENDING',
  ACTIVE = 'ACTIVE',
  BLOCKED = 'BLOCKED',
  REFUSED = 'REFUSED',
}

export enum TransferStatus {
  CREATED = 'CREATED',
  READY_FOR_PAYMENT = 'READY_FOR_PAYMENT',
  PAID = 'PAID',
  CANCELLED = 'CANCELLED',
}

export type City = string

export interface CityModel {
  id: string
  name: string
  isActive: boolean
  createdAt: string
}

export interface Agent {
  id: string
  firstName: string
  lastName: string
  phone: string
  email: string
  password: string
  city: City
  role: UserRole
  status: UserStatus
  createdAt: string
  updatedAt: string
}

export interface Transfer {
  id: string
  reference: string
  senderName: string
  senderPhone: string
  recipientName: string
  recipientPhone: string
  originAgentId: string
  destinationAgentId: string
  originCity: {
    id: string
    name: string
  }
  destinationCity: {
    id: string
    name: string
  }
  amount: number
  fee: number
  // Présent uniquement dans la réponse de création (transferService.create) :
  // le back ne le renvoie plus dans les listes/détails, voir GET /transfers/:id/withdrawal-code.
  withdrawalCode?: string
  status: TransferStatus
  createdAt: string
  updatedAt: string
  paidAt: string | null
  paidByAgentId: string | null
}

export interface RegisterAgentInput {
  firstName: string
  lastName: string
  phone: string
  email: string
  password: string
  cityId: string
}

export interface LoginInput {
  email: string
  password: string
}

export interface CreateTransferInput {
  senderName: string
  senderPhone: string
  recipientName: string
  recipientPhone: string
  destinationCityId: string
  amount: number
}

export interface PaginatedResponse<T> {
  items: T[]
  pagination: {
    page: number
    limit: number
    total: number
    totalPages: number
  }
}

export interface CashCollection {
  id: string
  agentId: string
  amount: number
  collectedAt: string
  createdBy: string
  notes?: string
  createdAt: string
  admin?: {
    id: string
    firstName: string
    lastName: string
    email: string
    phone: string
  }
}

export interface AuthResponse {
  agent: Agent
  token: string
}

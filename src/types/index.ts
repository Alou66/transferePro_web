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

export enum City {
  DAKAR = 'Dakar',
  ZIGUINCHOR = 'Ziguinchor',
  CONAKRY = 'Conakry',
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
  receiverName: string
  receiverPhone: string
  originAgentId: string
  destinationAgentId: string
  originCity: City
  destinationCity: City
  amount: number
  fee: number
  totalAmount: number
  withdrawalCode: string
  status: TransferStatus
  createdAt: string
  updatedAt: string
  paidAt: string | null
  paidByAgentId: string | null
}

export interface CreateAgentInput {
  firstName: string
  lastName: string
  phone: string
  email: string
  password: string
  city: City
  role: UserRole
  status: UserStatus
}

export interface RegisterAgentInput {
  firstName: string
  lastName: string
  phone: string
  email: string
  password: string
  city: City
}

export interface LoginInput {
  email: string
  password: string
}

export interface CreateTransferInput {
  senderName: string
  senderPhone: string
  receiverName: string
  receiverPhone: string
  destinationCity: City
  amount: number
  fee: number
}

export interface UpdateTransferStatusInput {
  status: TransferStatus
  paidAt?: string | null
  paidByAgentId?: string | null
}

export interface AuthResponse {
  agent: Agent
  token: string
}

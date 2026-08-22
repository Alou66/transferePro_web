const API_BASE_URL = '/api'

async function handleResponse<T>(response: Response): Promise<T> {
  if (!response.ok) {
    const error = await response.json().catch(() => ({ message: 'Une erreur est survenue' }))
    throw new Error(error.message || `HTTP ${response.status}`)
  }
  return response.json()
}

export async function get<T>(path: string): Promise<T> {
  const response = await fetch(`${API_BASE_URL}${path}`)
  return handleResponse<T>(response)
}

export async function getById<T>(path: string, id: string): Promise<T> {
  const response = await fetch(`${API_BASE_URL}${path}/${id}`)
  return handleResponse<T>(response)
}

export async function post<T>(path: string, body: unknown): Promise<T> {
  const response = await fetch(`${API_BASE_URL}${path}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  })
  return handleResponse<T>(response)
}

export async function put<T>(path: string, id: string, body: unknown): Promise<T> {
  const response = await fetch(`${API_BASE_URL}${path}/${id}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  })
  return handleResponse<T>(response)
}

export async function patch<T>(path: string, id: string, body: unknown): Promise<T> {
  const response = await fetch(`${API_BASE_URL}${path}/${id}`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  })
  return handleResponse<T>(response)
}

export async function remove(path: string, id: string): Promise<void> {
  const response = await fetch(`${API_BASE_URL}${path}/${id}`, {
    method: 'DELETE',
  })
  if (!response.ok) {
    const error = await response.json().catch(() => ({ message: 'Une erreur est survenue' }))
    throw new Error(error.message || `HTTP ${response.status}`)
  }
}

export const api = {
  get,
  getById,
  post,
  put,
  patch,
  remove,
}

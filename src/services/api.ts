const API_BASE_URL = (import.meta.env.VITE_API_URL ?? '/api').replace(/\/$/, '')

function getAuthHeaders(): Record<string, string> {
  const raw = localStorage.getItem('transferepro_session')
  if (!raw) {
    return {}
  }

  try {
    const parsed = JSON.parse(raw)
    const token = parsed.token
    if (token) {
      return { Authorization: `Bearer ${token}` }
    }
  } catch {
    // ignore parse errors
  }

  return {}
}

async function handleResponse<T>(response: Response): Promise<T> {
  if (!response.ok) {
    const error = await response.json().catch(() => ({ message: 'Une erreur est survenue' }))
    throw new Error(error.message || `HTTP ${response.status}`)
  }

  const json = await response.json()

  if (json && typeof json === 'object' && 'data' in json && json.data !== undefined) {
    return (json as { data: T }).data
  }

  return json as T
}

export async function get<T>(path: string): Promise<T> {
  const response = await fetch(`${API_BASE_URL}${path}`, {
    headers: {
      ...getAuthHeaders(),
    },
  })
  return handleResponse<T>(response)
}

export async function getById<T>(path: string, id: string): Promise<T> {
  const response = await fetch(`${API_BASE_URL}${path}/${id}`, {
    headers: {
      ...getAuthHeaders(),
    },
  })
  return handleResponse<T>(response)
}

export async function post<T>(path: string, body: unknown): Promise<T> {
  const response = await fetch(`${API_BASE_URL}${path}`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      ...getAuthHeaders(),
    },
    body: JSON.stringify(body),
  })
  return handleResponse<T>(response)
}

export async function put<T>(path: string, id: string, body: unknown): Promise<T> {
  const response = await fetch(`${API_BASE_URL}${path}/${id}`, {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
      ...getAuthHeaders(),
    },
    body: JSON.stringify(body),
  })
  return handleResponse<T>(response)
}

export async function patch<T>(path: string, id: string | undefined, body: unknown): Promise<T> {
  const url = id !== undefined ? `${API_BASE_URL}${path}/${id}` : `${API_BASE_URL}${path}`
  const response = await fetch(url, {
    method: 'PATCH',
    headers: {
      'Content-Type': 'application/json',
      ...getAuthHeaders(),
    },
    body: JSON.stringify(body),
  })
  return handleResponse<T>(response)
}

export async function remove(path: string, id: string): Promise<void> {
  const response = await fetch(`${API_BASE_URL}${path}/${id}`, {
    method: 'DELETE',
    headers: {
      ...getAuthHeaders(),
    },
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

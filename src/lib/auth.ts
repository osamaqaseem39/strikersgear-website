import { API_BASE_URL, getCorsHeaders, getCorsConfig } from './api'

export interface LoginPayload {
  email?: string
  password: string
}

export interface RegisterPayload {
  firstName?: string
  lastName?: string
  email?: string
  password: string
}

export interface Customer {
  _id: string
  firstName: string
  lastName: string
  email: string
  phone?: string
  addresses?: any[]
  createdAt: string
  updatedAt: string
}

export async function loginCustomer(payload: LoginPayload) {
  // Backend admin auth expects only a password; extra fields are ignored.
  const res = await fetch(`${API_BASE_URL}/auth/login`, {
    method: 'POST',
    headers: {
      ...getCorsHeaders(),
      'Content-Type': 'application/json',
    },
    ...getCorsConfig(),
    body: JSON.stringify({ password: payload.password }),
  })
  if (!res.ok) throw new Error('Login failed')
  return res.json()
}

export async function registerCustomer(payload: RegisterPayload) {
  // Backend admin auth expects only a password; treat this as admin registration.
  const res = await fetch(`${API_BASE_URL}/auth/register`, {
    method: 'POST',
    headers: {
      ...getCorsHeaders(),
      'Content-Type': 'application/json',
    },
    ...getCorsConfig(),
    body: JSON.stringify({ password: payload.password }),
  })
  if (!res.ok) throw new Error('Registration failed')
  return res.json()
}

export async function getCurrentUser(token: string): Promise<Customer> {
  // Backend does not expose a profile endpoint; use /auth/status as a simple health check
  const res = await fetch(`${API_BASE_URL}/auth/status`, {
    method: 'GET',
    headers: {
      ...getCorsHeaders(),
    },
    ...getCorsConfig(),
  })
  if (!res.ok) throw new Error('Failed to get user')
  const payload = await res.json()

  // Synthesize a minimal Customer-like object from status since we only know that an admin exists.
  return {
    _id: 'admin',
    firstName: 'Admin',
    lastName: '',
    email: 'admin@local',
    phone: undefined,
    addresses: [],
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  }
}



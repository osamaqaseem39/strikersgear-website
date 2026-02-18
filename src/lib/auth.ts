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
  const res = await fetch(`${API_BASE_URL}/customers/login`, {
    method: 'POST',
    headers: {
      ...getCorsHeaders(),
      'Content-Type': 'application/json',
    },
    ...getCorsConfig(),
    body: JSON.stringify({ email: payload.email, password: payload.password }),
  })
  if (!res.ok) {
    const error = await res.json().catch(() => ({ message: 'Login failed' }))
    throw new Error(error.message || 'Login failed')
  }
  return res.json()
}

export async function registerCustomer(payload: RegisterPayload) {
  const res = await fetch(`${API_BASE_URL}/customers/register`, {
    method: 'POST',
    headers: {
      ...getCorsHeaders(),
      'Content-Type': 'application/json',
    },
    ...getCorsConfig(),
    body: JSON.stringify({
      email: payload.email,
      password: payload.password,
      firstName: payload.firstName,
      lastName: payload.lastName,
      phone: payload.phone,
    }),
  })
  if (!res.ok) {
    const error = await res.json().catch(() => ({ message: 'Registration failed' }))
    throw new Error(error.message || 'Registration failed')
  }
  return res.json()
}

export async function getCurrentUser(token: string): Promise<Customer> {
  const res = await fetch(`${API_BASE_URL}/customers/profile`, {
    method: 'GET',
    headers: {
      ...getCorsHeaders(),
      'Authorization': `Bearer ${token}`,
    },
    ...getCorsConfig(),
  })
  if (!res.ok) throw new Error('Failed to get user')
  return res.json()
}



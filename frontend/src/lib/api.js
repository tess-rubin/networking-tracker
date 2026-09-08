import { getAccessToken } from './neon.js'

export async function apiRequest(path, options = {}) {
  const token = await getAccessToken()
  if (!token) {
    const error = new Error('Your session has expired. Please sign in again.')
    error.status = 401
    throw error
  }
  const response = await fetch(path, {
    ...options,
    headers: {
      Authorization: `Bearer ${token}`,
      ...(options.body ? { 'Content-Type': 'application/json' } : {}),
      ...options.headers,
    },
  })
  const payload = await response.json().catch(() => ({}))
  if (!response.ok) {
    const error = new Error(payload.error?.message || 'Something went wrong. Please try again.')
    error.status = response.status
    error.fields = payload.error?.fields
    throw error
  }
  return payload
}


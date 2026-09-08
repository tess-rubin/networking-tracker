import { createClient } from '@neondatabase/neon-js'

export function createDataClient(token) {
  const url = process.env.VITE_NEON_DATA_API_URL
  if (!url) throw new Error('VITE_NEON_DATA_API_URL is not configured')
  return createClient({ dataApi: { url, getToken: async () => token } })
}


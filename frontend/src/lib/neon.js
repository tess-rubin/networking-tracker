import { createClient } from '@neondatabase/neon-js'
import { BetterAuthReactAdapter } from '@neondatabase/neon-js/auth/react/adapters'

const authUrl = import.meta.env.VITE_NEON_AUTH_URL
const dataApiUrl = import.meta.env.VITE_NEON_DATA_API_URL

export const isConfigured = Boolean(authUrl && dataApiUrl && !authUrl.includes('your-neon'))

export const neon = isConfigured
  ? createClient({
      auth: { adapter: BetterAuthReactAdapter(), url: authUrl },
      dataApi: { url: dataApiUrl },
    })
  : null

export async function getAccessToken(authClient = neon?.auth) {
  if (!authClient) return null
  const result = await authClient.getSession()
  if (result?.error) throw new Error(result.error.message || 'Could not restore your session.')
  return result?.data?.session?.token || null
}

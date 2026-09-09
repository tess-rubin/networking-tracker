import { createClient } from '@neondatabase/neon-js'

const required = ['VITE_NEON_AUTH_URL', 'VITE_NEON_DATA_API_URL', 'TEST_USER_A_EMAIL', 'TEST_USER_A_PASSWORD', 'TEST_USER_B_EMAIL', 'TEST_USER_B_PASSWORD']
const testOrigin = process.env.TEST_APP_ORIGIN || 'http://localhost:5173'

const missing = required.filter((key) => !process.env[key])
if (missing.length) {
  console.error(`Missing required environment variables: ${missing.join(', ')}`)
  process.exit(1)
}

function authEndpoint(path) {
  return `${process.env.VITE_NEON_AUTH_URL.replace(/\/$/, '')}/${path}`
}

async function authenticate(email, password, label) {
  const signIn = await fetch(authEndpoint('sign-in/email'), {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Origin: testOrigin },
    body: JSON.stringify({ email, password }),
  })
  if (!signIn.ok) throw new Error(`${label} sign-in failed with status ${signIn.status}`)

  const setCookies = signIn.headers.getSetCookie?.() || [signIn.headers.get('set-cookie')].filter(Boolean)
  const cookie = setCookies.map((value) => value.split(';', 1)[0]).join('; ')
  if (!cookie) throw new Error(`${label} sign-in did not return a session cookie`)

  const sessionResponse = await fetch(authEndpoint('get-session'), {
    headers: { Cookie: cookie, Origin: testOrigin },
  })
  if (!sessionResponse.ok) throw new Error(`${label} session failed with status ${sessionResponse.status}`)
  const token = sessionResponse.headers.get('set-auth-jwt')
  if (!token) throw new Error(`${label} session did not return a JWT`)

  return {
    token,
    signOut: () => fetch(authEndpoint('sign-out'), {
      method: 'POST',
      headers: { Cookie: cookie, Origin: testOrigin },
    }),
  }
}

function testClient(token) {
  return createClient({
    dataApi: { url: process.env.VITE_NEON_DATA_API_URL, getToken: async () => token },
  })
}

const authA = await authenticate(process.env.TEST_USER_A_EMAIL, process.env.TEST_USER_A_PASSWORD, 'User A')
const authB = await authenticate(process.env.TEST_USER_B_EMAIL, process.env.TEST_USER_B_PASSWORD, 'User B')
const a = testClient(authA.token)
const b = testClient(authB.token)
let aId
let bId

async function assertOk(result, label) {
  if (result?.error) throw new Error(`${label}: ${result.error.message}`)
  return result?.data
}

try {
  const rowA = await assertOk(await a.from('contacts').insert({ name: 'RLS Test — User A', priority: 'high' }).select().single(), 'Create A contact')
  const rowB = await assertOk(await b.from('contacts').insert({ name: 'RLS Test — User B', priority: 'low' }).select().single(), 'Create B contact')
  aId = rowA.id; bId = rowB.id

  const visibleToA = await assertOk(await a.from('contacts').select('id').in('id', [aId, bId]), 'Read as A')
  const visibleToB = await assertOk(await b.from('contacts').select('id').in('id', [aId, bId]), 'Read as B')
  if (visibleToA.length !== 1 || visibleToA[0].id !== aId) throw new Error('User A could read another user\'s row')
  if (visibleToB.length !== 1 || visibleToB[0].id !== bId) throw new Error('User B could read another user\'s row')

  const crossUpdate = await a.from('contacts').update({ name: 'Unauthorized update' }).eq('id', bId).select()
  if (crossUpdate.error || crossUpdate.data?.length) throw new Error('Unexpected cross-user update behavior')
  const ownershipTransfer = await a.from('contacts').update({ user_id: 'another-user' }).eq('id', aId).select()
  if (!ownershipTransfer.error) throw new Error('RLS allowed an ownership transfer')
  const crossDelete = await a.from('contacts').delete().eq('id', bId).select()
  if (crossDelete.error || crossDelete.data?.length) throw new Error('Unexpected cross-user delete behavior')

  console.log('PASS: users can read and modify only their own contacts; ownership transfer is blocked.')
} finally {
  if (aId) await a.from('contacts').delete().eq('id', aId)
  if (bId) await b.from('contacts').delete().eq('id', bId)
  await authA.signOut()
  await authB.signOut()
}

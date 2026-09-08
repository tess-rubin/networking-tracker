import { createClient, BetterAuthVanillaAdapter } from '@neondatabase/neon-js'

const required = ['VITE_NEON_AUTH_URL', 'VITE_NEON_DATA_API_URL', 'TEST_USER_A_EMAIL', 'TEST_USER_A_PASSWORD', 'TEST_USER_B_EMAIL', 'TEST_USER_B_PASSWORD']

const missing = required.filter((key) => !process.env[key])
if (missing.length) {
  console.error(`Missing required environment variables: ${missing.join(', ')}`)
  process.exit(1)
}

function testClient() {
  return createClient({
    auth: { adapter: BetterAuthVanillaAdapter(), url: process.env.VITE_NEON_AUTH_URL },
    dataApi: { url: process.env.VITE_NEON_DATA_API_URL },
  })
}

const a = testClient()
const b = testClient()
let aId
let bId

async function assertOk(result, label) {
  if (result?.error) throw new Error(`${label}: ${result.error.message}`)
  return result?.data
}

await assertOk(await a.auth.signIn.email({ email: process.env.TEST_USER_A_EMAIL, password: process.env.TEST_USER_A_PASSWORD }), 'User A sign-in')
await assertOk(await b.auth.signIn.email({ email: process.env.TEST_USER_B_EMAIL, password: process.env.TEST_USER_B_PASSWORD }), 'User B sign-in')

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
  await a.auth.signOut()
  await b.auth.signOut()
}

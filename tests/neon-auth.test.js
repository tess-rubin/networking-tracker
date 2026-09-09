import { describe, expect, it, vi } from 'vitest'
import { getAccessToken } from '../frontend/src/lib/neon.js'

describe('getAccessToken', () => {
  it('reads the JWT from the public Better Auth session API', async () => {
    const getSession = vi.fn().mockResolvedValue({
      data: { session: { token: 'signed-neon-jwt' }, user: { id: 'user-1' } },
      error: null,
    })

    await expect(getAccessToken({ getSession })).resolves.toBe('signed-neon-jwt')
    expect(getSession).toHaveBeenCalledOnce()
  })

  it('returns null when no authenticated session exists', async () => {
    const getSession = vi.fn().mockResolvedValue({ data: null, error: null })

    await expect(getAccessToken({ getSession })).resolves.toBeNull()
  })

  it('surfaces session restoration errors without calling a proxy-only method', async () => {
    const getSession = vi.fn().mockResolvedValue({
      data: null,
      error: { message: 'Session lookup failed' },
    })

    await expect(getAccessToken({ getSession })).rejects.toThrow('Session lookup failed')
  })
})

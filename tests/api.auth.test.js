import { describe, expect, it, vi } from 'vitest'
import handler from '../api/contacts/index.js'
import itemHandler from '../api/contacts/item.js'

function response() {
  return { statusCode: 200, headers: {}, body: null, setHeader(key, value) { this.headers[key] = value }, status(code) { this.statusCode = code; return this }, json(value) { this.body = value; return this }, end() { return this } }
}

describe('contacts API authentication', () => {
  it('returns 401 when no bearer token is supplied', async () => {
    const res = response()
    await handler({ method: 'GET', headers: {}, query: {} }, res)
    expect(res.statusCode).toBe(401)
    expect(res.body.error.code).toBe('UNAUTHORIZED')
  })
  it('answers CORS preflight without requiring a session', async () => {
    const res = response()
    await handler({ method: 'OPTIONS', headers: {} }, res)
    expect(res.statusCode).toBe(204)
    expect(res.headers['Access-Control-Allow-Methods']).toContain('GET')
  })
  it('protects the static edit and delete route', async () => {
    const res = response()
    await itemHandler({ method: 'PATCH', headers: {}, query: { id: '00000000-0000-4000-8000-000000000000' } }, res)
    expect(res.statusCode).toBe(401)
    expect(res.body.error.code).toBe('UNAUTHORIZED')
  })
  it('rejects an invalid contact ID before accessing the database', async () => {
    const res = response()
    await itemHandler({ method: 'DELETE', headers: { authorization: 'Bearer test-token' }, query: { id: 'not-a-uuid' } }, res)
    expect(res.statusCode).toBe(400)
    expect(res.body.error.code).toBe('VALIDATION_ERROR')
  })
})

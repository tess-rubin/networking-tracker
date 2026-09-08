import { describe, expect, it, vi } from 'vitest'
import handler from '../api/contacts/index.js'

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
})


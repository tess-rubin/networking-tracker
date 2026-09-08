import { describe, expect, it } from 'vitest'
import { contactInputSchema, contactQuerySchema, toDatabaseContact } from '../shared/contacts.js'

const valid = { name: '  Maya Chen  ', company: ' Berkeley ', role: 'Founder', whereMet: 'Demo Day', notes: '', priority: 'high' }

describe('contact validation', () => {
  it('rejects an empty or whitespace-only name', () => {
    expect(contactInputSchema.safeParse({ ...valid, name: '   ' }).success).toBe(false)
  })
  it('rejects an unsupported priority', () => {
    expect(contactInputSchema.safeParse({ ...valid, priority: 'urgent' }).success).toBe(false)
  })
  it('trims input and maps only accepted fields to database columns', () => {
    const result = contactInputSchema.parse(valid)
    expect(toDatabaseContact(result)).toEqual({ name: 'Maya Chen', company: 'Berkeley', role: 'Founder', where_met: 'Demo Day', notes: '', priority: 'high' })
    expect(toDatabaseContact(result)).not.toHaveProperty('user_id')
  })
  it('rejects client-supplied ownership fields', () => {
    expect(contactInputSchema.safeParse({ ...valid, userId: 'another-user' }).success).toBe(false)
  })
  it('validates sort and order query parameters', () => {
    expect(contactQuerySchema.safeParse({ sort: 'drop table', order: 'sideways' }).success).toBe(false)
    expect(contactQuerySchema.parse({})).toMatchObject({ sort: 'updated_at', order: 'desc' })
  })
})

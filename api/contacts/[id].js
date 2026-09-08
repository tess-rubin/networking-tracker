import { z } from 'zod'
import { contactPatchSchema, formatZodError, toDatabaseContact } from '../../shared/contacts.js'
import { getBearerToken, handleDatabaseError, sendError, setCors } from '../_lib/http.js'
import { createDataClient } from '../_lib/neon.js'

const idSchema = z.string().uuid()

export default async function handler(req, res) {
  setCors(req, res)
  if (req.method === 'OPTIONS') return res.status(204).end()
  const token = getBearerToken(req)
  if (!token) return sendError(res, 401, 'UNAUTHORIZED', 'Please sign in to manage contacts.')
  const parsedId = idSchema.safeParse(req.query.id)
  if (!parsedId.success) return sendError(res, 400, 'VALIDATION_ERROR', 'The contact ID is invalid.')

  const neon = createDataClient(token)
  try {
    if (req.method === 'PATCH') {
      const parsed = contactPatchSchema.safeParse(req.body)
      if (!parsed.success) return sendError(res, 400, 'VALIDATION_ERROR', 'Please correct the highlighted fields.', formatZodError(parsed.error))
      const { data, error } = await neon.from('contacts').update(toDatabaseContact(parsed.data)).eq('id', parsedId.data).select().maybeSingle()
      if (error) throw error
      if (!data) return sendError(res, 404, 'NOT_FOUND', 'Contact not found.')
      return res.status(200).json({ data, message: 'Contact updated.' })
    }
    if (req.method === 'DELETE') {
      const { data, error } = await neon.from('contacts').delete().eq('id', parsedId.data).select('id').maybeSingle()
      if (error) throw error
      if (!data) return sendError(res, 404, 'NOT_FOUND', 'Contact not found.')
      return res.status(200).json({ data, message: 'Contact deleted.' })
    }
    res.setHeader('Allow', 'PATCH, DELETE, OPTIONS')
    return sendError(res, 405, 'METHOD_NOT_ALLOWED', 'That action is not supported.')
  } catch (error) {
    return handleDatabaseError(res, error)
  }
}


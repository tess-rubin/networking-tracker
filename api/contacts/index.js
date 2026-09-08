import { contactInputSchema, contactQuerySchema, formatZodError, toDatabaseContact } from '../../shared/contacts.js'
import { getBearerToken, handleDatabaseError, sendError, setCors } from '../_lib/http.js'
import { createDataClient } from '../_lib/neon.js'

export default async function handler(req, res) {
  setCors(req, res)
  if (req.method === 'OPTIONS') return res.status(204).end()

  const token = getBearerToken(req)
  if (!token) return sendError(res, 401, 'UNAUTHORIZED', 'Please sign in to manage contacts.')

  const neon = createDataClient(token)
  try {
    if (req.method === 'GET') {
      const parsed = contactQuerySchema.safeParse(req.query)
      if (!parsed.success) return sendError(res, 400, 'VALIDATION_ERROR', 'Check your filters and try again.', formatZodError(parsed.error))
      const { q, priority, sort, order } = parsed.data
      let query = neon.from('contacts').select('*').order(sort, { ascending: order === 'asc' })
      if (priority) query = query.eq('priority', priority)
      if (q) {
        const safe = q.replace(/[,%()]/g, ' ')
        query = query.or(`name.ilike.%${safe}%,company.ilike.%${safe}%,role.ilike.%${safe}%,where_met.ilike.%${safe}%`)
      }
      const { data, error } = await query
      if (error) throw error
      return res.status(200).json({ data })
    }

    if (req.method === 'POST') {
      const parsed = contactInputSchema.safeParse(req.body)
      if (!parsed.success) return sendError(res, 400, 'VALIDATION_ERROR', 'Please correct the highlighted fields.', formatZodError(parsed.error))
      const { data, error } = await neon.from('contacts').insert(toDatabaseContact(parsed.data)).select().single()
      if (error) throw error
      return res.status(201).json({ data, message: 'Contact added.' })
    }

    res.setHeader('Allow', 'GET, POST, OPTIONS')
    return sendError(res, 405, 'METHOD_NOT_ALLOWED', 'That action is not supported.')
  } catch (error) {
    return handleDatabaseError(res, error)
  }
}


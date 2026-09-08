import { z } from 'zod'

export const PRIORITIES = ['high', 'medium', 'low']
export const SORT_FIELDS = ['name', 'company', 'role', 'priority', 'created_at', 'updated_at']

const optionalText = z.string().trim().max(500).optional().default('')

export const contactInputSchema = z.object({
  name: z.string().trim().min(1, 'Name is required').max(120, 'Name must be 120 characters or fewer'),
  company: optionalText,
  role: optionalText,
  whereMet: optionalText,
  notes: z.string().trim().max(5000, 'Notes must be 5,000 characters or fewer').optional().default(''),
  priority: z.enum(PRIORITIES, { error: 'Priority must be high, medium, or low' }),
}).strict()

export const contactPatchSchema = contactInputSchema.partial().refine(
  (value) => Object.keys(value).length > 0,
  'At least one contact field is required',
)

export const contactQuerySchema = z.object({
  q: z.string().trim().max(120).optional().default(''),
  priority: z.enum(PRIORITIES).optional(),
  sort: z.enum(SORT_FIELDS).optional().default('updated_at'),
  order: z.enum(['asc', 'desc']).optional().default('desc'),
})

export function toDatabaseContact(value) {
  const { whereMet, ...rest } = value
  return { ...rest, where_met: whereMet }
}

export function formatZodError(error) {
  const fields = {}
  for (const issue of error.issues) {
    const key = issue.path[0] || 'form'
    fields[key] ||= issue.message
  }
  return fields
}


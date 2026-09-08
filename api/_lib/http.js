export function setCors(req, res) {
  const origin = req.headers.origin
  const allowed = (process.env.ALLOWED_ORIGIN || '').split(',').map((item) => item.trim()).filter(Boolean)
  if (origin && allowed.includes(origin)) {
    res.setHeader('Access-Control-Allow-Origin', origin)
    res.setHeader('Vary', 'Origin')
  }
  res.setHeader('Access-Control-Allow-Headers', 'Authorization, Content-Type')
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PATCH, DELETE, OPTIONS')
}

export function getBearerToken(req) {
  const header = req.headers.authorization || ''
  return header.startsWith('Bearer ') ? header.slice(7).trim() : null
}

export function sendError(res, status, code, message, fields) {
  return res.status(status).json({ error: { code, message, ...(fields ? { fields } : {}) } })
}

export function handleDatabaseError(res, error) {
  console.error('Contact API error:', error?.message || error)
  const message = String(error?.message || '')
  if (/jwt|token|unauthorized|permission/i.test(message)) {
    return sendError(res, 401, 'UNAUTHORIZED', 'Your session has expired. Please sign in again.')
  }
  return sendError(res, 500, 'INTERNAL_ERROR', 'We could not complete that request. Please try again.')
}


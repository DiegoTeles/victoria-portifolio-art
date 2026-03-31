import { verifyAdminToken, getAdminTokenFromRequest } from './auth.mjs'

export async function requireAdmin(req, res) {
  const token = getAdminTokenFromRequest(req)
  const payload = await verifyAdminToken(token)
  if (!payload) {
    res.status(401).json({ error: 'Unauthorized' })
    return false
  }
  return true
}

import { verifyAdminToken, getAdminTokenFromRequest } from '../_lib/auth.mjs'

export default async function handler(req, res) {
  if (req.method !== 'GET') {
    res.status(405).json({ error: 'Method not allowed' })
    return
  }
  const token = getAdminTokenFromRequest(req)
  const payload = await verifyAdminToken(token)
  if (!payload) {
    res.status(401).json({ ok: false })
    return
  }
  res.status(200).json({ ok: true })
}

import { clearAuthCookieHeader } from '../_lib/auth.mjs'

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    res.status(405).json({ error: 'Method not allowed' })
    return
  }
  res.setHeader('Set-Cookie', clearAuthCookieHeader())
  res.status(200).json({ ok: true })
}

import { timingSafeEqual } from 'node:crypto'
import { signAdminToken, setAuthCookieHeader } from '../_lib/auth.mjs'

function safeEqual(a, b) {
  const ba = Buffer.from(String(a), 'utf8')
  const bb = Buffer.from(String(b), 'utf8')
  if (ba.length !== bb.length) return false
  return timingSafeEqual(ba, bb)
}

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    res.status(405).json({ error: 'Method not allowed' })
    return
  }
  const expected = process.env.ADMIN_PASSWORD
  if (!expected) {
    res.status(500).json({ error: 'Server misconfigured' })
    return
  }
  const body = typeof req.body === 'object' && req.body !== null ? req.body : {}
  const password = body.password
  if (!safeEqual(password ?? '', expected)) {
    res.status(401).json({ error: 'Invalid password' })
    return
  }
  const token = await signAdminToken()
  res.setHeader('Set-Cookie', setAuthCookieHeader(token))
  res.status(200).json({ ok: true })
}

import { SignJWT, jwtVerify } from 'jose'

const COOKIE = 'portfolio_admin'

function getSecret() {
  const s = process.env.JWT_SECRET
  if (!s) throw new Error('JWT_SECRET is not set')
  return new TextEncoder().encode(s)
}

export async function signAdminToken() {
  return new SignJWT({ role: 'admin' })
    .setProtectedHeader({ alg: 'HS256' })
    .setIssuedAt()
    .setExpirationTime('7d')
    .sign(getSecret())
}

export async function verifyAdminToken(token) {
  if (!token) return null
  try {
    const { payload } = await jwtVerify(token, getSecret())
    if (payload.role !== 'admin') return null
    return payload
  } catch {
    return null
  }
}

export function getTokenFromCookieHeader(cookieHeader) {
  if (!cookieHeader || typeof cookieHeader !== 'string') return null
  const parts = cookieHeader.split(';')
  for (const p of parts) {
    const [name, ...rest] = p.trim().split('=')
    if (name === COOKIE) return rest.join('=').trim()
  }
  return null
}

export function getAdminTokenFromRequest(req) {
  const raw = req.headers?.cookie || req.headers?.Cookie
  const token = getTokenFromCookieHeader(raw)
  return token
}

export function setAuthCookieHeader(token) {
  const secure = process.env.VERCEL === '1' ? '; Secure' : ''
  return `${COOKIE}=${token}; Path=/; HttpOnly; SameSite=Lax; Max-Age=${7 * 24 * 60 * 60}${secure}`
}

export function clearAuthCookieHeader() {
  const secure = process.env.VERCEL === '1' ? '; Secure' : ''
  return `${COOKIE}=; Path=/; HttpOnly; SameSite=Lax; Max-Age=0${secure}`
}

export { COOKIE }

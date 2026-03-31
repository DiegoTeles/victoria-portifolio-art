import { handleUpload } from '@vercel/blob/client'
import { verifyAdminToken, getAdminTokenFromRequest } from '../_lib/auth.mjs'

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    res.status(405).json({ error: 'Method not allowed' })
    return
  }
  const token = getAdminTokenFromRequest(req)
  const ok = await verifyAdminToken(token)
  if (!ok) {
    res.status(401).json({ error: 'Unauthorized' })
    return
  }
  let body = req.body
  if (typeof body === 'string') {
    try {
      body = JSON.parse(body || '{}')
    } catch {
      res.status(400).json({ error: 'Invalid JSON' })
      return
    }
  }
  if (!body || typeof body !== 'object') {
    res.status(400).json({ error: 'Invalid body' })
    return
  }
  try {
    const jsonResponse = await handleUpload({
      request: req,
      body,
      onBeforeGenerateToken: async () => ({
        allowedContentTypes: ['image/*', 'video/*'],
        maximumSizeInBytes: 500 * 1024 * 1024,
      }),
    })
    res.status(200).json(jsonResponse)
  } catch (e) {
    console.error(e)
    res.status(400).json({ error: e instanceof Error ? e.message : 'Upload failed' })
  }
}

import { get } from '@vercel/blob'

function sendJson(res, status, data) {
  res.statusCode = status
  res.setHeader('Content-Type', 'application/json')
  res.end(JSON.stringify(data))
}

export default async function handler(req, res) {
  if (req.method !== 'GET') {
    sendJson(res, 405, { error: 'Method not allowed' })
    return
  }

  const rawUrl = req.query?.url
  const blobUrl = typeof rawUrl === 'string' ? rawUrl.trim() : ''
  if (!blobUrl) {
    sendJson(res, 400, { error: 'Missing url' })
    return
  }

  try {
    const parsed = new URL(blobUrl)
    if (!parsed.hostname.endsWith('.blob.vercel-storage.com')) {
      sendJson(res, 400, { error: 'Invalid blob url' })
      return
    }

    const result = await get(blobUrl, { access: 'private' })
    if (!result || result.statusCode !== 200 || !result.stream) {
      sendJson(res, 404, { error: 'Not found' })
      return
    }

    res.statusCode = 200
    res.setHeader('Content-Type', result.blob.contentType || 'application/octet-stream')
    res.setHeader('Cache-Control', result.blob.cacheControl || 'private, max-age=60')
    res.setHeader('Content-Disposition', result.blob.contentDisposition || 'inline')
    if (result.blob.etag) res.setHeader('ETag', result.blob.etag)

    const content = await new Response(result.stream).arrayBuffer()
    res.end(Buffer.from(content))
  } catch (e) {
    console.error(e)
    sendJson(res, 400, { error: 'Failed to read private blob' })
  }
}

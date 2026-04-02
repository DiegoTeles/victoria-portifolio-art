import { del, BlobNotFoundError } from '@vercel/blob'

export function collectArtworkBlobUrls(row) {
  const out = []
  if (row.image_url) {
    const s = String(row.image_url).trim()
    if (s) out.push(s)
  }
  if (row.video_url) {
    const s = String(row.video_url).trim()
    if (s) out.push(s)
  }
  const ex = row.extra_images
  if (Array.isArray(ex)) {
    for (const x of ex) {
      const s = typeof x === 'string' ? x.trim() : ''
      if (s) out.push(s)
    }
  }
  return [...new Set(out)]
}

function isVercelBlobUrl(url) {
  try {
    return new URL(url).hostname.endsWith('.blob.vercel-storage.com')
  } catch {
    return false
  }
}

export async function deleteArtworkBlobsFromRow(row) {
  const urls = collectArtworkBlobUrls(row).filter(isVercelBlobUrl)
  if (!urls.length) return
  const token = process.env.BLOB_READ_WRITE_TOKEN
  if (!token) {
    console.warn('BLOB_READ_WRITE_TOKEN not set; skipping blob delete')
    return
  }
  for (const url of urls) {
    try {
      await del(url, { token })
    } catch (e) {
      if (e instanceof BlobNotFoundError) continue
      throw e
    }
  }
}

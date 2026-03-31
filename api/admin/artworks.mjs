import { getSql, hasDatabase } from '../_lib/db.mjs'
import { requireAdmin } from '../_lib/require-admin.mjs'
import { bodyToInsertPayload } from '../_lib/artwork-map.mjs'
import { rowToArtwork } from '../_lib/artwork-map.mjs'

export default async function handler(req, res) {
  if (!hasDatabase()) {
    res.status(503).json({ error: 'Database not configured' })
    return
  }
  if (req.method === 'POST') {
    if (!(await requireAdmin(req, res))) return
    const body = typeof req.body === 'object' && req.body !== null ? req.body : {}
    const p = bodyToInsertPayload(body)
    if (!p.id || !p.artwork_date) {
      res.status(400).json({ error: 'id and date are required' })
      return
    }
    try {
      const sql = getSql()
      await sql`
        INSERT INTO artworks (
          id, order_index, title, artwork_date, description, image_url, video_url,
          orientation, group_key, group_display, types, info, resolution
        ) VALUES (
          ${p.id},
          ${p.order_index},
          ${p.title},
          ${p.artwork_date},
          ${JSON.stringify(p.description)}::jsonb,
          ${p.image_url},
          ${p.video_url},
          ${p.orientation},
          ${p.group_key},
          ${p.group_display},
          ${JSON.stringify(p.types)}::jsonb,
          ${p.info == null ? null : JSON.stringify(p.info)}::jsonb,
          ${p.resolution == null ? null : JSON.stringify(p.resolution)}::jsonb
        )
      `
      const rows = await sql`
        SELECT id, order_index, title, artwork_date, description, image_url, video_url,
               orientation, group_key, group_display, types, info, resolution
        FROM artworks WHERE id = ${p.id}
      `
      const artwork = rowToArtwork(rows[0])
      res.status(201).json(artwork)
    } catch (e) {
      if (e.code === '23505') {
        res.status(409).json({ error: 'Artwork id already exists' })
        return
      }
      console.error(e)
      res.status(500).json({ error: 'Failed to create artwork' })
    }
    return
  }
  res.status(405).json({ error: 'Method not allowed' })
}

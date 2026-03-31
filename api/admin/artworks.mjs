import { getSql, hasDatabase } from '../_lib/db.mjs'
import { requireAdmin } from '../_lib/require-admin.mjs'
import { bodyToInsertPayload } from '../_lib/artwork-map.mjs'
import { rowToArtwork } from '../_lib/artwork-map.mjs'
import {
  validateAndSyncArtworkCategories,
  loadCategoriesForArtwork,
} from '../_lib/artwork-categories.mjs'

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
          group_key, group_display, types, info, resolution, extra_images, extra_descriptions
        ) VALUES (
          ${p.id},
          ${p.order_index},
          ${p.title},
          ${p.artwork_date},
          ${JSON.stringify(p.description)}::jsonb,
          ${p.image_url},
          ${p.video_url},
          ${p.group_key},
          ${p.group_display},
          ${JSON.stringify(p.types)}::jsonb,
          ${p.info == null ? null : JSON.stringify(p.info)}::jsonb,
          ${p.resolution == null ? null : JSON.stringify(p.resolution)}::jsonb,
          ${JSON.stringify(p.extra_images)}::jsonb,
          ${JSON.stringify(p.extra_descriptions)}::jsonb
        )
      `
      if (body.categoryAssignments !== undefined || body.categories !== undefined) {
        try {
          await validateAndSyncArtworkCategories(sql, p.id, body)
        } catch (err) {
          await sql`DELETE FROM artworks WHERE id = ${p.id}`
          res.status(400).json({ error: err instanceof Error ? err.message : 'Invalid categories' })
          return
        }
      }
      const rows = await sql`
        SELECT id, order_index, title, artwork_date, description, image_url, video_url,
               group_key, group_display, types, info, resolution, extra_images, extra_descriptions
        FROM artworks WHERE id = ${p.id}
      `
      let cats = []
      try {
        cats = await loadCategoriesForArtwork(sql, p.id)
      } catch (e) {
        console.error(e)
      }
      const artwork = rowToArtwork(rows[0], cats)
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

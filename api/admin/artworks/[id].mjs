import { getSql, hasDatabase } from '../../_lib/db.mjs'
import { requireAdmin } from '../../_lib/require-admin.mjs'
import { bodyToInsertPayload, rowToArtwork } from '../../_lib/artwork-map.mjs'
import {
  validateAndSyncArtworkCategories,
  loadCategoriesForArtwork,
} from '../../_lib/artwork-categories.mjs'

export default async function handler(req, res) {
  if (!hasDatabase()) {
    res.status(503).json({ error: 'Database not configured' })
    return
  }
  const id = req.query?.id
  if (!id || typeof id !== 'string') {
    res.status(400).json({ error: 'Missing id' })
    return
  }
  if (!(await requireAdmin(req, res))) return

  if (req.method === 'PUT') {
    const body = typeof req.body === 'object' && req.body !== null ? req.body : {}
    const p = bodyToInsertPayload({ ...body, id })
    try {
      const sql = getSql()
      const existing = await sql`SELECT id FROM artworks WHERE id = ${id} LIMIT 1`
      if (!existing.length) {
        res.status(404).json({ error: 'Not found' })
        return
      }
      await sql`
        UPDATE artworks SET
          order_index = ${p.order_index},
          title = ${p.title},
          artwork_date = ${p.artwork_date},
          description = ${JSON.stringify(p.description)}::jsonb,
          image_url = ${p.image_url},
          video_url = ${p.video_url},
          group_key = ${p.group_key},
          group_display = ${p.group_display},
          types = ${JSON.stringify(p.types)}::jsonb,
          info = ${p.info == null ? null : JSON.stringify(p.info)}::jsonb,
          resolution = ${p.resolution == null ? null : JSON.stringify(p.resolution)}::jsonb,
          main_media_bytes = ${p.main_media_bytes},
          extra_images = ${JSON.stringify(p.extra_images)}::jsonb,
          extra_descriptions = ${JSON.stringify(p.extra_descriptions)}::jsonb,
          updated_at = NOW()
        WHERE id = ${id}
      `
      if (body.categoryAssignments !== undefined || body.categories !== undefined) {
        try {
          await validateAndSyncArtworkCategories(sql, id, body)
        } catch (err) {
          res.status(400).json({ error: err instanceof Error ? err.message : 'Invalid categories' })
          return
        }
      }
      const rows = await sql`
        SELECT id, order_index, title, artwork_date, description, image_url, video_url,
               group_key, group_display, types, info, resolution, main_media_bytes, extra_images, extra_descriptions
        FROM artworks WHERE id = ${id}
      `
      let cats = []
      try {
        cats = await loadCategoriesForArtwork(sql, id)
      } catch (e) {
        console.error(e)
      }
      const artwork = rowToArtwork(rows[0], cats)
      res.status(200).json(artwork)
    } catch (e) {
      console.error(e)
      res.status(500).json({ error: 'Failed to update artwork' })
    }
    return
  }

  if (req.method === 'DELETE') {
    try {
      const sql = getSql()
      const result = await sql`
        DELETE FROM artworks WHERE id = ${id} RETURNING id
      `
      if (!result.length) {
        res.status(404).json({ error: 'Not found' })
        return
      }
      res.status(200).json({ ok: true })
    } catch (e) {
      console.error(e)
      res.status(500).json({ error: 'Failed to delete artwork' })
    }
    return
  }

  res.status(405).json({ error: 'Method not allowed' })
}

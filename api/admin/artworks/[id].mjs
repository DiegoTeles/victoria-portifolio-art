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
          caption_medium = ${JSON.stringify(p.caption_medium)}::jsonb,
          physical_dimensions = ${JSON.stringify(p.physical_dimensions)}::jsonb,
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
          extra_titles = ${JSON.stringify(p.extra_titles)}::jsonb,
          extra_caption_media = ${JSON.stringify(p.extra_caption_media)}::jsonb,
          extra_physical_dimensions = ${JSON.stringify(p.extra_physical_dimensions)}::jsonb,
          extra_resolutions = ${JSON.stringify(p.extra_resolutions)}::jsonb,
          extra_media_bytes = ${JSON.stringify(p.extra_media_bytes)}::jsonb,
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
        SELECT id, order_index, title, artwork_date, description, caption_medium, physical_dimensions,
               image_url, video_url, group_key, group_display, types, info, resolution, main_media_bytes,
               extra_images, extra_descriptions, extra_titles, extra_caption_media, extra_physical_dimensions,
               extra_resolutions, extra_media_bytes
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

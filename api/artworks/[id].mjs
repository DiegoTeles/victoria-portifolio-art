import { getSql, hasDatabase } from '../_lib/db.mjs'
import { rowToArtwork } from '../_lib/artwork-map.mjs'
import { loadCategoriesForArtwork } from '../_lib/artwork-categories.mjs'

export default async function handler(req, res) {
  if (req.method !== 'GET') {
    res.status(405).json({ error: 'Method not allowed' })
    return
  }
  const id = req.query?.id
  if (!id || typeof id !== 'string') {
    res.status(400).json({ error: 'Missing id' })
    return
  }
  if (!hasDatabase()) {
    res.status(503).json({ error: 'Database not configured' })
    return
  }
  try {
    const sql = getSql()
    const rows = await sql`
      SELECT id, order_index, title, artwork_date, description, caption_medium, physical_dimensions,
             image_url, video_url, group_key, group_display, types, info, resolution, main_media_bytes,
             extra_images, extra_descriptions, extra_titles, extra_caption_media, extra_physical_dimensions
      FROM artworks
      WHERE id = ${id}
      LIMIT 1
    `
    const row = rows[0]
    if (!row) {
      res.status(404).json({ error: 'Not found' })
      return
    }
    let cats = []
    try {
      cats = await loadCategoriesForArtwork(sql, id)
    } catch (e) {
      console.error(e)
    }
    const artwork = rowToArtwork(row, cats)
    res.setHeader('Cache-Control', 's-maxage=60, stale-while-revalidate=300')
    res.status(200).json(artwork)
  } catch (e) {
    console.error(e)
    res.status(500).json({ error: 'Failed to load artwork' })
  }
}

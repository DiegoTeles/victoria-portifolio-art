import { getSql, hasDatabase } from './_lib/db.mjs'
import { rowToArtwork } from './_lib/artwork-map.mjs'
import { loadCategoriesForArtworks } from './_lib/artwork-categories.mjs'

export default async function handler(req, res) {
  if (req.method !== 'GET') {
    res.status(405).json({ error: 'Method not allowed' })
    return
  }
  if (!hasDatabase()) {
    res.status(503).json({ error: 'Database not configured' })
    return
  }
  try {
    const sql = getSql()
    const rows = await sql`
      SELECT id, order_index, title, artwork_date, description, image_url, video_url,
             orientation, group_key, group_display, types, info, resolution, extra_images
      FROM artworks
      ORDER BY order_index ASC
    `
    const ids = rows.map((r) => r.id)
    let catMap
    try {
      catMap = await loadCategoriesForArtworks(sql, ids)
    } catch (e) {
      console.error(e)
      catMap = new Map()
    }
    const list = rows.map((row) =>
      rowToArtwork(row, catMap.get(row.id) ?? [])
    )
    res.setHeader('Cache-Control', 's-maxage=60, stale-while-revalidate=300')
    res.status(200).json(list)
  } catch (e) {
    console.error(e)
    res.status(500).json({ error: 'Failed to load artworks' })
  }
}

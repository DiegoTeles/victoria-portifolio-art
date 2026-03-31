import { getSql, hasDatabase } from './_lib/db.mjs'

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
      SELECT id, network, url, label, sort_order
      FROM social_links
      WHERE is_active = true
      ORDER BY sort_order ASC, network ASC
    `
    const list = rows.map((r) => ({
      id: String(r.id),
      network: r.network,
      url: r.url,
      label: r.label,
      sortOrder: r.sort_order,
    }))
    res.setHeader('Cache-Control', 's-maxage=60, stale-while-revalidate=300')
    res.status(200).json(list)
  } catch (e) {
    console.error(e)
    res.status(500).json({ error: 'Failed to load social links' })
  }
}

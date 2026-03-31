import { getSql, hasDatabase } from '../_lib/db.mjs'
import { requireAdmin } from '../_lib/require-admin.mjs'

export default async function handler(req, res) {
  if (!hasDatabase()) {
    res.status(503).json({ error: 'Database not configured' })
    return
  }
  const sql = getSql()

  if (req.method === 'GET') {
    if (!(await requireAdmin(req, res))) return
    try {
      const rows = await sql`
        SELECT id, network, url, label, sort_order, is_active, updated_at
        FROM social_links
        ORDER BY sort_order ASC, network ASC
      `
      const list = rows.map((r) => ({
        id: String(r.id),
        network: r.network,
        url: r.url,
        label: r.label,
        sortOrder: r.sort_order,
        isActive: r.is_active,
        updatedAt: r.updated_at,
      }))
      res.status(200).json(list)
    } catch (e) {
      console.error(e)
      res.status(500).json({ error: 'Failed to load social links' })
    }
    return
  }

  if (req.method === 'POST') {
    if (!(await requireAdmin(req, res))) return
    const body = typeof req.body === 'object' && req.body !== null ? req.body : {}
    const network = String(body.network || '').trim()
    const url = String(body.url || '').trim()
    if (!network || !url) {
      res.status(400).json({ error: 'network and url are required' })
      return
    }
    const label = body.label == null ? null : String(body.label)
    const sortOrder = Number.isFinite(Number(body.sortOrder)) ? Number(body.sortOrder) : 0
    const isActive = body.isActive !== false
    try {
      const rows = await sql`
        INSERT INTO social_links (network, url, label, sort_order, is_active, updated_at)
        VALUES (${network}, ${url}, ${label}, ${sortOrder}, ${isActive}, NOW())
        RETURNING id, network, url, label, sort_order, is_active, updated_at
      `
      const r = rows[0]
      res.status(201).json({
        id: String(r.id),
        network: r.network,
        url: r.url,
        label: r.label,
        sortOrder: r.sort_order,
        isActive: r.is_active,
        updatedAt: r.updated_at,
      })
    } catch (e) {
      console.error(e)
      res.status(500).json({ error: 'Failed to create social link' })
    }
    return
  }

  res.status(405).json({ error: 'Method not allowed' })
}

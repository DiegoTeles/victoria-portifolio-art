import { getSql, hasDatabase } from '../../_lib/db.mjs'
import { requireAdmin } from '../../_lib/require-admin.mjs'

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
  const sql = getSql()

  if (req.method === 'PUT') {
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
        UPDATE social_links SET
          network = ${network},
          url = ${url},
          label = ${label},
          sort_order = ${sortOrder},
          is_active = ${isActive},
          updated_at = NOW()
        WHERE id = ${id}::uuid
        RETURNING id, network, url, label, sort_order, is_active, updated_at
      `
      if (!rows.length) {
        res.status(404).json({ error: 'Not found' })
        return
      }
      const r = rows[0]
      res.status(200).json({
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
      res.status(500).json({ error: 'Failed to update social link' })
    }
    return
  }

  if (req.method === 'DELETE') {
    try {
      const result = await sql`DELETE FROM social_links WHERE id = ${id}::uuid RETURNING id`
      if (!result.length) {
        res.status(404).json({ error: 'Not found' })
        return
      }
      res.status(200).json({ ok: true })
    } catch (e) {
      console.error(e)
      res.status(500).json({ error: 'Failed to delete social link' })
    }
    return
  }

  res.status(405).json({ error: 'Method not allowed' })
}

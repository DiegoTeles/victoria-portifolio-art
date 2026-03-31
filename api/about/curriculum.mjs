import { getSql, hasDatabase } from '../_lib/db.mjs'

function parseLocale(req) {
  const raw = req.url || ''
  const u = new URL(raw, 'http://localhost')
  return u.searchParams.get('locale') || 'pt-Br'
}

export default async function handler(req, res) {
  if (req.method !== 'GET') {
    res.status(405).json({ error: 'Method not allowed' })
    return
  }
  if (!hasDatabase()) {
    res.status(503).json({ error: 'Database not configured' })
    return
  }
  const locale = parseLocale(req)
  try {
    const sql = getSql()
    const rows = await sql`
      SELECT content, is_published FROM curriculum_entries WHERE locale = ${locale} LIMIT 1
    `
    const row = rows[0]
    if (!row || !row.is_published) {
      res.setHeader('Cache-Control', 's-maxage=60, stale-while-revalidate=300')
      res.status(200).json({ content: '', isPublished: false })
      return
    }
    res.setHeader('Cache-Control', 's-maxage=60, stale-while-revalidate=300')
    res.status(200).json({ content: row.content ?? '', isPublished: true })
  } catch (e) {
    console.error(e)
    res.status(500).json({ error: 'Failed to load curriculum' })
  }
}

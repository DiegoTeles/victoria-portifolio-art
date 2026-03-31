import { getSql, hasDatabase } from './_lib/db.mjs'

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
    const cats = await sql`
      SELECT c.id, c.slug, c.sort_order,
             COALESCE(ct.name, c.slug) AS name
      FROM categories c
      LEFT JOIN category_translations ct
        ON ct.category_id = c.id AND ct.locale = ${locale}
      WHERE c.is_active = true
      ORDER BY c.sort_order ASC, c.slug ASC
    `
    const subs = await sql`
      SELECT s.id, s.category_id, s.slug, s.sort_order,
             COALESCE(st.name, s.slug) AS name
      FROM subcategories s
      LEFT JOIN subcategory_translations st
        ON st.subcategory_id = s.id AND st.locale = ${locale}
      WHERE s.is_active = true
      ORDER BY s.sort_order ASC, s.slug ASC
    `
    const tree = cats.map((c) => ({
      id: String(c.id),
      slug: c.slug,
      name: c.name,
      sortOrder: c.sort_order,
      subcategories: subs
        .filter((s) => String(s.category_id) === String(c.id))
        .map((s) => ({
          id: String(s.id),
          slug: s.slug,
          name: s.name,
          sortOrder: s.sort_order,
        })),
    }))
    res.setHeader('Cache-Control', 's-maxage=60, stale-while-revalidate=300')
    res.status(200).json(tree)
  } catch (e) {
    console.error(e)
    res.status(500).json({ error: 'Failed to load categories' })
  }
}

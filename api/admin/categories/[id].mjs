import { getSql, hasDatabase } from '../../_lib/db.mjs'
import { requireAdmin } from '../../_lib/require-admin.mjs'

const LOCALES = ['pt-Br', 'en', 'fr', 'it', 'de']

function normalizeTranslations(raw) {
  if (!Array.isArray(raw)) return []
  const map = new Map()
  for (const t of raw) {
    if (!t || typeof t !== 'object') continue
    const loc = String(t.locale || '').trim()
    if (!LOCALES.includes(loc)) continue
    map.set(loc, String(t.name ?? '').trim())
  }
  return LOCALES.map((locale) => ({ locale, name: map.get(locale) ?? '' }))
}

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
    let slug = String(body.slug || '')
      .trim()
      .toLowerCase()
      .replace(/[^a-z0-9-]+/g, '-')
      .replace(/^-|-$/g, '')
    const sortOrder = Number.isFinite(Number(body.sortOrder)) ? Number(body.sortOrder) : 0
    const isActive = body.isActive !== false
    const translations = normalizeTranslations(body.translations)
    try {
      const existing = await sql`SELECT id, slug FROM categories WHERE id = ${id}::uuid LIMIT 1`
      if (!existing.length) {
        res.status(404).json({ error: 'Not found' })
        return
      }
      if (!slug) slug = existing[0].slug
      await sql`
        UPDATE categories SET
          slug = ${slug},
          sort_order = ${sortOrder},
          is_active = ${isActive},
          updated_at = NOW()
        WHERE id = ${id}::uuid
      `
      for (const t of translations) {
        await sql`
          INSERT INTO category_translations (category_id, locale, name)
          VALUES (${id}::uuid, ${t.locale}, ${t.name || slug})
          ON CONFLICT (category_id, locale) DO UPDATE SET name = EXCLUDED.name
        `
      }
      const rows = await sql`
        SELECT id, slug, sort_order, is_active FROM categories WHERE id = ${id}::uuid
      `
      const c = rows[0]
      res.status(200).json({
        id: String(c.id),
        slug: c.slug,
        sortOrder: c.sort_order,
        isActive: c.is_active,
        translations,
      })
    } catch (e) {
      if (e.code === '23505') {
        res.status(409).json({ error: 'Slug already exists' })
        return
      }
      console.error(e)
      res.status(500).json({ error: 'Failed to update category' })
    }
    return
  }

  if (req.method === 'DELETE') {
    try {
      const result = await sql`DELETE FROM categories WHERE id = ${id}::uuid RETURNING id`
      if (!result.length) {
        res.status(404).json({ error: 'Not found' })
        return
      }
      res.status(200).json({ ok: true })
    } catch (e) {
      console.error(e)
      res.status(500).json({ error: 'Failed to delete category' })
    }
    return
  }

  res.status(405).json({ error: 'Method not allowed' })
}

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
    const nextCategoryId =
      body.categoryId != null && body.categoryId !== ''
        ? String(body.categoryId).trim()
        : null
    try {
      const existing = await sql`SELECT id, slug, category_id FROM subcategories WHERE id = ${id}::uuid LIMIT 1`
      if (!existing.length) {
        res.status(404).json({ error: 'Not found' })
        return
      }
      if (!slug) slug = existing[0].slug
      const categoryIdForRow = nextCategoryId || String(existing[0].category_id)
      await sql`
        UPDATE subcategories SET
          category_id = ${categoryIdForRow}::uuid,
          slug = ${slug},
          sort_order = ${sortOrder},
          is_active = ${isActive},
          updated_at = NOW()
        WHERE id = ${id}::uuid
      `
      for (const t of translations) {
        await sql`
          INSERT INTO subcategory_translations (subcategory_id, locale, name)
          VALUES (${id}::uuid, ${t.locale}, ${t.name || slug})
          ON CONFLICT (subcategory_id, locale) DO UPDATE SET name = EXCLUDED.name
        `
      }
      const rows = await sql`
        SELECT id, category_id, slug, sort_order, is_active FROM subcategories WHERE id = ${id}::uuid
      `
      const s = rows[0]
      res.status(200).json({
        id: String(s.id),
        categoryId: String(s.category_id),
        slug: s.slug,
        sortOrder: s.sort_order,
        isActive: s.is_active,
        translations,
      })
    } catch (e) {
      if (e.code === '23505') {
        res.status(409).json({ error: 'Slug already exists in this category' })
        return
      }
      console.error(e)
      res.status(500).json({ error: 'Failed to update subcategory' })
    }
    return
  }

  if (req.method === 'DELETE') {
    try {
      const result = await sql`DELETE FROM subcategories WHERE id = ${id}::uuid RETURNING id`
      if (!result.length) {
        res.status(404).json({ error: 'Not found' })
        return
      }
      res.status(200).json({ ok: true })
    } catch (e) {
      console.error(e)
      res.status(500).json({ error: 'Failed to delete subcategory' })
    }
    return
  }

  res.status(405).json({ error: 'Method not allowed' })
}

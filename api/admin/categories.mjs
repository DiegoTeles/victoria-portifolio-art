import { getSql, hasDatabase } from '../_lib/db.mjs'
import { requireAdmin } from '../_lib/require-admin.mjs'

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
  const sql = getSql()

  if (req.method === 'GET') {
    if (!(await requireAdmin(req, res))) return
    try {
      const cats = await sql`
        SELECT id, slug, sort_order, is_active, created_at, updated_at
        FROM categories
        ORDER BY sort_order ASC, slug ASC
      `
      const trans = await sql`
        SELECT category_id, locale, name FROM category_translations
      `
      const byCat = new Map()
      for (const t of trans) {
        const k = String(t.category_id)
        const list = byCat.get(k) ?? []
        list.push({ locale: t.locale, name: t.name })
        byCat.set(k, list)
      }
      const list = cats.map((c) => ({
        id: String(c.id),
        slug: c.slug,
        sortOrder: c.sort_order,
        isActive: c.is_active,
        translations: byCat.get(String(c.id)) ?? [],
      }))
      res.status(200).json(list)
    } catch (e) {
      console.error(e)
      res.status(500).json({ error: 'Failed to load categories' })
    }
    return
  }

  if (req.method === 'POST') {
    if (!(await requireAdmin(req, res))) return
    const body = typeof req.body === 'object' && req.body !== null ? req.body : {}
    const slug = String(body.slug || '')
      .trim()
      .toLowerCase()
      .replace(/[^a-z0-9-]+/g, '-')
      .replace(/^-|-$/g, '')
    if (!slug) {
      res.status(400).json({ error: 'slug is required' })
      return
    }
    const sortOrder = Number.isFinite(Number(body.sortOrder)) ? Number(body.sortOrder) : 0
    const isActive = body.isActive !== false
    const translations = normalizeTranslations(body.translations)
    try {
      const rows = await sql`
        INSERT INTO categories (slug, sort_order, is_active)
        VALUES (${slug}, ${sortOrder}, ${isActive})
        RETURNING id, slug, sort_order, is_active
      `
      const c = rows[0]
      for (const t of translations) {
        await sql`
          INSERT INTO category_translations (category_id, locale, name)
          VALUES (${c.id}, ${t.locale}, ${t.name || slug})
          ON CONFLICT (category_id, locale) DO UPDATE SET name = EXCLUDED.name
        `
      }
      res.status(201).json({
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
      res.status(500).json({ error: 'Failed to create category' })
    }
    return
  }

  res.status(405).json({ error: 'Method not allowed' })
}

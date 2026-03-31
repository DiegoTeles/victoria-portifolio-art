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
    const raw = req.url || ''
    const u = new URL(raw, 'http://localhost')
    const categoryId = u.searchParams.get('categoryId')
    if (!categoryId) {
      try {
        const subs = await sql`
          SELECT s.id, s.category_id, s.slug, s.sort_order, s.is_active,
                 c.slug AS category_slug,
                 COALESCE(ct.name, c.slug) AS category_name_pt
          FROM subcategories s
          INNER JOIN categories c ON c.id = s.category_id
          LEFT JOIN category_translations ct
            ON ct.category_id = c.id AND ct.locale = 'pt-Br'
          ORDER BY c.sort_order ASC, c.slug ASC, s.sort_order ASC, s.slug ASC
        `
        const trans = await sql`
          SELECT subcategory_id, locale, name FROM subcategory_translations
          WHERE subcategory_id IN (SELECT id FROM subcategories)
        `
        const bySub = new Map()
        for (const t of trans) {
          const k = String(t.subcategory_id)
          const list = bySub.get(k) ?? []
          list.push({ locale: t.locale, name: t.name })
          bySub.set(k, list)
        }
        const list = subs.map((s) => ({
          id: String(s.id),
          categoryId: String(s.category_id),
          categorySlug: s.category_slug,
          categoryNamePt: s.category_name_pt,
          slug: s.slug,
          sortOrder: s.sort_order,
          isActive: s.is_active,
          translations: bySub.get(String(s.id)) ?? [],
        }))
        res.status(200).json(list)
      } catch (e) {
        console.error(e)
        res.status(500).json({ error: 'Failed to load subcategories' })
      }
      return
    }
    try {
      const subs = await sql`
        SELECT id, category_id, slug, sort_order, is_active
        FROM subcategories
        WHERE category_id = ${categoryId}::uuid
        ORDER BY sort_order ASC, slug ASC
      `
      const trans = await sql`
        SELECT subcategory_id, locale, name FROM subcategory_translations
        WHERE subcategory_id IN (SELECT id FROM subcategories WHERE category_id = ${categoryId}::uuid)
      `
      const bySub = new Map()
      for (const t of trans) {
        const k = String(t.subcategory_id)
        const list = bySub.get(k) ?? []
        list.push({ locale: t.locale, name: t.name })
        bySub.set(k, list)
      }
      const list = subs.map((s) => ({
        id: String(s.id),
        categoryId: String(s.category_id),
        slug: s.slug,
        sortOrder: s.sort_order,
        isActive: s.is_active,
        translations: bySub.get(String(s.id)) ?? [],
      }))
      res.status(200).json(list)
    } catch (e) {
      console.error(e)
      res.status(500).json({ error: 'Failed to load subcategories' })
    }
    return
  }

  if (req.method === 'POST') {
    if (!(await requireAdmin(req, res))) return
    const body = typeof req.body === 'object' && req.body !== null ? req.body : {}
    const categoryId = String(body.categoryId || '').trim()
    let slug = String(body.slug || '')
      .trim()
      .toLowerCase()
      .replace(/[^a-z0-9-]+/g, '-')
      .replace(/^-|-$/g, '')
    if (!categoryId || !slug) {
      res.status(400).json({ error: 'categoryId and slug are required' })
      return
    }
    const sortOrder = Number.isFinite(Number(body.sortOrder)) ? Number(body.sortOrder) : 0
    const isActive = body.isActive !== false
    const translations = normalizeTranslations(body.translations)
    try {
      const rows = await sql`
        INSERT INTO subcategories (category_id, slug, sort_order, is_active)
        VALUES (${categoryId}::uuid, ${slug}, ${sortOrder}, ${isActive})
        RETURNING id, category_id, slug, sort_order, is_active
      `
      const s = rows[0]
      for (const t of translations) {
        await sql`
          INSERT INTO subcategory_translations (subcategory_id, locale, name)
          VALUES (${s.id}, ${t.locale}, ${t.name || slug})
          ON CONFLICT (subcategory_id, locale) DO UPDATE SET name = EXCLUDED.name
        `
      }
      res.status(201).json({
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
      res.status(500).json({ error: 'Failed to create subcategory' })
    }
    return
  }

  res.status(405).json({ error: 'Method not allowed' })
}

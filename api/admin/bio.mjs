import { getSql, hasDatabase } from '../_lib/db.mjs'
import { requireAdmin } from '../_lib/require-admin.mjs'

const LOCALES = ['pt-Br', 'en', 'fr', 'it', 'de']

export default async function handler(req, res) {
  if (!hasDatabase()) {
    res.status(503).json({ error: 'Database not configured' })
    return
  }
  if (!(await requireAdmin(req, res))) return
  const sql = getSql()

  if (req.method === 'GET') {
    try {
      const rows = await sql`
        SELECT locale, content, is_published, updated_at FROM bio_entries ORDER BY locale
      `
      const byLocale = new Map(rows.map((r) => [r.locale, r]))
      const entries = LOCALES.map((locale) => {
        const r = byLocale.get(locale)
        return {
          locale,
          content: r?.content ?? '',
          isPublished: r?.is_published ?? false,
          updatedAt: r?.updated_at ?? null,
        }
      })
      res.status(200).json({ entries })
    } catch (e) {
      console.error(e)
      res.status(500).json({ error: 'Failed to load bio entries' })
    }
    return
  }

  if (req.method === 'PUT') {
    const body = typeof req.body === 'object' && req.body !== null ? req.body : {}
    const locale = String(body.locale || '').trim()
    if (!LOCALES.includes(locale)) {
      res.status(400).json({ error: 'Invalid locale' })
      return
    }
    const content = String(body.content ?? '')
    const isPublished = Boolean(body.isPublished)
    try {
      await sql`
        INSERT INTO bio_entries (locale, content, is_published, updated_at)
        VALUES (${locale}, ${content}, ${isPublished}, NOW())
        ON CONFLICT (locale) DO UPDATE SET
          content = EXCLUDED.content,
          is_published = EXCLUDED.is_published,
          updated_at = NOW()
      `
      const rows = await sql`
        SELECT locale, content, is_published, updated_at FROM bio_entries WHERE locale = ${locale}
      `
      const r = rows[0]
      res.status(200).json({
        locale: r.locale,
        content: r.content,
        isPublished: r.is_published,
        updatedAt: r.updated_at,
      })
    } catch (e) {
      console.error(e)
      res.status(500).json({ error: 'Failed to save bio' })
    }
    return
  }

  res.status(405).json({ error: 'Method not allowed' })
}

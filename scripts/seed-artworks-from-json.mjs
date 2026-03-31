import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { neon } from '@neondatabase/serverless'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const root = path.join(__dirname, '..')
const jsonPath = path.join(root, 'src/data/artworks.json')

const url = process.env.DATABASE_URL
if (!url) {
  console.error('Define DATABASE_URL')
  process.exit(1)
}

const sql = neon(url)
const raw = fs.readFileSync(jsonPath, 'utf8')
const items = JSON.parse(raw)
if (!Array.isArray(items)) {
  console.error('Invalid JSON')
  process.exit(1)
}

for (const item of items) {
  const id = item.id
  const order_index = item.order ?? 0
  const title = item.title ?? ''
  const artwork_date = (item.date || '2020-01-01').slice(0, 10)
  const description = item.description && typeof item.description === 'object' ? item.description : {}
  const image_url = item.image || null
  const video_url = item.video || null
  const orientation = item.orientation || 'square'
  const group_key = item.group ?? null
  const group_display = item.groupDisplay ?? null
  const types = Array.isArray(item.types) ? item.types : []
  const info = item.info && typeof item.info === 'object' ? item.info : null
  const resolution = item.resolution && typeof item.resolution === 'object' ? item.resolution : null
  const extra_images = Array.isArray(item.extra_images) ? item.extra_images : []

  await sql`
    INSERT INTO artworks (
      id, order_index, title, artwork_date, description, image_url, video_url,
      orientation, group_key, group_display, types, info, resolution, extra_images
    ) VALUES (
      ${id},
      ${order_index},
      ${title},
      ${artwork_date},
      ${JSON.stringify(description)}::jsonb,
      ${image_url},
      ${video_url},
      ${orientation},
      ${group_key},
      ${group_display},
      ${JSON.stringify(types)}::jsonb,
      ${info == null ? null : JSON.stringify(info)}::jsonb,
      ${resolution == null ? null : JSON.stringify(resolution)}::jsonb,
      ${JSON.stringify(extra_images)}::jsonb
    )
    ON CONFLICT (id) DO UPDATE SET
      order_index = EXCLUDED.order_index,
      title = EXCLUDED.title,
      artwork_date = EXCLUDED.artwork_date,
      description = EXCLUDED.description,
      image_url = EXCLUDED.image_url,
      video_url = EXCLUDED.video_url,
      orientation = EXCLUDED.orientation,
      group_key = EXCLUDED.group_key,
      group_display = EXCLUDED.group_display,
      types = EXCLUDED.types,
      info = EXCLUDED.info,
      resolution = EXCLUDED.resolution,
      extra_images = EXCLUDED.extra_images,
      updated_at = NOW()
  `
  console.log('ok', id)
}

console.log('Done:', items.length)

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
  const group_key = item.group ?? null
  const group_display = item.groupDisplay ?? null
  const types = Array.isArray(item.types) ? item.types : []
  const info = item.info && typeof item.info === 'object' ? item.info : null
  const resolution = item.resolution && typeof item.resolution === 'object' ? item.resolution : null
  const extra_images = Array.isArray(item.extra_images) ? item.extra_images : []
  const extra_descriptions = Array.isArray(item.extra_descriptions) ? item.extra_descriptions : []
  const caption_medium =
    item.captionMedium && typeof item.captionMedium === 'object' ? item.captionMedium : {}
  const physical_dimensions =
    item.physicalDimensions && typeof item.physicalDimensions === 'object'
      ? item.physicalDimensions
      : {}
  const extra_titles = Array.isArray(item.extraTitles) ? item.extraTitles : []
  const extra_caption_media = Array.isArray(item.extraCaptionMedia)
    ? item.extraCaptionMedia
    : []
  const extra_physical_dimensions = Array.isArray(item.extraPhysicalDimensions)
    ? item.extraPhysicalDimensions
    : []
  const extra_resolutions = Array.isArray(item.extraResolutions) ? item.extraResolutions : []
  const extra_media_bytes = Array.isArray(item.extraMediaBytes) ? item.extraMediaBytes : []

  await sql`
    INSERT INTO artworks (
      id, order_index, title, artwork_date, description, caption_medium, physical_dimensions,
      image_url, video_url, group_key, group_display, types, info, resolution, main_media_bytes,
      extra_images, extra_descriptions, extra_titles, extra_caption_media, extra_physical_dimensions,
      extra_resolutions, extra_media_bytes
    ) VALUES (
      ${id},
      ${order_index},
      ${title},
      ${artwork_date},
      ${JSON.stringify(description)}::jsonb,
      ${JSON.stringify(caption_medium)}::jsonb,
      ${JSON.stringify(physical_dimensions)}::jsonb,
      ${image_url},
      ${video_url},
      ${group_key},
      ${group_display},
      ${JSON.stringify(types)}::jsonb,
      ${info == null ? null : JSON.stringify(info)}::jsonb,
      ${resolution == null ? null : JSON.stringify(resolution)}::jsonb,
      null,
      ${JSON.stringify(extra_images)}::jsonb,
      ${JSON.stringify(extra_descriptions)}::jsonb,
      ${JSON.stringify(extra_titles)}::jsonb,
      ${JSON.stringify(extra_caption_media)}::jsonb,
      ${JSON.stringify(extra_physical_dimensions)}::jsonb,
      ${JSON.stringify(extra_resolutions)}::jsonb,
      ${JSON.stringify(extra_media_bytes)}::jsonb
    )
    ON CONFLICT (id) DO UPDATE SET
      order_index = EXCLUDED.order_index,
      title = EXCLUDED.title,
      artwork_date = EXCLUDED.artwork_date,
      description = EXCLUDED.description,
      caption_medium = EXCLUDED.caption_medium,
      physical_dimensions = EXCLUDED.physical_dimensions,
      image_url = EXCLUDED.image_url,
      video_url = EXCLUDED.video_url,
      group_key = EXCLUDED.group_key,
      group_display = EXCLUDED.group_display,
      types = EXCLUDED.types,
      info = EXCLUDED.info,
      resolution = EXCLUDED.resolution,
      main_media_bytes = EXCLUDED.main_media_bytes,
      extra_images = EXCLUDED.extra_images,
      extra_descriptions = EXCLUDED.extra_descriptions,
      extra_titles = EXCLUDED.extra_titles,
      extra_caption_media = EXCLUDED.extra_caption_media,
      extra_physical_dimensions = EXCLUDED.extra_physical_dimensions,
      extra_resolutions = EXCLUDED.extra_resolutions,
      extra_media_bytes = EXCLUDED.extra_media_bytes,
      updated_at = NOW()
  `
  console.log('ok', id)
}

console.log('Done:', items.length)

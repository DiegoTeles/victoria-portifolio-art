function normalizeTypes(raw) {
  if (Array.isArray(raw)) return raw
  if (raw && typeof raw === 'object') return Object.values(raw)
  return []
}

function normalizeExtraImages(raw) {
  if (!Array.isArray(raw)) return []
  return raw.map((x) => String(x || '').trim()).filter(Boolean)
}

export function rowToArtwork(row) {
  const d = row.artwork_date
  const dateStr =
    d instanceof Date
      ? d.toISOString().slice(0, 10)
      : typeof d === 'string'
        ? d.slice(0, 10)
        : ''

  return {
    id: row.id,
    order_index: row.order_index,
    date: dateStr,
    title: row.title,
    description: row.description ?? {},
    image: row.image_url ?? undefined,
    video: row.video_url ?? undefined,
    resolution: row.resolution ?? undefined,
    orientation: row.orientation,
    group: row.group_key ?? null,
    groupDisplay: row.group_display ?? undefined,
    types: normalizeTypes(row.types),
    info: row.info ?? undefined,
    extra_images: normalizeExtraImages(row.extra_images),
  }
}

export function bodyToInsertPayload(body) {
  const types = Array.isArray(body.types) ? body.types : []
  const description =
    body.description && typeof body.description === 'object' ? body.description : {}
  const info =
    body.info === null || body.info === undefined
      ? null
      : typeof body.info === 'object'
        ? body.info
        : null
  const resolution =
    body.resolution === null || body.resolution === undefined
      ? null
      : typeof body.resolution === 'object'
        ? body.resolution
        : null
  const extra_images = normalizeExtraImages(body.extra_images)

  return {
    id: String(body.id || '').trim(),
    order_index: Number.isFinite(Number(body.order_index))
      ? Number(body.order_index)
      : Number(body.order) || 0,
    title: String(body.title ?? ''),
    artwork_date: String(body.date || body.artwork_date || '').slice(0, 10),
    description,
    image_url: body.image || body.image_url || null,
    video_url: body.video || body.video_url || null,
    orientation: body.orientation || 'square',
    group_key: body.group === undefined ? null : body.group,
    group_display: body.groupDisplay || body.group_display || null,
    types,
    info,
    resolution,
    extra_images,
  }
}

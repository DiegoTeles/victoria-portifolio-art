function normalizeTypes(raw) {
  if (Array.isArray(raw)) return raw
  if (raw && typeof raw === 'object') return Object.values(raw)
  return []
}

function normalizeExtraImages(raw) {
  if (!Array.isArray(raw)) return []
  return raw.map((x) => String(x || '').trim()).filter(Boolean)
}

function normalizeExtraDescriptions(raw, extraImagesCount) {
  const arr = Array.isArray(raw) ? raw : []
  const out = []
  for (let i = 0; i < extraImagesCount; i++) {
    const o = arr[i]
    out.push(
      o && typeof o === 'object' && !Array.isArray(o)
        ? { ...o }
        : {}
    )
  }
  return out
}

export function rowToArtwork(row, categoryAssignments) {
  const d = row.artwork_date
  const dateStr =
    d instanceof Date
      ? d.toISOString().slice(0, 10)
      : typeof d === 'string'
        ? d.slice(0, 10)
        : ''

  const extra_images = normalizeExtraImages(row.extra_images)
  const extra_descriptions = normalizeExtraDescriptions(row.extra_descriptions, extra_images.length)
  const base = {
    id: row.id,
    order_index: row.order_index,
    date: dateStr,
    title: row.title,
    description: row.description ?? {},
    image: row.image_url ?? undefined,
    video: row.video_url ?? undefined,
    resolution: row.resolution ?? undefined,
    mainMediaBytes:
      row.main_media_bytes != null && Number.isFinite(Number(row.main_media_bytes))
        ? Number(row.main_media_bytes)
        : undefined,
    group: row.group_key ?? null,
    groupDisplay: row.group_display ?? undefined,
    types: normalizeTypes(row.types),
    info: row.info ?? undefined,
    extra_images,
    extra_descriptions,
  }
  if (categoryAssignments !== undefined) {
    base.categoryAssignments = categoryAssignments
  }
  return base
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
  const rawBytes = body.mainMediaBytes ?? body.main_media_bytes
  const main_media_bytes =
    rawBytes == null || rawBytes === ''
      ? null
      : Number.isFinite(Number(rawBytes))
        ? Math.max(0, Math.floor(Number(rawBytes)))
        : null
  const extra_images = normalizeExtraImages(body.extra_images)
  const extra_descriptions = normalizeExtraDescriptions(body.extra_descriptions, extra_images.length)

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
    group_key: body.group === undefined ? null : body.group,
    group_display: body.groupDisplay || body.group_display || null,
    types,
    info,
    resolution,
    main_media_bytes,
    extra_images,
    extra_descriptions,
  }
}

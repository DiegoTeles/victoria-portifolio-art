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

function normalizeLocalizedObject(raw) {
  if (!raw || typeof raw !== 'object' || Array.isArray(raw)) return {}
  return { ...raw }
}

function inferResolutionTier(width, height) {
  const minEdge = Math.min(width, height)
  const mp = (width * height) / 1_000_000
  if (minEdge >= 2000 || mp >= 4) return 'high'
  if (minEdge >= 1200 || mp >= 1.5) return 'medium'
  return 'low'
}

function normalizeExtraResolutions(raw, extraImagesCount) {
  const arr = Array.isArray(raw) ? raw : []
  const out = []
  for (let i = 0; i < extraImagesCount; i++) {
    const o = arr[i]
    if (o && typeof o === 'object' && !Array.isArray(o)) {
      const w = Number(o.width)
      const h = Number(o.height)
      if (w > 0 && h > 0) {
        const megapixels = Number.isFinite(Number(o.megapixels))
          ? Number(o.megapixels)
          : Math.round(((w * h) / 1_000_000) * 100) / 100
        const tier =
          o.tier === 'high' || o.tier === 'medium' || o.tier === 'low'
            ? o.tier
            : inferResolutionTier(w, h)
        out.push({
          width: w,
          height: h,
          megapixels,
          tier,
          repo: o.repo ?? null,
        })
        continue
      }
    }
    out.push(null)
  }
  return out
}

function normalizeExtraMediaBytesArr(raw, extraImagesCount) {
  const arr = Array.isArray(raw) ? raw : []
  const out = []
  for (let i = 0; i < extraImagesCount; i++) {
    const v = arr[i]
    out.push(
      v != null && Number.isFinite(Number(v)) ? Math.max(0, Math.floor(Number(v))) : null
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
  const extra_titles = normalizeExtraDescriptions(row.extra_titles, extra_images.length)
  const extra_caption_media = normalizeExtraDescriptions(row.extra_caption_media, extra_images.length)
  const extra_physical_dimensions = normalizeExtraDescriptions(
    row.extra_physical_dimensions,
    extra_images.length
  )
  const extra_resolutions = normalizeExtraResolutions(row.extra_resolutions, extra_images.length)
  const extra_media_bytes_arr = normalizeExtraMediaBytesArr(
    row.extra_media_bytes,
    extra_images.length
  )
  const base = {
    id: row.id,
    order_index: row.order_index,
    date: dateStr,
    title: row.title,
    description: row.description ?? {},
    captionMedium: normalizeLocalizedObject(row.caption_medium),
    physicalDimensions: normalizeLocalizedObject(row.physical_dimensions),
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
    extraTitles: extra_titles,
    extraCaptionMedia: extra_caption_media,
    extraPhysicalDimensions: extra_physical_dimensions,
    extraResolutions: extra_resolutions.map((x) => x ?? undefined),
    extraMediaBytes: extra_media_bytes_arr.map((x) => (x != null ? x : undefined)),
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
  const caption_medium = normalizeLocalizedObject(body.captionMedium ?? body.caption_medium)
  const physical_dimensions = normalizeLocalizedObject(
    body.physicalDimensions ?? body.physical_dimensions
  )
  const extra_titles = normalizeExtraDescriptions(body.extraTitles ?? body.extra_titles, extra_images.length)
  const extra_caption_media = normalizeExtraDescriptions(
    body.extraCaptionMedia ?? body.extra_caption_media,
    extra_images.length
  )
  const extra_physical_dimensions = normalizeExtraDescriptions(
    body.extraPhysicalDimensions ?? body.extra_physical_dimensions,
    extra_images.length
  )
  const extra_resolutions = normalizeExtraResolutions(
    body.extraResolutions ?? body.extra_resolutions,
    extra_images.length
  )
  const extra_media_bytes = normalizeExtraMediaBytesArr(
    body.extraMediaBytes ?? body.extra_media_bytes,
    extra_images.length
  )

  return {
    id: String(body.id || '').trim(),
    order_index: Number.isFinite(Number(body.order_index))
      ? Number(body.order_index)
      : Number(body.order) || 0,
    title: String(body.title ?? ''),
    artwork_date: String(body.date || body.artwork_date || '').slice(0, 10),
    description,
    caption_medium,
    physical_dimensions,
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
    extra_titles,
    extra_caption_media,
    extra_physical_dimensions,
    extra_resolutions,
    extra_media_bytes,
  }
}

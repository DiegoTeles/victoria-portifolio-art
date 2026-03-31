export async function loadCategoriesForArtworks(sql, artworkIds) {
  const map = new Map()
  if (!artworkIds.length) return map
  const idsSet = new Set(artworkIds)
  const rows = await sql`
    SELECT artwork_id, category_id, subcategory_id
    FROM artwork_categories
  `
  for (const row of rows) {
    if (!idsSet.has(row.artwork_id)) continue
    const id = row.artwork_id
    const list = map.get(id) ?? []
    list.push({
      categoryId: String(row.category_id),
      subcategoryId: row.subcategory_id == null ? null : String(row.subcategory_id),
    })
    map.set(id, list)
  }
  return map
}

export async function loadCategoriesForArtwork(sql, artworkId) {
  const m = await loadCategoriesForArtworks(sql, [artworkId])
  return m.get(artworkId) ?? []
}

function normalizeAssignments(raw) {
  if (!Array.isArray(raw)) return []
  const out = []
  for (const x of raw) {
    if (!x || typeof x !== 'object') continue
    const categoryId = String(x.categoryId ?? x.category_id ?? '').trim()
    if (!categoryId) continue
    const subRaw = x.subcategoryId ?? x.subcategory_id
    const subcategoryId =
      subRaw === null || subRaw === undefined || subRaw === ''
        ? null
        : String(subRaw).trim()
    out.push({ categoryId, subcategoryId })
  }
  return out
}

export async function validateAndSyncArtworkCategories(sql, artworkId, body) {
  const assignments = normalizeAssignments(body.categoryAssignments ?? body.categories)
  await sql`DELETE FROM artwork_categories WHERE artwork_id = ${artworkId}`
  for (const a of assignments) {
    if (a.subcategoryId) {
      const sub = await sql`
        SELECT id, category_id FROM subcategories WHERE id = ${a.subcategoryId}::uuid LIMIT 1
      `
      const row = sub[0]
      if (!row || String(row.category_id) !== a.categoryId) {
        throw new Error('Subcategoria inválida para a categoria')
      }
      await sql`
        INSERT INTO artwork_categories (artwork_id, category_id, subcategory_id)
        VALUES (${artworkId}, ${a.categoryId}::uuid, ${a.subcategoryId}::uuid)
      `
    } else {
      await sql`
        INSERT INTO artwork_categories (artwork_id, category_id, subcategory_id)
        VALUES (${artworkId}, ${a.categoryId}::uuid, NULL)
      `
    }
  }
}

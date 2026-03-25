import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const jsonPath = path.join(__dirname, '..', 'src', 'data', 'artworks.json')

function segmentScore(seg) {
  let max = 0
  for (const a of seg) {
    const mp = a.resolution?.megapixels
    if (typeof mp === 'number' && mp > max) max = mp
  }
  return max
}

function buildSegments(sorted) {
  const segments = []
  let i = 0
  while (i < sorted.length) {
    const item = sorted[i]
    if (item.group) {
      const seg = [item]
      let k = i + 1
      while (k < sorted.length && sorted[k].group === item.group) {
        seg.push(sorted[k])
        k += 1
      }
      segments.push(seg)
      i = k
    } else {
      segments.push([item])
      i += 1
    }
  }
  return segments
}

const raw = fs.readFileSync(jsonPath, 'utf8')
const data = JSON.parse(raw)
const byOrder = [...data].sort((a, b) => (a.order ?? 0) - (b.order ?? 0))
const segments = buildSegments(byOrder)
const withIdx = segments.map((seg, origIndex) => ({
  seg,
  origIndex,
  score: segmentScore(seg),
}))
withIdx.sort((a, b) => {
  if (b.score !== a.score) return b.score - a.score
  return a.origIndex - b.origIndex
})
const flat = withIdx.flatMap((x) => x.seg)
flat.forEach((item, idx) => {
  item.order = idx + 1
})
fs.writeFileSync(jsonPath, JSON.stringify(flat, null, 2) + '\n', 'utf8')
console.log('sorted', flat.length, 'items in', segments.length, 'segments')

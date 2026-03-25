import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'
import sizeOf from 'image-size'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const root = path.join(__dirname, '..')
const jsonPath = path.join(root, 'src', 'data', 'artworks.json')
const publicDir = path.join(root, 'public')

function repoFromPath(imagePath) {
  const m = imagePath.match(/\/images\/([^/]+)\//)
  return m ? m[1] : null
}

function tierForDimensions(width, height) {
  const minEdge = Math.min(width, height)
  const mp = (width * height) / 1_000_000
  if (minEdge >= 2000 || mp >= 4) return 'high'
  if (minEdge >= 1200 || mp >= 1.5) return 'medium'
  return 'low'
}

const raw = fs.readFileSync(jsonPath, 'utf8')
const data = JSON.parse(raw)

for (const item of data) {
  delete item.resolution
  const rel = item.image
  if (!rel || typeof rel !== 'string') continue
  const abs = path.join(publicDir, rel.replace(/^\//, ''))
  if (!fs.existsSync(abs)) {
    console.warn('missing:', rel)
    continue
  }
  try {
    const buf = fs.readFileSync(abs)
    const dim = sizeOf(buf)
    if (!dim.width || !dim.height) continue
    const w = dim.width
    const h = dim.height
    const megapixels = Math.round(((w * h) / 1_000_000) * 100) / 100
    item.resolution = {
      width: w,
      height: h,
      megapixels,
      tier: tierForDimensions(w, h),
      repo: repoFromPath(rel),
    }
  } catch (e) {
    console.warn('skip', rel, e.message)
  }
}

fs.writeFileSync(jsonPath, JSON.stringify(data, null, 2) + '\n', 'utf8')
console.log('updated', jsonPath)

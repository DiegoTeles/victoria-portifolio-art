import type { ArtworkResolution, ImageRepo, ResolutionTier } from '@/data/artworks'

function tierForDimensions(width: number, height: number): ResolutionTier {
  const minEdge = Math.min(width, height)
  const mp = (width * height) / 1_000_000
  if (minEdge >= 2000 || mp >= 4) return 'high'
  if (minEdge >= 1200 || mp >= 1.5) return 'medium'
  return 'low'
}

function resolutionFromDims(
  width: number,
  height: number,
  repo: ImageRepo = null
): ArtworkResolution {
  const megapixels = Math.round(((width * height) / 1_000_000) * 100) / 100
  return {
    width,
    height,
    megapixels,
    tier: tierForDimensions(width, height),
    repo,
  }
}

async function measureImageFile(file: File): Promise<ArtworkResolution | null> {
  try {
    const bmp = await createImageBitmap(file)
    const w = bmp.width
    const h = bmp.height
    bmp.close()
    if (!w || !h) return null
    return resolutionFromDims(w, h, null)
  } catch {
    return new Promise((resolve) => {
      const url = URL.createObjectURL(file)
      const img = new Image()
      img.onload = () => {
        URL.revokeObjectURL(url)
        const w = img.naturalWidth
        const h = img.naturalHeight
        resolve(w && h ? resolutionFromDims(w, h, null) : null)
      }
      img.onerror = () => {
        URL.revokeObjectURL(url)
        resolve(null)
      }
      img.src = url
    })
  }
}

async function measureVideoFile(file: File): Promise<ArtworkResolution | null> {
  return new Promise((resolve) => {
    const url = URL.createObjectURL(file)
    const v = document.createElement('video')
    v.preload = 'metadata'
    v.muted = true
    const done = () => {
      URL.revokeObjectURL(url)
    }
    v.onloadedmetadata = () => {
      const w = v.videoWidth
      const h = v.videoHeight
      done()
      resolve(w && h ? resolutionFromDims(w, h, null) : null)
    }
    v.onerror = () => {
      done()
      resolve(null)
    }
    v.src = url
  })
}

export async function measureMainMediaFile(file: File): Promise<ArtworkResolution | null> {
  if (file.type.startsWith('video/')) {
    return measureVideoFile(file)
  }
  return measureImageFile(file)
}

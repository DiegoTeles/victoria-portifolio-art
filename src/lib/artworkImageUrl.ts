import { apiUrl } from '@/lib/apiUrl'

const DEFAULT_ARTWORK_IMAGE = '/images/digital-art/digital-art-01.png'

type ArtworkImageLike = { image?: string | null }

export function getArtworkImageSrc(artwork: ArtworkImageLike): string {
  const raw = typeof artwork.image === 'string' ? artwork.image.trim() : ''
  if (!raw) return DEFAULT_ARTWORK_IMAGE
  if (raw.startsWith('blob:')) return raw
  if (raw.startsWith('/api/')) return apiUrl(raw)
  if (raw.startsWith('http://') || raw.startsWith('https://')) {
    try {
      const parsed = new URL(raw)
      if (parsed.pathname.startsWith('/api/')) {
        return apiUrl(`${parsed.pathname}${parsed.search}`)
      }
    } catch {
      return raw
    }
    return raw
  }
  if (raw.startsWith('//')) return `https:${raw}`
  if (raw.startsWith('/')) return raw
  return `/${raw}`
}

export function getArtworkVideoSrc(video: string | null | undefined): string {
  const raw = typeof video === 'string' ? video.trim() : ''
  if (!raw) return ''
  if (raw.startsWith('blob:')) return raw
  if (raw.startsWith('/api/')) return apiUrl(raw)
  if (raw.startsWith('http://') || raw.startsWith('https://')) {
    try {
      const parsed = new URL(raw)
      if (parsed.pathname.startsWith('/api/')) {
        return apiUrl(`${parsed.pathname}${parsed.search}`)
      }
    } catch {
      return raw
    }
    return raw
  }
  if (raw.startsWith('//')) return `https:${raw}`
  if (raw.startsWith('/')) return raw
  return `/${raw}`
}

export function getAbsoluteArtworkImageUrl(artwork: ArtworkImageLike): string {
  const src = getArtworkImageSrc(artwork)
  if (src.startsWith('http://') || src.startsWith('https://')) return src
  if (typeof window === 'undefined') return src
  const path = src.startsWith('/') ? src : `/${src}`
  return `${window.location.origin}${path}`
}

export { DEFAULT_ARTWORK_IMAGE }

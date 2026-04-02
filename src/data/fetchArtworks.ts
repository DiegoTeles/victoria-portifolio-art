import { apiUrl } from '@/lib/apiUrl'
import type { Artwork } from './artworks'
import { artworks as staticArtworks } from './artworks'

export async function loadArtworks(): Promise<Artwork[]> {
  try {
    const r = await fetch(apiUrl('/api/artworks'), { credentials: 'include', cache: 'no-store' })
    if (r.ok) {
      const data: unknown = await r.json()
      if (Array.isArray(data)) return data as Artwork[]
    }
    if (r.status === 503) {
      return staticArtworks
    }
  } catch {
    void 0
  }
  return staticArtworks
}

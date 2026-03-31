import type { Artwork } from './artworks'
import { artworks as staticArtworks } from './artworks'

export async function loadArtworks(): Promise<Artwork[]> {
  try {
    const r = await fetch('/api/artworks', { credentials: 'same-origin' })
    if (r.ok) {
      const data: unknown = await r.json()
      if (Array.isArray(data)) return data as Artwork[]
    }
  } catch {
    void 0
  }
  return staticArtworks
}

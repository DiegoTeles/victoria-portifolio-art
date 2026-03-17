import type { ArtworkType } from '../data/artworks'
import type { TranslationKey } from './translations'

const typeKeys: Record<ArtworkType, TranslationKey> = {
  'drawing': 'typeDrawing',
  'painting': 'typePainting',
  'photography': 'typePhotography',
  'digital-art': 'typeDigitalArt',
  'movies': 'typeMovies',
}

export function formatArtworkTypes(
  types: ArtworkType[],
  t: (key: TranslationKey) => string
): string {
  if (!types.length) return ''
  return types.map((ty) => t(typeKeys[ty])).join(' / ')
}

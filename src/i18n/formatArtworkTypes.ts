import type { ArtworkType } from '../data/artworks'
import type { TranslationKey } from './translations'

const typeKeys: Record<ArtworkType, TranslationKey> = {
  'desenho': 'typeDesenho',
  'pintura': 'typePintura',
  'fotografia': 'typeFotografia',
  'arte-digital': 'typeArteDigital',
}

export function formatArtworkTypes(
  types: ArtworkType[],
  t: (key: TranslationKey) => string
): string {
  if (!types.length) return ''
  return types.map((ty) => t(typeKeys[ty])).join(' / ')
}

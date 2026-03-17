import artworksData from './artworks.json'

export type Locale = 'pt-Br' | 'en' | 'fr' | 'it' | 'de'

export type ArtworkType = 'drawing' | 'painting' | 'photography' | 'digital-art' | 'movies'

export type GroupDisplayType =
  | 'caption-in-grid'
  | 'asymmetric-5'
  | 'single-caption'
  | 'per-image-caption'

export type LocalizedText = Partial<Record<Locale, string>>

export function getLocalized(obj: LocalizedText | null | undefined, locale: Locale): string {
  return obj?.[locale] ?? obj?.['en'] ?? obj?.['pt-Br'] ?? ''
}

export interface Artwork {
  id: string
  title: string
  description: LocalizedText
  image?: string
  video?: string
  orientation: 'square' | 'horizontal' | 'vertical'
  group: string | null
  groupDisplay?: GroupDisplayType
  types: ArtworkType[]
  info?: LocalizedText | null
}

type ArtworkWithOrder = Artwork & { order: number }

function withoutOrder(x: ArtworkWithOrder): Artwork {
  const { order, ...rest } = x
  void order
  return rest
}

export const artworks: Artwork[] = (artworksData as ArtworkWithOrder[])
  .slice()
  .sort((a, b) => a.order - b.order)
  .map(withoutOrder)

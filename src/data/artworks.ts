import artworksData from './artworks.json'

export type Locale = 'pt-Br' | 'en'

export type ArtworkType = 'drawing' | 'painting' | 'photography' | 'digital-art'

export type GroupDisplayType =
  | 'caption-in-grid'
  | 'asymmetric-5'
  | 'single-caption'
  | 'per-image-caption'

export interface Artwork {
  id: string
  title: { [K in Locale]: string }
  description: { [K in Locale]: string }
  image: string
  orientation: 'square' | 'horizontal' | 'vertical'
  group: string | null
  groupDisplay?: GroupDisplayType
  types: ArtworkType[]
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

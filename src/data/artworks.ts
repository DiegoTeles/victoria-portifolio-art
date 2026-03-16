export type Locale = 'pt-Br' | 'en'

export type ArtworkType = 'desenho' | 'pintura' | 'fotografia' | 'arte-digital'

export interface Artwork {
  id: string
  title: { [K in Locale]: string }
  description: { [K in Locale]: string }
  image: string
  orientation: 'square' | 'horizontal' | 'vertical'
  pair: string | null
  types: ArtworkType[]
}

const orientations: Artwork['orientation'][] = ['square', 'horizontal', 'vertical']
const dimensions: [number, number][] = [[800, 800], [800, 500], [600, 800]]

const typeSets: ArtworkType[][] = [
  ['desenho'],
  ['pintura'],
  ['fotografia'],
  ['arte-digital'],
  ['desenho', 'pintura'],
  ['pintura', 'fotografia'],
  ['desenho', 'arte-digital'],
  ['fotografia', 'arte-digital'],
]

function makeArtwork(
  n: number,
  orientation: Artwork['orientation'],
  pair: string | null,
  types: ArtworkType[] = ['desenho']
): Artwork {
  const idx = orientations.indexOf(orientation)
  const [w, h] = dimensions[idx]
  const id = `obra-${String(n).padStart(2, '0')}`
  return {
    id,
    title: { 'pt-Br': `Obra ${n}`, en: `Work ${n}` },
    description: {
      'pt-Br': `Descrição da obra ${n}.`,
      en: `Description for work ${n}.`,
    },
    image: `https://picsum.photos/seed/${id.replace('-', '')}/${w}/${h}`,
    orientation,
    pair,
    types,
  }
}

export const artworks: Artwork[] = [
  makeArtwork(1, 'square', null, typeSets[0]),
  makeArtwork(2, 'horizontal', null, typeSets[1]),
  makeArtwork(3, 'vertical', 'grupo-1', typeSets[2]),
  makeArtwork(4, 'vertical', 'grupo-1', typeSets[2]),
  makeArtwork(5, 'square', null, typeSets[3]),
  makeArtwork(6, 'horizontal', null, typeSets[4]),
  makeArtwork(7, 'vertical', null, typeSets[5]),
  makeArtwork(8, 'square', null, typeSets[6]),
  makeArtwork(9, 'horizontal', 'grupo-2', typeSets[7]),
  makeArtwork(10, 'horizontal', 'grupo-2', typeSets[7]),
  makeArtwork(11, 'vertical', null, typeSets[0]),
  makeArtwork(12, 'square', null, typeSets[1]),
  makeArtwork(13, 'horizontal', null, typeSets[2]),
  makeArtwork(14, 'vertical', null, typeSets[3]),
  makeArtwork(15, 'square', null, typeSets[4]),
  makeArtwork(16, 'vertical', 'grupo-3', typeSets[5]),
  makeArtwork(17, 'vertical', 'grupo-3', typeSets[5]),
  makeArtwork(18, 'horizontal', null, typeSets[6]),
  makeArtwork(19, 'square', null, typeSets[7]),
  makeArtwork(20, 'horizontal', null, typeSets[0]),
  makeArtwork(21, 'vertical', null, typeSets[1]),
  makeArtwork(22, 'square', null, typeSets[2]),
  makeArtwork(23, 'horizontal', null, typeSets[3]),
  makeArtwork(24, 'vertical', null, typeSets[4]),
  makeArtwork(25, 'square', null, typeSets[5]),
  makeArtwork(26, 'horizontal', 'grupo-4', typeSets[6]),
  makeArtwork(27, 'horizontal', 'grupo-4', typeSets[6]),
  makeArtwork(28, 'vertical', null, typeSets[7]),
  makeArtwork(29, 'square', null, typeSets[0]),
  makeArtwork(30, 'horizontal', null, typeSets[1]),
  makeArtwork(31, 'vertical', null, typeSets[2]),
  makeArtwork(32, 'square', null, typeSets[3]),
  makeArtwork(33, 'vertical', 'grupo-5', typeSets[4]),
  makeArtwork(34, 'vertical', 'grupo-5', typeSets[4]),
  makeArtwork(35, 'horizontal', null, typeSets[5]),
  makeArtwork(36, 'square', null, typeSets[6]),
  makeArtwork(37, 'horizontal', null, typeSets[7]),
  makeArtwork(38, 'vertical', null, typeSets[0]),
  makeArtwork(39, 'square', null, typeSets[1]),
  makeArtwork(40, 'horizontal', null, typeSets[2]),
  makeArtwork(41, 'vertical', null, typeSets[3]),
  makeArtwork(42, 'square', null, typeSets[4]),
  makeArtwork(43, 'horizontal', 'grupo-6', typeSets[5]),
  makeArtwork(44, 'horizontal', 'grupo-6', typeSets[5]),
  makeArtwork(45, 'vertical', null, typeSets[6]),
  makeArtwork(46, 'square', null, typeSets[7]),
  makeArtwork(47, 'horizontal', null, typeSets[0]),
  makeArtwork(48, 'vertical', null, typeSets[1]),
  makeArtwork(49, 'square', null, typeSets[2]),
  makeArtwork(50, 'vertical', 'grupo-7', typeSets[3]),
  makeArtwork(51, 'vertical', 'grupo-7', typeSets[3]),
  makeArtwork(52, 'horizontal', null, typeSets[4]),
  makeArtwork(53, 'square', null, typeSets[5]),
  makeArtwork(54, 'horizontal', null, typeSets[6]),
  makeArtwork(55, 'vertical', null, typeSets[7]),
  makeArtwork(56, 'square', null, typeSets[0]),
  makeArtwork(57, 'horizontal', null, typeSets[1]),
  makeArtwork(58, 'vertical', null, typeSets[2]),
  makeArtwork(59, 'square', null, typeSets[3]),
  makeArtwork(60, 'horizontal', null, typeSets[4]),
]

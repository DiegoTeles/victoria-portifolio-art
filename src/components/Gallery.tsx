import { useMemo, useState } from 'react'
import { artworks as artworksList, type Artwork, type ArtworkType } from '../data/artworks'

export type GalleryFilterType = ArtworkType | 'drawing-painting'
import { useLocale } from '../i18n/LocaleContext'
import type { ViewMode } from './ViewToggle'
import { ArtworkCard } from './ArtworkCard'
import { ArtworkGroup } from './ArtworkGroup'
import { Lightbox } from './Lightbox'

type Cell =
  | { type: 'single'; artwork: Artwork }
  | { type: 'group'; artworks: Artwork[] }

function buildCells(artworks: Artwork[]): Cell[] {
  const cells: Cell[] = []
  let i = 0
  while (i < artworks.length) {
    const a = artworks[i]
    if (a.group) {
      const group: Artwork[] = [a]
      let j = i + 1
      while (j < artworks.length && artworks[j].group === a.group && group.length < 5) {
        group.push(artworks[j])
        j += 1
      }
      if (group.length >= 2) {
        cells.push({ type: 'group', artworks: group })
        i = j
        continue
      }
    }
    cells.push({ type: 'single', artwork: a })
    i += 1
  }
  return cells
}

type GalleryProps = { viewMode: ViewMode; typeFilter?: GalleryFilterType }

export function Gallery({ viewMode, typeFilter }: GalleryProps) {
  const { locale } = useLocale()
  const [lightboxIndex, setLightboxIndex] = useState<number | null>(null)

  const filteredArtworks = useMemo(() => {
    if (!typeFilter) return artworksList
    if (typeFilter === 'drawing-painting') {
      return artworksList.filter((a) => a.types.includes('drawing') || a.types.includes('painting'))
    }
    return artworksList.filter((a) => a.types.includes(typeFilter))
  }, [typeFilter])

  const cells = useMemo(() => buildCells(filteredArtworks), [filteredArtworks])
  const flatArtworks = useMemo(() => filteredArtworks, [filteredArtworks])

  let indexCounter = 0
  const openLightbox = (index: number) => setLightboxIndex(index)
  const closeLightbox = () => setLightboxIndex(null)

  return (
    <section id="gallery" className="gallery" aria-label="Galeria">
      <div className={`gallery-grid view-${viewMode}`}>
        {cells.map((cell) => {
          if (cell.type === 'single') {
            const idx = indexCounter++
            return (
              <ArtworkCard
                key={cell.artwork.id}
                artwork={cell.artwork}
                locale={locale}
                onSelect={() => openLightbox(idx)}
              />
            )
          }
          const startIdx = indexCounter
          indexCounter += cell.artworks.length
          return (
            <ArtworkGroup
              key={cell.artworks.map((a) => a.id).join('-')}
              artworks={cell.artworks}
              locale={locale}
              groupDisplay={cell.artworks[0].groupDisplay}
              onSelect={(offset) => openLightbox(startIdx + offset)}
            />
          )
        })}
      </div>
      {lightboxIndex !== null && (
        <Lightbox
          artworks={flatArtworks}
          initialIndex={lightboxIndex}
          locale={locale}
          onClose={closeLightbox}
        />
      )}
    </section>
  )
}

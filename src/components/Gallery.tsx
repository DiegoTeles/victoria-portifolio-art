import { useMemo, useState } from 'react'
import { artworks as artworksList, type Artwork } from '../data/artworks'
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

type GalleryProps = { viewMode: ViewMode }

export function Gallery({ viewMode }: GalleryProps) {
  const { locale } = useLocale()
  const [lightboxIndex, setLightboxIndex] = useState<number | null>(null)

  const cells = useMemo(() => buildCells(artworksList), [])
  const flatArtworks = useMemo(() => artworksList, [])

  let indexCounter = 0
  const openLightbox = (index: number) => setLightboxIndex(index)
  const closeLightbox = () => setLightboxIndex(null)

  return (
    <section className="gallery" aria-label="Galeria">
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

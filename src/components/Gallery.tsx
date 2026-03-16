import { useMemo, useState } from 'react'
import { artworks as artworksList, type Artwork } from '../data/artworks'
import { useLocale } from '../i18n/LocaleContext'
import type { ViewMode } from './ViewToggle'
import { ArtworkCard } from './ArtworkCard'
import { ArtworkPair } from './ArtworkPair'
import { Lightbox } from './Lightbox'

type Cell =
  | { type: 'single'; artwork: Artwork }
  | { type: 'pair'; artworks: [Artwork, Artwork] }

function buildCells(artworks: Artwork[]): Cell[] {
  const cells: Cell[] = []
  let i = 0
  while (i < artworks.length) {
    const a = artworks[i]
    if (a.pair) {
      const j = artworks.findIndex((x, idx) => idx > i && x.pair === a.pair)
      if (j !== -1) {
        cells.push({ type: 'pair', artworks: [a, artworks[j]] })
        i = j + 1
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
          const idxFirst = indexCounter
          const idxSecond = indexCounter + 1
          indexCounter += 2
          return (
            <ArtworkPair
              key={cell.artworks[0].id + cell.artworks[1].id}
              artworks={cell.artworks}
              locale={locale}
              onSelectFirst={() => openLightbox(idxFirst)}
              onSelectSecond={() => openLightbox(idxSecond)}
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

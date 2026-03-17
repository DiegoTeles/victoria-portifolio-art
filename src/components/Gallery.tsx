import { useMemo, useState, useEffect, useRef } from 'react'
import { useSearchParams } from 'react-router-dom'
import { artworks as artworksList, type Artwork, type ArtworkType } from '../data/artworks'
import { useLocale } from '../i18n/LocaleContext'
import type { ViewMode } from './ViewToggle'
import { ArtworkCard } from './ArtworkCard'
import { ArtworkGroup } from './ArtworkGroup'
import { Lightbox } from './Lightbox'

export type GalleryFilterType = ArtworkType | 'drawing-painting'

const PAGE_SIZE = 10

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
  const { locale, t } = useLocale()
  const [searchParams, setSearchParams] = useSearchParams()
  const [lightboxIndex, setLightboxIndex] = useState<number | null>(null)

  const filteredArtworks = useMemo(() => {
    if (!typeFilter) return artworksList
    if (typeFilter === 'drawing-painting') {
      return artworksList.filter((a) => a.types.includes('drawing') || a.types.includes('painting'))
    }
    return artworksList.filter((a) => a.types.includes(typeFilter))
  }, [typeFilter])

  const allCells = useMemo(() => buildCells(filteredArtworks), [filteredArtworks])
  const totalPages = Math.max(1, Math.ceil(allCells.length / PAGE_SIZE))
  const pageParam = searchParams.get('page')
  const currentPage = Math.min(
    totalPages,
    Math.max(1, parseInt(pageParam ?? '1', 10) || 1)
  )

  const prevFilterRef = useRef(typeFilter)

  useEffect(() => {
    const param = searchParams.get('page')
    const expected = String(currentPage)
    if (param != null && param !== expected) {
      setSearchParams((prev) => {
        const next = new URLSearchParams(prev)
        next.set('page', expected)
        return next
      })
    }
  }, [currentPage, searchParams, setSearchParams])

  useEffect(() => {
    if (prevFilterRef.current !== typeFilter) {
      prevFilterRef.current = typeFilter
      setSearchParams((prev) => {
        const next = new URLSearchParams(prev)
        next.set('page', '1')
        return next
      })
    }
  }, [typeFilter, setSearchParams])

  const cells = useMemo(
    () =>
      allCells.slice(
        (currentPage - 1) * PAGE_SIZE,
        currentPage * PAGE_SIZE
      ),
    [allCells, currentPage]
  )

  const pageArtworks = useMemo(
    () =>
      cells.flatMap((c) =>
        c.type === 'single' ? [c.artwork] : c.artworks
      ),
    [cells]
  )

  const goToPage = (n: number) => {
    const page = Math.max(1, Math.min(totalPages, n))
    setSearchParams((prev) => {
      const next = new URLSearchParams(prev)
      next.set('page', String(page))
      return next
    })
  }

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
      {totalPages > 1 && (
        <nav className="gallery-pagination" aria-label="Paginação da galeria">
          <button
            type="button"
            className="pagination-btn"
            disabled={currentPage <= 1}
            onClick={() => goToPage(currentPage - 1)}
            aria-label={t('paginationPrev')}
          >
            {t('paginationPrev')}
          </button>
          <span className="pagination-info" aria-live="polite">
            {t('paginationPage')} {currentPage} {t('paginationOf')} {totalPages}
          </span>
          <button
            type="button"
            className="pagination-btn"
            disabled={currentPage >= totalPages}
            onClick={() => goToPage(currentPage + 1)}
            aria-label={t('paginationNext')}
          >
            {t('paginationNext')}
          </button>
        </nav>
      )}
      {lightboxIndex !== null && (
        <Lightbox
          artworks={pageArtworks}
          initialIndex={lightboxIndex}
          locale={locale}
          onClose={closeLightbox}
        />
      )}
    </section>
  )
}

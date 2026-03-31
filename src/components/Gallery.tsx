import { useMemo, useState, useEffect, useRef } from 'react'
import { useSearchParams, useParams, useNavigate, useLocation } from 'react-router-dom'
import { type Artwork, type ArtworkType, getLocalized } from '../data/artworks'
import { loadArtworks } from '../data/fetchArtworks'
import { getAbsoluteArtworkImageUrl, DEFAULT_ARTWORK_IMAGE } from '@/lib/artworkImageUrl'
import { useLocale } from '../i18n/LocaleContext'

function plainMetaText(str: string): string {
  return str.replace(/\*([^*]+)\*/g, '$1').replace(/\n/g, ' ').trim()
}

function setArtworkMeta(
  artwork: Artwork,
  locale: 'pt-Br' | 'en' | 'fr' | 'it' | 'de',
  siteTitle: string,
  defaultDesc: string
) {
  const title = plainMetaText(artwork.title)
  const desc = plainMetaText(getLocalized(artwork.description, locale))
  const imageUrl = getAbsoluteArtworkImageUrl(artwork)
  const pageTitle = title ? `${title} — ${siteTitle}` : siteTitle
  const metaDesc = desc || defaultDesc
  document.title = pageTitle
  const setMeta = (selector: string, attr: string, value: string) => {
    const el = document.querySelector(selector)
    if (el) el.setAttribute(attr, value)
  }
  setMeta('meta[name="description"]', 'content', metaDesc)
  setMeta('meta[property="og:title"]', 'content', pageTitle)
  setMeta('meta[property="og:description"]', 'content', metaDesc)
  setMeta('meta[property="og:image"]', 'content', imageUrl)
  setMeta('meta[name="twitter:title"]', 'content', pageTitle)
  setMeta('meta[name="twitter:description"]', 'content', metaDesc)
  setMeta('meta[name="twitter:image"]', 'content', imageUrl)
}

function resetMeta(siteTitle: string, siteDesc: string, defaultImage: string) {
  const base = window.location.origin
  document.title = siteTitle
  const setMeta = (selector: string, attr: string, value: string) => {
    const el = document.querySelector(selector)
    if (el) el.setAttribute(attr, value)
  }
  setMeta('meta[name="description"]', 'content', siteDesc)
  setMeta('meta[property="og:title"]', 'content', siteTitle)
  setMeta('meta[property="og:description"]', 'content', siteDesc)
  setMeta('meta[property="og:image"]', 'content', base + defaultImage)
  setMeta('meta[name="twitter:title"]', 'content', siteTitle)
  setMeta('meta[name="twitter:description"]', 'content', siteDesc)
  setMeta('meta[name="twitter:image"]', 'content', base + defaultImage)
}
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

function findArtworkPageAndIndex(
  allCells: Cell[],
  artworkId: string,
  pageSize: number
): { page: number; indexInPage: number } | null {
  let cellIndex = 0
  for (const cell of allCells) {
    const artworksInCell = cell.type === 'single' ? [cell.artwork] : cell.artworks
    const idx = artworksInCell.findIndex((a) => a.id === artworkId)
    if (idx !== -1) {
      const page = Math.floor(cellIndex / pageSize) + 1
      const pageStart = (page - 1) * pageSize
      const pageCells = allCells.slice(pageStart, pageStart + pageSize)
      const pageArtworksList = pageCells.flatMap((c) =>
        c.type === 'single' ? [c.artwork] : c.artworks
      )
      const indexInPage = pageArtworksList.findIndex((a) => a.id === artworkId)
      return { page, indexInPage }
    }
    cellIndex += 1
  }
  return null
}

type CategoryTreeItem = {
  id: string
  slug: string
  name: string
  subcategories: { id: string; slug: string; name: string }[]
}

function artworkMatchesCategorySlugs(
  artwork: Artwork,
  tree: CategoryTreeItem[] | null,
  catSlug: string | undefined,
  subSlug: string | undefined
) {
  if (!catSlug && !subSlug) return true
  if (!tree?.length) return true
  const assigns = artwork.categoryAssignments ?? []
  if (!assigns.length) return false
  if (catSlug) {
    const cat = tree.find((c) => c.slug === catSlug)
    if (!cat) return false
    if (!subSlug) {
      return assigns.some((a) => a.categoryId === cat.id)
    }
    const sub = cat.subcategories.find((s) => s.slug === subSlug)
    if (!sub) return false
    return assigns.some((a) => a.subcategoryId === sub.id)
  }
  if (subSlug) {
    for (const c of tree) {
      const sub = c.subcategories.find((s) => s.slug === subSlug)
      if (sub) return assigns.some((a) => a.subcategoryId === sub.id)
    }
    return false
  }
  return true
}

type GalleryProps = {
  viewMode: ViewMode
  typeFilter?: GalleryFilterType
  categorySlug?: string
  subcategorySlug?: string
}

export function Gallery({ viewMode, typeFilter, categorySlug, subcategorySlug }: GalleryProps) {
  const { locale, t } = useLocale()
  const [searchParams, setSearchParams] = useSearchParams()
  const params = useParams()
  const navigate = useNavigate()
  const location = useLocation()
  const [lightboxIndex, setLightboxIndex] = useState<number | null>(null)
  const [artworksList, setArtworksList] = useState<Artwork[] | null>(null)
  const [categoryTree, setCategoryTree] = useState<CategoryTreeItem[] | null>(null)
  const imageIdFromRoute = params.imageId ?? null

  useEffect(() => {
    let cancelled = false
    void loadArtworks().then((data) => {
      if (!cancelled) setArtworksList(data)
    })
    return () => {
      cancelled = true
    }
  }, [])

  useEffect(() => {
    let cancelled = false
    void fetch(`/api/categories?locale=${encodeURIComponent(locale)}`, { cache: 'no-store' })
      .then((r) => (r.ok ? r.json() : []))
      .then((data: unknown) => {
        if (cancelled) return
        setCategoryTree(Array.isArray(data) ? (data as CategoryTreeItem[]) : [])
      })
      .catch(() => {
        if (!cancelled) setCategoryTree([])
      })
    return () => {
      cancelled = true
    }
  }, [locale])

  const filteredArtworks = useMemo(() => {
    const list = artworksList ?? []
    let next = list
    if (typeFilter) {
      if (typeFilter === 'drawing-painting') {
        next = next.filter((a) => a.types.includes('drawing') || a.types.includes('painting'))
      } else {
        next = next.filter((a) => a.types.includes(typeFilter))
      }
    }
    if (categorySlug || subcategorySlug) {
      next = next.filter((a) =>
        artworkMatchesCategorySlugs(a, categoryTree, categorySlug, subcategorySlug)
      )
    }
    return next
  }, [typeFilter, artworksList, categoryTree, categorySlug, subcategorySlug])

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
        next.delete('image')
        return next
      })
    }
  }, [typeFilter, setSearchParams])

  const prevCatKey = useRef<string | null>(null)
  useEffect(() => {
    const key = `${categorySlug ?? ''}|${subcategorySlug ?? ''}`
    if (prevCatKey.current === null) {
      prevCatKey.current = key
      return
    }
    if (prevCatKey.current === key) return
    prevCatKey.current = key
    setSearchParams((prev) => {
      const next = new URLSearchParams(prev)
      next.set('page', '1')
      next.delete('image')
      return next
    })
  }, [categorySlug, subcategorySlug, setSearchParams])

  const imageParam = searchParams.get('image') || imageIdFromRoute
  const imageTarget = useMemo(
    () =>
      imageParam && allCells.length > 0
        ? findArtworkPageAndIndex(allCells, imageParam, PAGE_SIZE)
        : null,
    [imageParam, allCells]
  )

  useEffect(() => {
    if (!imageTarget) return
    if (currentPage !== imageTarget.page) {
      setSearchParams((prev) => {
        const next = new URLSearchParams(prev)
        next.set('page', String(imageTarget.page))
        return next
      })
      return
    }
    setLightboxIndex(imageTarget.indexInPage)
  }, [imageTarget, currentPage, setSearchParams])

  useEffect(() => {
    const siteTitle = t('siteTitle')
    const siteDesc = t('siteDescription')
    const defaultImg = DEFAULT_ARTWORK_IMAGE
    if (imageParam) {
      const artwork = (artworksList ?? []).find((a) => a.id === imageParam)
      if (artwork) setArtworkMeta(artwork, locale, siteTitle, siteDesc)
      else resetMeta(siteTitle, siteDesc, defaultImg)
    } else {
      resetMeta(siteTitle, siteDesc, defaultImg)
    }
  }, [imageParam, locale, t, artworksList])

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
  const openLightbox = (index: number) => {
    const id = pageArtworks[index]?.id
    setLightboxIndex(index)
    if (id) {
      navigate(
        { pathname: '/s/' + encodeURIComponent(id), search: location.search },
        { replace: true }
      )
    }
  }
  const closeLightbox = () => {
    setLightboxIndex(null)
    if (location.pathname.startsWith('/s/')) {
      const base = typeFilter === 'movies' ? '/movies' : '/'
      const next = new URLSearchParams(searchParams)
      next.delete('image')
      next.set('page', String(currentPage))
      if (typeFilter === 'movies') {
        next.delete('gallery')
      }
      const s = next.toString()
      navigate({ pathname: base, search: s ? `?${s}` : '' }, { replace: true })
    } else {
      setSearchParams((prev) => {
        const next = new URLSearchParams(prev)
        next.delete('image')
        return next
      })
    }
  }

  if (artworksList === null) {
    return (
      <section id="gallery" className="gallery" aria-label="Galeria">
        <p className="page-text gallery-loading">A carregar…</p>
      </section>
    )
  }

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

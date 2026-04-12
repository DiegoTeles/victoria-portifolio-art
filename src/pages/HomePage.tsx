import { useState, useEffect, useMemo } from 'react'
import { useLocation, useSearchParams } from 'react-router-dom'
import { ViewToggle, type ViewMode } from '../components/ViewToggle'
import { Gallery } from '../components/Gallery'
import { BackToTop } from '../components/BackToTop'
import { isValidSubForGallery } from '../data/galleryTaxonomy'

const VIEW_STORAGE_KEY = 'portfolio-view'
const GALLERY_TYPES = ['drawing-painting', 'photography', 'digital-art', 'movies'] as const
type GalleryType = (typeof GALLERY_TYPES)[number]

export function HomePage() {
  const location = useLocation()
  const [searchParams, setSearchParams] = useSearchParams()
  const validFilter = useMemo((): GalleryType | undefined => {
    if (location.pathname === '/movies') return 'movies'
    const q = searchParams.get('gallery')
    if (q && GALLERY_TYPES.includes(q as GalleryType)) return q as GalleryType
    if (location.pathname === '/' && location.hash) {
      const h = location.hash.slice(1)
      if (GALLERY_TYPES.includes(h as GalleryType)) return h as GalleryType
    }
    return undefined
  }, [location.pathname, location.hash, searchParams])

  const subRaw = searchParams.get('sub')
  const subcategorySlug = useMemo(() => {
    if (!subRaw || !validFilter) return undefined
    return isValidSubForGallery(validFilter, subRaw) ? subRaw : undefined
  }, [validFilter, subRaw])

  useEffect(() => {
    if (subRaw && (!validFilter || !isValidSubForGallery(validFilter, subRaw))) {
      setSearchParams((prev) => {
        const next = new URLSearchParams(prev)
        next.delete('sub')
        return next
      })
    }
  }, [subRaw, validFilter, setSearchParams])

  const [viewMode, setViewMode] = useState<ViewMode>(() => {
    if (typeof window === 'undefined') return 'list'
    const stored = localStorage.getItem(VIEW_STORAGE_KEY) as ViewMode | null
    return stored === 'grid' || stored === 'list' ? stored : 'list'
  })

  useEffect(() => {
    localStorage.setItem(VIEW_STORAGE_KEY, viewMode)
  }, [viewMode])

  useEffect(() => {
    if (validFilter) {
      document.getElementById('gallery')?.scrollIntoView({ behavior: 'smooth' })
    }
  }, [validFilter])

  return (
    <>
      <div className="view-toggle-bar">
        <ViewToggle viewMode={viewMode} onViewModeChange={setViewMode} />
      </div>
      <Gallery viewMode={viewMode} typeFilter={validFilter} subcategorySlug={subcategorySlug} />
      <BackToTop />
    </>
  )
}

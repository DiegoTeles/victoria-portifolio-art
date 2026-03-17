import { useState, useEffect } from 'react'
import { useLocation } from 'react-router-dom'
import { ViewToggle, type ViewMode } from '../components/ViewToggle'
import { Gallery } from '../components/Gallery'
import { BackToTop } from '../components/BackToTop'

const VIEW_STORAGE_KEY = 'portfolio-view'
const GALLERY_TYPES = ['drawing', 'painting', 'photography', 'digital-art'] as const
type GalleryType = (typeof GALLERY_TYPES)[number]

export function HomePage() {
  const location = useLocation()
  const typeFilter =
    location.pathname === '/' && location.hash
      ? (location.hash.slice(1) as GalleryType)
      : undefined
  const validFilter =
    typeFilter && GALLERY_TYPES.includes(typeFilter) ? typeFilter : undefined

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
      <Gallery viewMode={viewMode} typeFilter={validFilter} />
      <BackToTop />
    </>
  )
}

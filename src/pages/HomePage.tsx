import { useState, useEffect } from 'react'
import { ViewToggle, type ViewMode } from '../components/ViewToggle'
import { Gallery } from '../components/Gallery'
import { BackToTop } from '../components/BackToTop'

const VIEW_STORAGE_KEY = 'portfolio-view'

export function HomePage() {
  const [viewMode, setViewMode] = useState<ViewMode>(() => {
    if (typeof window === 'undefined') return 'list'
    const stored = localStorage.getItem(VIEW_STORAGE_KEY) as ViewMode | null
    return stored === 'grid' || stored === 'list' ? stored : 'list'
  })

  useEffect(() => {
    localStorage.setItem(VIEW_STORAGE_KEY, viewMode)
  }, [viewMode])

  return (
    <>
      <div className="view-toggle-bar">
        <ViewToggle viewMode={viewMode} onViewModeChange={setViewMode} />
      </div>
      <Gallery viewMode={viewMode} />
      <BackToTop />
    </>
  )
}

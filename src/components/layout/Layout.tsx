import { apiUrl } from '@/lib/apiUrl'
import { useEffect, useState } from 'react'
import { Outlet, Link, NavLink, useLocation } from 'react-router-dom'
import { ChevronRight } from 'lucide-react'
import { useLocale } from '../../i18n/LocaleContext'
import { LocaleSelector } from '../LocaleSelector'
import { ThemeToggle } from '../ThemeToggle'

const GALLERY_TYPES = ['drawing-painting', 'photography', 'digital-art', 'movies'] as const

type PublicCategory = {
  id: string
  slug: string
  name: string
  subcategories: { id: string; slug: string; name: string }[]
}

export function Layout() {
  const { locale, t } = useLocale()
  const [drawerOpen, setDrawerOpen] = useState(false)
  const [cmsCategories, setCmsCategories] = useState<PublicCategory[]>([])
  const location = useLocation()

  useEffect(() => {
    let cancelled = false
    void fetch(apiUrl(`/api/categories?locale=${encodeURIComponent(locale)}`), { cache: 'no-store' })
      .then((r) => (r.ok ? r.json() : []))
      .then((data: unknown) => {
        if (cancelled) return
        setCmsCategories(Array.isArray(data) ? (data as PublicCategory[]) : [])
      })
      .catch(() => {
        if (!cancelled) setCmsCategories([])
      })
    return () => {
      cancelled = true
    }
  }, [locale])

  useEffect(() => {
    document.title = t('siteTitle')
    const langMap: Record<string, string> = { 'pt-Br': 'pt-BR', en: 'en', fr: 'fr', it: 'it', de: 'de' }
    document.documentElement.lang = langMap[locale] ?? 'en'
    const meta = document.querySelector('meta[name="description"]')
    if (meta) meta.setAttribute('content', t('siteDescription'))
  }, [locale, t])

  useEffect(() => {
    const base = window.location.origin
    const path = location.pathname || '/'
    const hash = location.hash || ''
    const fullUrl = base + path + hash
    const ogUrl = document.querySelector('meta[property="og:url"]')
    const canon = document.querySelector('link[rel="canonical"]')
    if (ogUrl) ogUrl.setAttribute('content', fullUrl)
    if (canon) canon.setAttribute('href', fullUrl)
  }, [location.pathname, location.hash])

  useEffect(() => {
    setDrawerOpen(false)
  }, [location.pathname])

  const typeKeys = {
    'drawing-painting': 'typeDrawingPainting',
    'photography': 'typePhotography',
    'digital-art': 'typeDigitalArt',
    'movies': 'typeMovies',
  } as const

  return (
    <div className="layout">
      <header className="header">
        <Link to="/" className="navbar-logo" aria-label={t('goHome')}>
          Victória Maria
        </Link>
        <nav className="header-nav-center">
          <div className="nav-item-with-dropdown">
            <NavLink to="/" className="nav-link">
              {t('navHome')}
            </NavLink>
            <div className="nav-submenu" role="menu">
              {GALLERY_TYPES.map((type) => (
                <Link
                  key={type}
                  to={type === 'movies' ? '/movies' : `/?gallery=${encodeURIComponent(type)}`}
                  className="nav-submenu-link"
                  role="menuitem"
                >
                  {t(typeKeys[type])}
                </Link>
              ))}
            </div>
          </div>
          {cmsCategories.length > 0 ? (
            <div className="nav-item-with-dropdown">
              <span className="nav-link nav-dropdown-label">{t('navCategories')}</span>
              <div className="nav-submenu nav-submenu--categories" role="menu">
                {cmsCategories.map((c) => (
                  <div key={c.id} className="nav-category-flyout">
                    <Link
                      to={`/?category=${encodeURIComponent(c.slug)}`}
                      className="nav-submenu-link nav-submenu-link--parent nav-submenu-link--category-row"
                      role="menuitem"
                    >
                      <span>{c.name}</span>
                      {c.subcategories.length > 0 ? (
                        <ChevronRight className="nav-category-flyout-icon" aria-hidden size={16} />
                      ) : null}
                    </Link>
                    {c.subcategories.length > 0 ? (
                      <div className="nav-submenu-flyout" role="menu" aria-label={c.name}>
                        {c.subcategories.map((s) => (
                          <Link
                            key={s.id}
                            to={`/?category=${encodeURIComponent(c.slug)}&sub=${encodeURIComponent(s.slug)}`}
                            className="nav-submenu-link nav-submenu-flyout-link"
                            role="menuitem"
                          >
                            {s.name}
                          </Link>
                        ))}
                      </div>
                    ) : null}
                  </div>
                ))}
              </div>
            </div>
          ) : null}
          <NavLink to="/sobre" className="nav-link">
            {t('navAbout')}
          </NavLink>
          <NavLink to="/contato" className="nav-link">
            {t('navContact')}
          </NavLink>
        </nav>
        <div className="header-locale">
          <LocaleSelector />
          <ThemeToggle />
        </div>
        <button
          type="button"
          className="header-menu-btn"
          aria-label={t('openMenu')}
          aria-expanded={drawerOpen}
          onClick={() => setDrawerOpen(true)}
        >
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" aria-hidden>
            <line x1="3" y1="6" x2="21" y2="6" />
            <line x1="3" y1="12" x2="21" y2="12" />
            <line x1="3" y1="18" x2="21" y2="18" />
          </svg>
        </button>
      </header>

      {drawerOpen && (
        <>
          <div
            className="drawer-backdrop"
            aria-hidden
            onClick={() => setDrawerOpen(false)}
          />
          <aside className="drawer" role="dialog" aria-label="Menu de navegação">
            <button
              type="button"
              className="drawer-close"
              aria-label={t('closeMenu')}
              onClick={() => setDrawerOpen(false)}
            >
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" aria-hidden>
                <line x1="18" y1="6" x2="6" y2="18" />
                <line x1="6" y1="6" x2="18" y2="18" />
              </svg>
            </button>
            <nav className="drawer-nav">
              <div className="drawer-gallery-block">
                <NavLink to="/" className="drawer-link" onClick={() => setDrawerOpen(false)}>
                  {t('navHome')}
                </NavLink>
                <div className="drawer-submenu">
                  {GALLERY_TYPES.map((type) => (
                    <Link
                      key={type}
                      to={type === 'movies' ? '/movies' : `/?gallery=${encodeURIComponent(type)}`}
                      className="drawer-submenu-link"
                      onClick={() => setDrawerOpen(false)}
                    >
                      {t(typeKeys[type])}
                    </Link>
                  ))}
                </div>
              </div>
              {cmsCategories.length > 0 ? (
                <div className="drawer-gallery-block">
                  <p className="drawer-subsection-title">{t('navCategories')}</p>
                  <div className="drawer-submenu">
                    {cmsCategories.map((c) => (
                      <div key={c.id} className="drawer-submenu-group">
                        <Link
                          to={`/?category=${encodeURIComponent(c.slug)}`}
                          className="drawer-submenu-link drawer-submenu-link--parent"
                          onClick={() => setDrawerOpen(false)}
                        >
                          {c.name}
                        </Link>
                        {c.subcategories.map((s) => (
                          <Link
                            key={s.id}
                            to={`/?category=${encodeURIComponent(c.slug)}&sub=${encodeURIComponent(s.slug)}`}
                            className="drawer-submenu-link drawer-submenu-link--sub"
                            onClick={() => setDrawerOpen(false)}
                          >
                            {s.name}
                          </Link>
                        ))}
                      </div>
                    ))}
                  </div>
                </div>
              ) : null}
              <NavLink to="/sobre" className="drawer-link" onClick={() => setDrawerOpen(false)}>
                {t('navAbout')}
              </NavLink>
              <NavLink to="/contato" className="drawer-link" onClick={() => setDrawerOpen(false)}>
                {t('navContact')}
              </NavLink>
            </nav>
            <div className="drawer-locale">
              <LocaleSelector />
              <ThemeToggle />
            </div>
          </aside>
        </>
      )}

      <main className="main">
        <Outlet />
      </main>
    </div>
  )
}

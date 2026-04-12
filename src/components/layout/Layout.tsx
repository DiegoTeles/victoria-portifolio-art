import { useEffect, useState } from 'react'
import { Outlet, Link, NavLink, useLocation } from 'react-router-dom'
import { useLocale } from '../../i18n/LocaleContext'
import { LocaleSelector } from '../LocaleSelector'
import { ThemeToggle } from '../ThemeToggle'

const GALLERY_TYPES = ['drawing-painting', 'photography', 'digital-art', 'movies'] as const

export function Layout() {
  const { locale, t } = useLocale()
  const [drawerOpen, setDrawerOpen] = useState(false)
  const [maintenanceOpen, setMaintenanceOpen] = useState(true)
  const [maintenanceBannerVisible, setMaintenanceBannerVisible] = useState(true)
  const location = useLocation()

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
      {maintenanceOpen && (
        <div
          className="maintenance-modal-backdrop"
          onClick={() => setMaintenanceOpen(false)}
          role="presentation"
        >
          <div
            className="maintenance-modal"
            role="alertdialog"
            aria-modal="true"
            aria-labelledby="maintenance-modal-title"
            aria-describedby="maintenance-modal-desc"
            onClick={(e) => e.stopPropagation()}
          >
            <h2 id="maintenance-modal-title" className="maintenance-modal-title">
              {t('maintenanceModalTitle')}
            </h2>
            <p id="maintenance-modal-desc" className="maintenance-modal-message">
              {t('maintenanceModalMessage')}
            </p>
            <button
              type="button"
              className="maintenance-modal-ok"
              onClick={() => setMaintenanceOpen(false)}
            >
              {t('maintenanceModalOk')}
            </button>
          </div>
        </div>
      )}
      {maintenanceBannerVisible && (
        <div className="maintenance-message-bar">
          <div className="maintenance-message" role="status" aria-live="polite">
            <div className="maintenance-message-track">
              {[...Array(10)].map((_, index) => (
                <div key={index}>{" "}<span>{` ${t('maintenanceBanner')} · `}</span></div>
              ))}
            </div>
          </div>
          <button
            type="button"
            className="maintenance-message-close"
            aria-label={t('close')}
            onClick={() => setMaintenanceBannerVisible(false)}
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" aria-hidden>
              <line x1="18" y1="6" x2="6" y2="18" />
              <line x1="6" y1="6" x2="18" y2="18" />
            </svg>
          </button>
        </div>
      )}
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

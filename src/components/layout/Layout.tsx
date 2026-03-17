import { useEffect, useState } from 'react'
import { Outlet, Link, NavLink, useLocation } from 'react-router-dom'
import { useLocale } from '../../i18n/LocaleContext'
import { LocaleSelector } from '../LocaleSelector'
import { ThemeToggle } from '../ThemeToggle'

const GALLERY_TYPES = ['drawing', 'painting', 'photography', 'digital-art', 'movies'] as const

export function Layout() {
  const { locale, t } = useLocale()
  const [drawerOpen, setDrawerOpen] = useState(false)
  const location = useLocation()

  useEffect(() => {
    document.title = t('siteTitle')
    document.documentElement.lang = locale === 'en' ? 'en' : 'pt-BR'
    const meta = document.querySelector('meta[name="description"]')
    if (meta) meta.setAttribute('content', t('siteDescription'))
  }, [locale, t])

  useEffect(() => {
    setDrawerOpen(false)
  }, [location.pathname])

  const typeKeys = {
    'drawing': 'typeDrawing',
    'painting': 'typePainting',
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
                  to={{ pathname: '/', hash: type }}
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
                      to={{ pathname: '/', hash: type }}
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

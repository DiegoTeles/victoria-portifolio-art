import { useRef, useEffect, useState } from 'react'
import { CountryFlag } from 'react-country-flags-lazyload'
import type { Locale } from '../data/artworks'
import { useLocale } from '../i18n/LocaleContext'

const LOCALES: { value: Locale; label: string; countryCode: 'BR' | 'US' | 'FR' | 'IT' | 'DE' }[] = [
  { value: 'pt-Br', label: 'Português', countryCode: 'BR' },
  { value: 'en', label: 'English', countryCode: 'US' },
  { value: 'fr', label: 'Français', countryCode: 'FR' },
  { value: 'it', label: 'Italiano', countryCode: 'IT' },
  { value: 'de', label: 'Deutsch', countryCode: 'DE' },
]

export function LocaleSelector() {
  const { locale, setLocale } = useLocale()
  const [open, setOpen] = useState(false)
  const containerRef = useRef<HTMLDivElement>(null)
  const current = LOCALES.find((l) => l.value === locale) ?? LOCALES[0]

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setOpen(false)
      }
    }
    document.addEventListener('click', handler)
    return () => document.removeEventListener('click', handler)
  }, [])

  return (
    <nav className="locale-selector" aria-label="Idioma / Language" ref={containerRef}>
      <div className="locale-select-wrapper">
        <button
          type="button"
          className="locale-select"
          onClick={() => setOpen((v) => !v)}
          aria-haspopup="listbox"
          aria-expanded={open}
          aria-label="Idioma / Language"
        >
          <span className="locale-flag">
            <CountryFlag countryCode={current.countryCode} />
          </span>
          <span className="locale-label">{current.label}</span>
        </button>
        {open && (
          <ul className="locale-dropdown" role="listbox">
            {LOCALES.map((opt) => (
              <li
                key={opt.value}
                role="option"
                aria-selected={locale === opt.value}
                className="locale-option"
              >
                <button
                  type="button"
                  onClick={() => {
                    setLocale(opt.value)
                    setOpen(false)
                  }}
                >
                  <span className="locale-flag">
                    <CountryFlag countryCode={opt.countryCode} />
                  </span>
                  <span>{opt.label}</span>
                </button>
              </li>
            ))}
          </ul>
        )}
      </div>
    </nav>
  )
}

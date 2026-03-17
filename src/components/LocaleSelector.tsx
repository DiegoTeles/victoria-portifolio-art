import { useLocale } from '../i18n/LocaleContext'

const LOCALES = [
  { value: 'pt-Br', label: 'PT' },
  { value: 'en', label: 'EN' },
] as const

export function LocaleSelector() {
  const { locale, setLocale } = useLocale()
  return (
    <nav className="locale-selector" aria-label="Idioma / Language">
      <select
        value={locale}
        onChange={(e) => setLocale(e.target.value as 'pt-Br' | 'en')}
        className="locale-select"
        aria-label="Idioma / Language"
      >
        {LOCALES.map(({ value, label }) => (
          <option key={value} value={value}>
            {label}
          </option>
        ))}
      </select>
    </nav>
  )
}

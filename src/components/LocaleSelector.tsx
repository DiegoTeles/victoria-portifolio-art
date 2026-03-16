import { useLocale } from '../i18n/LocaleContext'

export function LocaleSelector() {
  const { locale, setLocale } = useLocale()
  return (
    <nav className="locale-selector" aria-label="Idioma / Language">
      <button
        type="button"
        className={locale === 'pt-Br' ? 'active' : undefined}
        onClick={() => setLocale('pt-Br')}
        aria-pressed={locale === 'pt-Br'}
      >
        PT
      </button>
      <button
        type="button"
        className={locale === 'en' ? 'active' : undefined}
        onClick={() => setLocale('en')}
        aria-pressed={locale === 'en'}
      >
        EN
      </button>
    </nav>
  )
}

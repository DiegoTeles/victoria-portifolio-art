import { CountryFlag } from 'react-country-flags-lazyload'
import { cn } from '@/lib/utils'
import type { Locale } from '@/data/artworks'

export const ADMIN_LOCALE_OPTIONS: {
  locale: Locale
  label: string
  countryCode: 'BR' | 'US' | 'FR' | 'IT' | 'DE'
}[] = [
  { locale: 'pt-Br', label: 'Português', countryCode: 'BR' },
  { locale: 'en', label: 'English', countryCode: 'US' },
  { locale: 'fr', label: 'Français', countryCode: 'FR' },
  { locale: 'it', label: 'Italiano', countryCode: 'IT' },
  { locale: 'de', label: 'Deutsch', countryCode: 'DE' },
]

type AdminLocaleTabsProps = {
  value: Locale
  onChange: (locale: Locale) => void
  idPrefix: string
  showHint?: boolean
}

export function AdminLocaleTabs({
  value,
  onChange,
  idPrefix,
  showHint = true,
}: AdminLocaleTabsProps) {
  const panelId = `${idPrefix}-panel`

  return (
    <div className="admin-locale-tabs flex flex-col gap-px">
      {showHint ? (
        <p className="text-muted-foreground mb-1 text-xs">
          Escolha o idioma para editar. Cada aba guarda o texto desse idioma.
        </p>
      ) : null}
      <div
        className="flex flex-wrap gap-3 border-b border-border pb-3"
        role="tablist"
        aria-label="Idioma do conteúdo"
      >
        {ADMIN_LOCALE_OPTIONS.map((opt) => {
          const selected = value === opt.locale
          const tabId = `${idPrefix}-tab-${opt.locale}`
          return (
            <button
              key={opt.locale}
              id={tabId}
              type="button"
              role="tab"
              aria-selected={selected}
              aria-controls={panelId}
              tabIndex={selected ? 0 : -1}
              onClick={() => onChange(opt.locale)}
              aria-label={opt.label}
              className={cn(
                'inline-flex cursor-pointer items-center justify-center rounded-md border px-3 py-2 text-sm font-medium transition-colors',
                'focus-visible:ring-ring focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:outline-none',
                selected
                  ? 'border-foreground bg-muted text-foreground shadow-sm'
                  : 'border-border bg-card text-muted-foreground hover:bg-muted/60 hover:text-foreground'
              )}
            >
              <span className="locale-flag shrink-0" aria-hidden>
                <CountryFlag countryCode={opt.countryCode} />
              </span>
            </button>
          )
        })}
      </div>
    </div>
  )
}

export const ADMIN_LOCALES: Locale[] = ADMIN_LOCALE_OPTIONS.map((o) => o.locale)

export function getAdminLocalePanelProps(idPrefix: string, activeLocale: Locale) {
  return {
    id: `${idPrefix}-panel`,
    role: 'tabpanel' as const,
    'aria-labelledby': `${idPrefix}-tab-${activeLocale}`,
  }
}

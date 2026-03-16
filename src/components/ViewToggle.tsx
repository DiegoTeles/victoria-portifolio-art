import { useLocale } from '../i18n/LocaleContext'

export type ViewMode = 'list' | 'grid'

type Props = {
  viewMode: ViewMode
  onViewModeChange: (mode: ViewMode) => void
}

export function ViewToggle({ viewMode, onViewModeChange }: Props) {
  const { t } = useLocale()
  return (
    <nav className="view-toggle" aria-label="Formato da galeria">
      <button
        type="button"
        className={`view-toggle-btn ${viewMode === 'list' ? 'active' : ''}`}
        onClick={() => onViewModeChange('list')}
        aria-pressed={viewMode === 'list'}
        aria-label={t('viewList')}
        title={t('viewList')}
      >
        <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" aria-hidden>
          <line x1="8" y1="6" x2="21" y2="6" />
          <line x1="8" y1="12" x2="21" y2="12" />
          <line x1="8" y1="18" x2="21" y2="18" />
          <line x1="3" y1="6" x2="3.01" y2="6" />
          <line x1="3" y1="12" x2="3.01" y2="12" />
          <line x1="3" y1="18" x2="3.01" y2="18" />
        </svg>
      </button>
      <button
        type="button"
        className={`view-toggle-btn ${viewMode === 'grid' ? 'active' : ''}`}
        onClick={() => onViewModeChange('grid')}
        aria-pressed={viewMode === 'grid'}
        aria-label={t('viewGrid')}
        title={t('viewGrid')}
      >
        <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" aria-hidden>
          <rect x="3" y="3" width="5" height="5" />
          <rect x="10" y="3" width="5" height="5" />
          <rect x="17" y="3" width="5" height="5" />
          <rect x="3" y="10" width="5" height="5" />
          <rect x="10" y="10" width="5" height="5" />
          <rect x="17" y="10" width="5" height="5" />
          <rect x="3" y="17" width="5" height="5" />
          <rect x="10" y="17" width="5" height="5" />
          <rect x="17" y="17" width="5" height="5" />
        </svg>
      </button>
    </nav>
  )
}

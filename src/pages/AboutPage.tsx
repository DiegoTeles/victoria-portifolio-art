import { useLocale } from '../i18n/LocaleContext'

const PORTRAIT_IMAGE = 'https://picsum.photos/seed/about-portrait/400/600'

export function AboutPage() {
  const { t } = useLocale()
  return (
    <section className="page-content about-page">
      <h1 className="page-title">{t('navAbout')}</h1>
      <div className="about-layout">
        <div className="about-photo-block">
          <img
            src={PORTRAIT_IMAGE}
            alt=""
            className="about-portrait"
            width={400}
            height={600}
          />
          <div className="about-social" aria-label="Redes sociais">
            <a href="#" className="about-social-link" aria-label="Instagram">
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
                <rect x="2" y="2" width="20" height="20" rx="5" ry="5" />
                <path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z" />
                <line x1="17.5" y1="6.5" x2="17.51" y2="6.5" />
              </svg>
            </a>
            <a href="#" className="about-social-link" aria-label="Twitter">
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
                <path d="M4 4l11.733 16h4.267l-11.733 -16z" />
                <path d="M4 20l6.768 -6.768m2.46 -2.46l6.772 -6.772" />
              </svg>
            </a>
            <a href="#" className="about-social-link" aria-label="LinkedIn">
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
                <path d="M16 8a6 6 0 0 1 6 6v7h-4v-7a2 2 0 0 0-2-2 2 2 0 0 0-2 2v7h-4v-7a6 6 0 0 1 6-6z" />
                <rect x="2" y="9" width="4" height="12" />
                <circle cx="4" cy="4" r="2" />
              </svg>
            </a>
          </div>
        </div>
        <div className="about-bio">
          <p className="page-text">{t('aboutBio')}</p>
        </div>
      </div>
    </section>
  )
}

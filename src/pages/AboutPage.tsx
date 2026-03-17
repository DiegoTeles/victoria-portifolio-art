import { useState } from 'react'
import { useLocale } from '../i18n/LocaleContext'

const PORTRAIT_IMAGE = '/images/profile.webp'

type AboutTab = 'about' | 'curriculum'

export function AboutPage() {
  const { t } = useLocale()
  const [tab, setTab] = useState<AboutTab>('about')
  return (
    <section className="page-content about-page">
      <h1 className="page-title">{t('navAbout')}</h1>
      <div className="about-tabs" role="tablist" aria-label={t('navAbout')}>
        <button
          type="button"
          role="tab"
          aria-selected={tab === 'about'}
          className={`about-tab ${tab === 'about' ? 'about-tab--active' : ''}`}
          onClick={() => setTab('about')}
        >
          {t('aboutTabAbout')}
        </button>
        <button
          type="button"
          role="tab"
          aria-selected={tab === 'curriculum'}
          className={`about-tab ${tab === 'curriculum' ? 'about-tab--active' : ''}`}
          onClick={() => setTab('curriculum')}
        >
          {t('aboutTabCurriculum')}
        </button>
      </div>
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
            <a href="https://www.instagram.com/corvitia/" target="_blank" rel="noopener noreferrer" className="about-social-link" aria-label="Instagram">
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
                <rect x="2" y="2" width="20" height="20" rx="5" ry="5" />
                <path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z" />
                <line x1="17.5" y1="6.5" x2="17.51" y2="6.5" />
              </svg>
            </a>
          </div>
        </div>
        <div className="about-bio" role="tabpanel">
          {tab === 'about' && (
            <>
              <p className="page-text">{t('aboutBio1')}</p>
              <p className="page-text">{t('aboutBio2')}</p>
              <p className="page-text">{t('aboutBio3')}</p>
            </>
          )}
          {tab === 'curriculum' && (
            <div className="about-curriculum">
              <p className="about-curriculum-contact">{t('curriculumContact')}</p>
              <section className="about-curriculum-section">
                <h2 className="about-curriculum-title">{t('curriculumSectionObjective')}</h2>
                <p className="page-text">{t('curriculumObjective')}</p>
              </section>
              <section className="about-curriculum-section">
                <h2 className="about-curriculum-title">{t('curriculumSectionFormation')}</h2>
                <p className="page-text">{t('curriculumFormation')}</p>
              </section>
              <section className="about-curriculum-section">
                <h2 className="about-curriculum-title">{t('curriculumSectionExperience')}</h2>
                <ul className="about-curriculum-list">
                  {t('curriculumExperience').split('\n').filter(Boolean).map((item, i) => (
                    <li key={i}>{item}</li>
                  ))}
                </ul>
              </section>
              <section className="about-curriculum-section">
                <h2 className="about-curriculum-title">{t('curriculumSectionSkills')}</h2>
                <ul className="about-curriculum-list">
                  {t('curriculumSkills').split('\n').filter(Boolean).map((item, i) => (
                    <li key={i}>{item}</li>
                  ))}
                </ul>
              </section>
              <section className="about-curriculum-section">
                <h2 className="about-curriculum-title">{t('curriculumSectionIT')}</h2>
                <ul className="about-curriculum-list">
                  {t('curriculumIT').split('\n').filter(Boolean).map((item, i) => (
                    <li key={i}>{item}</li>
                  ))}
                </ul>
              </section>
              <section className="about-curriculum-section">
                <h2 className="about-curriculum-title">{t('curriculumSectionLanguages')}</h2>
                <ul className="about-curriculum-list">
                  {t('curriculumLanguages').split('\n').filter(Boolean).map((item, i) => (
                    <li key={i}>{item}</li>
                  ))}
                </ul>
              </section>
              <section className="about-curriculum-section">
                <h2 className="about-curriculum-title">{t('curriculumSectionAdditional')}</h2>
                <p className="page-text">{t('curriculumAdditional')}</p>
              </section>
            </div>
          )}
        </div>
      </div>
    </section>
  )
}

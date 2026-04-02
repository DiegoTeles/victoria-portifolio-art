import { useEffect, useState } from 'react'
import { useLocale } from '../i18n/LocaleContext'
import { TccPdfPanel } from '../components/TccPdfPanel'
import { ArtworkLazyImage } from '../components/ArtworkLazyImage'
import { Skeleton } from '@/components/ui/skeleton'

const PORTRAIT_IMAGE = '/images/profile.webp'

type AboutTab = 'about' | 'curriculum' | 'tcc'

type SocialItem = { id: string; network: string; url: string; label: string | null }

function CmsRichOrPlain({ html }: { html: string }) {
  const t = html.trim()
  if (t.startsWith('<')) {
    return (
      <div className="about-cms-html page-text" dangerouslySetInnerHTML={{ __html: html }} />
    )
  }
  return <div className="page-text whitespace-pre-wrap">{html}</div>
}

export function AboutPage() {
  const { t, locale } = useLocale()
  const [tab, setTab] = useState<AboutTab>('about')
  const [cmsBio, setCmsBio] = useState<string | null>(null)
  const [cmsBioReady, setCmsBioReady] = useState(false)
  const [cmsCv, setCmsCv] = useState<string | null>(null)
  const [cmsCvReady, setCmsCvReady] = useState(false)
  const [socialLinks, setSocialLinks] = useState<SocialItem[] | null>(null)

  useEffect(() => {
    let cancelled = false
    setCmsBioReady(false)
    void fetch(`/api/about/bio?locale=${encodeURIComponent(locale)}`, { cache: 'no-store' })
      .then((r) => (r.ok ? r.json() : null))
      .then((d: { content?: string; isPublished?: boolean } | null) => {
        if (cancelled) return
        if (!d) {
          setCmsBio(null)
          setCmsBioReady(true)
          return
        }
        if (d.isPublished && (d.content ?? '').trim()) setCmsBio(d.content ?? '')
        else setCmsBio(null)
        setCmsBioReady(true)
      })
      .catch(() => {
        if (!cancelled) {
          setCmsBio(null)
          setCmsBioReady(true)
        }
      })
    return () => {
      cancelled = true
    }
  }, [locale])

  useEffect(() => {
    let cancelled = false
    setCmsCvReady(false)
    void fetch(`/api/about/curriculum?locale=${encodeURIComponent(locale)}`, { cache: 'no-store' })
      .then((r) => (r.ok ? r.json() : null))
      .then((d: { content?: string; isPublished?: boolean } | null) => {
        if (cancelled) return
        if (!d) {
          setCmsCv(null)
          setCmsCvReady(true)
          return
        }
        if (d.isPublished && (d.content ?? '').trim()) setCmsCv(d.content ?? '')
        else setCmsCv(null)
        setCmsCvReady(true)
      })
      .catch(() => {
        if (!cancelled) {
          setCmsCv(null)
          setCmsCvReady(true)
        }
      })
    return () => {
      cancelled = true
    }
  }, [locale])

  useEffect(() => {
    let cancelled = false
    void fetch('/api/social-links', { cache: 'no-store' })
      .then((r) => (r.ok ? r.json() : []))
      .then((data: unknown) => {
        if (cancelled) return
        if (Array.isArray(data) && data.length > 0) {
          setSocialLinks(
            data.map((x: { id: string; network: string; url: string; label?: string | null }) => ({
              id: String(x.id),
              network: x.network,
              url: x.url,
              label: x.label ?? null,
            }))
          )
        } else setSocialLinks(null)
      })
      .catch(() => {
        if (!cancelled) setSocialLinks(null)
      })
    return () => {
      cancelled = true
    }
  }, [])

  return (
    <section
      className={`page-content about-page${tab === 'tcc' ? ' about-page--tcc' : ''}`}
    >
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
        <button
          type="button"
          role="tab"
          aria-selected={tab === 'tcc'}
          className={`about-tab ${tab === 'tcc' ? 'about-tab--active' : ''}`}
          onClick={() => setTab('tcc')}
        >
          {t('aboutTabTcc')}
        </button>
      </div>
      <div className="about-layout">
        {tab !== 'tcc' && (
          <>
            <div className="about-photo-block">
              <span className="relative block w-full">
                <ArtworkLazyImage
                  src={PORTRAIT_IMAGE}
                  alt=""
                  className="about-portrait"
                  width={400}
                  height={600}
                  skeletonClassName="pointer-events-none absolute inset-0 z-[1] size-full rounded-sm"
                />
              </span>
              <div className="about-social" aria-label="Redes sociais">
                {socialLinks && socialLinks.length > 0 ? (
                  socialLinks.map((s) => (
                    <a
                      key={s.id}
                      href={s.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="about-social-link"
                    >
                      {s.label || s.network}
                    </a>
                  ))
                ) : (
                  <a
                    href="https://www.instagram.com/corvitia/"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="about-social-link"
                    aria-label="Instagram"
                  >
                    <svg
                      width="24"
                      height="24"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="1.5"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      aria-hidden
                    >
                      <rect x="2" y="2" width="20" height="20" rx="5" ry="5" />
                      <path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z" />
                      <line x1="17.5" y1="6.5" x2="17.51" y2="6.5" />
                    </svg>
                  </a>
                )}
              </div>
            </div>
          </>
        )}
        <div className="about-bio" role="tabpanel">
          {tab === 'about' && (
            <>
              {!cmsBioReady ? (
                <div className="flex flex-col gap-3" aria-busy="true">
                  <Skeleton className="h-4 w-full" />
                  <Skeleton className="h-4 w-full" />
                  <Skeleton className="h-4 w-[92%]" />
                  <Skeleton className="h-4 w-full" />
                  <Skeleton className="h-4 w-4/5" />
                </div>
              ) : cmsBio !== null ? (
                <CmsRichOrPlain html={cmsBio} />
              ) : (
                <>
                  <p className="page-text">{t('aboutBio1')}</p>
                  <p className="page-text">{t('aboutBio2')}</p>
                  <p className="page-text">{t('aboutBio3')}</p>
                  <blockquote className="about-bio-quote">{t('aboutBio4')}</blockquote>
                  <p className="page-text">{t('aboutBio5')}</p>
                </>
              )}
            </>
          )}
          {tab === 'tcc' && (
            <div className="about-tcc-wrap">
              <TccPdfPanel />
            </div>
          )}
          {tab === 'curriculum' && (
            <>
              {!cmsCvReady ? (
                <div className="about-curriculum flex flex-col gap-3" aria-busy="true">
                  <Skeleton className="h-5 w-48" />
                  <Skeleton className="h-4 w-full" />
                  <Skeleton className="h-4 w-full" />
                  <Skeleton className="h-4 w-3/4" />
                  <Skeleton className="mt-4 h-5 w-56" />
                  <Skeleton className="h-4 w-full" />
                  <Skeleton className="h-4 w-[88%]" />
                </div>
              ) : cmsCv !== null ? (
                <div className="about-curriculum">
                  <CmsRichOrPlain html={cmsCv} />
                </div>
              ) : (
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
                      {t('curriculumExperience')
                        .split('\n')
                        .filter(Boolean)
                        .map((item, i) => (
                          <li key={i}>{item}</li>
                        ))}
                    </ul>
                  </section>
                  <figure className="about-curriculum-figure">
                    <span className="relative block w-full max-w-full">
                      <ArtworkLazyImage
                        src="/images/drawing/drawing-01.png"
                        alt=""
                        className="about-curriculum-image"
                        width={400}
                        height={533}
                        skeletonClassName="pointer-events-none absolute inset-0 z-[1] size-full max-h-[min(70vh,560px)] rounded-sm"
                      />
                    </span>
                    <figcaption className="about-curriculum-caption">{t('curriculumBookCaption')}</figcaption>
                  </figure>
                  <section className="about-curriculum-section">
                    <h2 className="about-curriculum-title">{t('curriculumSectionSkills')}</h2>
                    <ul className="about-curriculum-list">
                      {t('curriculumSkills')
                        .split('\n')
                        .filter(Boolean)
                        .map((item, i) => (
                          <li key={i}>{item}</li>
                        ))}
                    </ul>
                  </section>
                  <section className="about-curriculum-section">
                    <h2 className="about-curriculum-title">{t('curriculumSectionIT')}</h2>
                    <ul className="about-curriculum-list">
                      {t('curriculumIT')
                        .split('\n')
                        .filter(Boolean)
                        .map((item, i) => (
                          <li key={i}>{item}</li>
                        ))}
                    </ul>
                  </section>
                  <section className="about-curriculum-section">
                    <h2 className="about-curriculum-title">{t('curriculumSectionLanguages')}</h2>
                    <ul className="about-curriculum-list">
                      {t('curriculumLanguages')
                        .split('\n')
                        .filter(Boolean)
                        .map((item, i) => (
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
            </>
          )}
        </div>
      </div>
    </section>
  )
}

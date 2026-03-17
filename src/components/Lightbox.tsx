import { useEffect, useRef, useCallback, useState } from 'react'
import ImageZoom from 'react-image-zooom'
import type { Artwork } from '../data/artworks'
import type { Locale } from '../data/artworks'
import { getLocalized } from '../data/artworks'
import { useLocale } from '../i18n/LocaleContext'
import { formatArtworkTypes } from '../i18n/formatArtworkTypes'
import { formatCaptionText, plainCaptionText } from '../utils/formatCaptionText'
import { captureVideoPoster } from '../utils/videoPoster'
import { ArtworkInfoIcon } from './ArtworkInfoIcon'

type Props = {
  artworks: Artwork[]
  initialIndex: number
  locale: Locale
  onClose: () => void
}

export function Lightbox({
  artworks,
  initialIndex,
  locale,
  onClose,
}: Props) {
  const { t } = useLocale()
  const [index, setIndex] = useState(initialIndex)
  const containerRef = useRef<HTMLDivElement>(null)

  const current = artworks[index]
  const hasPrev = index > 0
  const hasNext = index < artworks.length - 1

  const goPrev = useCallback(() => {
    if (hasPrev) setIndex((i) => i - 1)
  }, [hasPrev])
  const goNext = useCallback(() => {
    if (hasNext) setIndex((i) => i + 1)
  }, [hasNext])

  useEffect(() => {
    const prev = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    return () => {
      document.body.style.overflow = prev
    }
  }, [])

  useEffect(() => {
    const el = containerRef.current
    if (!el) return
    const bound = (e: globalThis.KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
      if (e.key === 'ArrowLeft') goPrev()
      if (e.key === 'ArrowRight') goNext()
    }
    el.addEventListener('keydown', bound)
    el.focus()
    return () => el.removeEventListener('keydown', bound)
  }, [onClose, goPrev, goNext])

  useEffect(() => {
    const focusables = containerRef.current?.querySelectorAll(
      'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
    )
    const first = focusables?.[0] as HTMLElement | undefined
    const previouslyFocused = document.activeElement as HTMLElement | null

    first?.focus()

    return () => {
      previouslyFocused?.focus()
    }
  }, [index])

  if (!current) return null

  const title = getLocalized(current.title, locale)
  const description = getLocalized(current.description, locale)
  const typeLabel = formatArtworkTypes(current.types, t)
  const alt = [typeLabel, plainCaptionText(title || ''), plainCaptionText(description || '')].filter(Boolean).join(' — ') || current.id

  return (
    <div
      ref={containerRef}
      className="lightbox-backdrop"
      role="dialog"
      aria-modal="true"
      aria-label={alt}
      tabIndex={-1}
      onClick={(e) => e.target === e.currentTarget && onClose()}
    >
      <div className="lightbox-content" onClick={(e) => e.stopPropagation()}>
        <div className="lightbox-media-wrap">
          {current.video ? (
            <video
              ref={(el) => {
                if (el && !current.image) el.addEventListener('loadeddata', () => captureVideoPoster(el), { once: true })
              }}
              src={current.video}
              poster={current.image ?? undefined}
              controls
              preload="auto"
              style={{ maxWidth: '100%', maxHeight: '85vh' }}
            />
          ) : (
            <ImageZoom
              src={current.image!}
              alt={alt}
              zoom={250}
              theme={{ root: 'lightbox-zoom-root', image: 'lightbox-zoom-image' }}
            />
          )}
          <ArtworkInfoIcon info={getLocalized(current.info, locale) || null} />
        </div>
        {(typeLabel || title || description) && (
          <p className="lightbox-caption">
            {description && formatCaptionText(description)}
          </p>
        )}
      </div>
      <div className="lightbox-actions" onClick={(e) => e.stopPropagation()}>
        <button
          type="button"
          className="lightbox-btn lightbox-prev"
          onClick={goPrev}
          disabled={!hasPrev}
          aria-label={t('previous')}
        >
          {t('previous')}
        </button>
        <button
          type="button"
          className="lightbox-btn lightbox-close"
          onClick={onClose}
          aria-label={t('close')}
        >
          {t('close')}
        </button>
        <button
          type="button"
          className="lightbox-btn lightbox-next"
          onClick={goNext}
          disabled={!hasNext}
          aria-label={t('next')}
        >
          {t('next')}
        </button>
      </div>
    </div>
  )
}

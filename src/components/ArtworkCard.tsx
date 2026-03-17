import { useRef, useCallback } from 'react'
import type { Artwork } from '../data/artworks'
import type { Locale } from '../data/artworks'
import { getLocalized } from '../data/artworks'
import { formatCaptionText, plainCaptionText } from '../utils/formatCaptionText'
import { captureVideoPoster } from '../utils/videoPoster'
import { ArtworkInfoIcon } from './ArtworkInfoIcon'

type Props = {
  artwork: Artwork
  locale: Locale
  onSelect: () => void
}

export function ArtworkCard({ artwork, locale, onSelect }: Props) {
  const title = getLocalized(artwork.title, locale)
  const description = getLocalized(artwork.description, locale)
  const alt = plainCaptionText(title || description || '')
  const videoRef = useRef<HTMLVideoElement>(null)
  const needPoster = Boolean(artwork.video && !artwork.image)
  const onVideoLoadedData = useCallback(() => {
    const el = videoRef.current
    if (el && needPoster) captureVideoPoster(el)
  }, [needPoster])

  return (
    <figure
      className={`artwork-card ${artwork.orientation}`}
      style={{ margin: 0 }}
    >
      <button
        type="button"
        onClick={onSelect}
        style={{
          padding: 0,
          border: 'none',
          background: 'none',
          cursor: 'pointer',
          textAlign: 'left',
          width: '100%',
        }}
        aria-label={alt}
      >
        <span className="artwork-image-wrap">
          <span className="artwork-image-inner">
            {artwork.video ? (
              <video
                ref={videoRef}
                src={artwork.video}
                poster={artwork.image ?? undefined}
                muted
                loop
                playsInline
                preload="auto"
                onLoadedData={onVideoLoadedData}
                width={800}
                height={600}
              />
            ) : (
              <img
                src={artwork.image}
                alt={alt}
                loading="lazy"
                width={800}
                height={600}
              />
            )}
            <ArtworkInfoIcon info={getLocalized(artwork.info, locale) || null} />
          </span>
        </span>
      </button>
      <figcaption>
        {description && <span className="artwork-description">{formatCaptionText(description)}</span>}
      </figcaption>
    </figure>
  )
}

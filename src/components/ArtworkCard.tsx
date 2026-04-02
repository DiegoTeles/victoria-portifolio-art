import { useRef, useCallback, useEffect, useState } from 'react'
import type { Artwork } from '../data/artworks'
import type { Locale } from '../data/artworks'
import { getLocalized } from '../data/artworks'
import { getArtworkImageSrc, getArtworkVideoSrc } from '@/lib/artworkImageUrl'
import { formatCaptionText, plainCaptionText } from '../utils/formatCaptionText'
import { captureVideoPoster } from '../utils/videoPoster'
import { ArtworkInfoIcon } from './ArtworkInfoIcon'
import { ArtworkLazyImage } from './ArtworkLazyImage'
import { Skeleton } from '@/components/ui/skeleton'

type Props = {
  artwork: Artwork
  locale: Locale
  onSelect: () => void
}

export function ArtworkCard({ artwork, locale, onSelect }: Props) {
  const title = artwork.title
  const description = getLocalized(artwork.description, locale)
  const alt = plainCaptionText(title || description || '')
  const videoRef = useRef<HTMLVideoElement>(null)
  const needPoster = Boolean(artwork.video && !artwork.image)
  const [videoReady, setVideoReady] = useState(
    !artwork.video || Boolean(artwork.image)
  )
  useEffect(() => {
    setVideoReady(!artwork.video || Boolean(artwork.image))
  }, [artwork.video, artwork.image])
  const onVideoLoadedData = useCallback(() => {
    setVideoReady(true)
    const el = videoRef.current
    if (el && needPoster) captureVideoPoster(el)
  }, [needPoster])

  return (
    <figure
      className="artwork-card"
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
              <>
                {!artwork.image && !videoReady ? (
                  <Skeleton className="pointer-events-none absolute inset-0 z-[1] size-full min-h-[12rem] rounded-sm" />
                ) : null}
                <video
                  ref={videoRef}
                  src={getArtworkVideoSrc(artwork.video)}
                  poster={artwork.image ? getArtworkImageSrc(artwork) : undefined}
                  muted
                  loop
                  playsInline
                  preload="auto"
                  onLoadedData={onVideoLoadedData}
                  width={800}
                  height={600}
                />
              </>
            ) : (
              <ArtworkLazyImage
                src={getArtworkImageSrc(artwork)}
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

import type { Artwork } from '../data/artworks'
import type { Locale } from '../data/artworks'
import { formatCaptionText, plainCaptionText } from '../utils/formatCaptionText'
import { ArtworkInfoIcon } from './ArtworkInfoIcon'

type Props = {
  artwork: Artwork
  locale: Locale
  onSelect: () => void
}

export function ArtworkCard({ artwork, locale, onSelect }: Props) {
  const title = artwork.title[locale]
  const description = artwork.description[locale]
  const alt = plainCaptionText(title || description || '')

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
            <img
              src={artwork.image}
              alt={alt}
              loading="lazy"
              width={800}
              height={600}
            />
            <ArtworkInfoIcon info={artwork.info?.[locale] ?? null} />
          </span>
        </span>
      </button>
      <figcaption>
        {description && <span className="artwork-description">{formatCaptionText(description)}</span>}
      </figcaption>
    </figure>
  )
}

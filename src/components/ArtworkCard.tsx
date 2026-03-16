import type { Artwork } from '../data/artworks'
import type { Locale } from '../data/artworks'
import { useLocale } from '../i18n/LocaleContext'
import { formatArtworkTypes } from '../i18n/formatArtworkTypes'

type Props = {
  artwork: Artwork
  locale: Locale
  onSelect: () => void
}

export function ArtworkCard({ artwork, locale, onSelect }: Props) {
  const { t } = useLocale()
  const title = artwork.title[locale]
  const description = artwork.description[locale]
  const alt = title || description
  const typeLabel = formatArtworkTypes(artwork.types, t)

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
        <img
          src={artwork.image}
          alt={alt}
          loading="lazy"
          width={800}
          height={600}
        />
      </button>
      <figcaption>
        {typeLabel && <span className="artwork-types">{typeLabel}</span>}
        {typeLabel && (title || description) && ' · '}
        {title && <strong>{title}</strong>}
        {title && description && ' — '}
        {description}
      </figcaption>
    </figure>
  )
}

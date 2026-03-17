import type { Artwork } from '../data/artworks'
import type { Locale } from '../data/artworks'
import { getLocalized } from '../data/artworks'
import { useLocale } from '../i18n/LocaleContext'
import { formatArtworkTypes } from '../i18n/formatArtworkTypes'

type Props = {
  artworks: [Artwork, Artwork]
  locale: Locale
  onSelectFirst: () => void
  onSelectSecond: () => void
}

export function ArtworkPair({
  artworks,
  locale,
  onSelectFirst,
  onSelectSecond,
}: Props) {
  const { t } = useLocale()
  const [a, b] = artworks
  const typeA = formatArtworkTypes(a.types, t)
  const typeB = formatArtworkTypes(b.types, t)
  const aTitle = getLocalized(a.title, locale)
  const aDesc = getLocalized(a.description, locale)
  const bTitle = getLocalized(b.title, locale)
  const bDesc = getLocalized(b.description, locale)

  return (
    <figure className="artwork-pair" style={{ margin: 0 }}>
      <button
        type="button"
        onClick={onSelectFirst}
        style={{
          padding: 0,
          border: 'none',
          background: 'none',
          cursor: 'pointer',
          width: '100%',
        }}
        aria-label={aTitle || aDesc}
      >
        <img
          src={a.image}
          alt={aTitle || aDesc}
          loading="lazy"
          width={800}
          height={600}
        />
      </button>
      <button
        type="button"
        onClick={onSelectSecond}
        style={{
          padding: 0,
          border: 'none',
          background: 'none',
          cursor: 'pointer',
          width: '100%',
        }}
        aria-label={bTitle || bDesc}
      >
        <img
          src={b.image}
          alt={bTitle || bDesc}
          loading="lazy"
          width={800}
          height={600}
        />
      </button>
      <figcaption style={{ gridColumn: '1 / -1' }}>
        {typeA && <span className="artwork-types">{typeA}</span>}
        {typeA && (aTitle || aDesc) && ' · '}
        {aTitle && <strong>{aTitle}</strong>}
        {aTitle && aDesc && ' — '}
        {aDesc}
        {' · '}
        {typeB && <span className="artwork-types">{typeB}</span>}
        {typeB && (bTitle || bDesc) && ' · '}
        {bTitle && <strong>{bTitle}</strong>}
        {bTitle && bDesc && ' — '}
        {bDesc}
      </figcaption>
    </figure>
  )
}

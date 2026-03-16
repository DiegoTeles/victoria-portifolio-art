import type { Artwork } from '../data/artworks'
import type { Locale } from '../data/artworks'
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
        aria-label={a.title[locale] || a.description[locale]}
      >
        <img
          src={a.image}
          alt={a.title[locale] || a.description[locale]}
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
        aria-label={b.title[locale] || b.description[locale]}
      >
        <img
          src={b.image}
          alt={b.title[locale] || b.description[locale]}
          loading="lazy"
          width={800}
          height={600}
        />
      </button>
      <figcaption style={{ gridColumn: '1 / -1' }}>
        {typeA && <span className="artwork-types">{typeA}</span>}
        {typeA && (a.title[locale] || a.description[locale]) && ' · '}
        {a.title[locale] && <strong>{a.title[locale]}</strong>}
        {a.title[locale] && a.description[locale] && ' — '}
        {a.description[locale]}
        {' · '}
        {typeB && <span className="artwork-types">{typeB}</span>}
        {typeB && (b.title[locale] || b.description[locale]) && ' · '}
        {b.title[locale] && <strong>{b.title[locale]}</strong>}
        {b.title[locale] && b.description[locale] && ' — '}
        {b.description[locale]}
      </figcaption>
    </figure>
  )
}

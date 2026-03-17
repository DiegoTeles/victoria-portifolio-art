import type { Artwork, GroupDisplayType } from '../data/artworks'
import type { Locale } from '../data/artworks'
import { getLocalized } from '../data/artworks'
import { formatCaptionText } from '../utils/formatCaptionText'
import { ArtworkInfoIcon } from './ArtworkInfoIcon'

type Props = {
  artworks: Artwork[]
  locale: Locale
  groupDisplay?: GroupDisplayType
  onSelect: (index: number) => void
}

const CAPTION_CELL_INDEX = 3
const ASYMMETRIC_5_CAPTION_SLOT = 2

export function ArtworkGroup({ artworks, locale, groupDisplay, onSelect }: Props) {
  const count = Math.min(Math.max(artworks.length, 2), 6)
  const slice = artworks.slice(0, count)
  const descriptions = slice.map((a) => getLocalized(a.description, locale))
  const nonEmptyCount = descriptions.filter(Boolean).length
  const singleCaption = nonEmptyCount <= 1
  const sharedCaption = descriptions.find(Boolean) ?? ''
  const captionedIndex = slice.findIndex((a) => getLocalized(a.description, locale))
  const captionInGridAuto = singleCaption && !!sharedCaption && (count === 5 || count === 6)
  const useAsymmetric5 = groupDisplay === 'asymmetric-5' && count === 5
  const useCaptionInGrid =
    (groupDisplay === 'caption-in-grid' && (count === 5 || count === 6)) ||
    (!groupDisplay && captionInGridAuto)
  const useSingleCaption =
    groupDisplay === 'single-caption' || (!groupDisplay && singleCaption && !useCaptionInGrid)
  const usePerImageCaption =
    groupDisplay === 'per-image-caption' || (!groupDisplay && !singleCaption)

  if (useAsymmetric5) {
    const hasCaption = singleCaption && !!sharedCaption
    const imageIndices = hasCaption
      ? slice.map((_, i) => i).filter((i) => i !== captionedIndex)
      : [0, 1, 2, 3, 4]
    const slots: number[] = []
    let imgIdx = 0
    for (let s = 0; s < 5; s++) {
      if (hasCaption && s === ASYMMETRIC_5_CAPTION_SLOT) slots.push(-1)
      else slots.push(imageIndices[imgIdx++] ?? 0)
    }
    return (
      <figure
        className="artwork-group artwork-group--asymmetric-5"
        style={{ margin: 0 }}
      >
        {slots.map((sourceIndex) => {
          if (sourceIndex < 0) {
            return (
              <div key="caption" className="artwork-group-caption-cell">
                <span className="artwork-description">{formatCaptionText(sharedCaption)}</span>
              </div>
            )
          }
          const artwork = slice[sourceIndex]!
          const alt = getLocalized(artwork.description, locale) || artwork.id
          return (
            <button
              key={artwork.id}
              type="button"
              onClick={() => onSelect(sourceIndex)}
              style={{
                padding: 0,
                border: 'none',
                background: 'none',
                cursor: 'pointer',
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
                  <ArtworkInfoIcon info={getLocalized(artwork.info, locale) || null} />
                </span>
              </span>
            </button>
          )
        })}
      </figure>
    )
  }

  if (useCaptionInGrid) {
    const imageIndices =
      count === 6
        ? slice.map((_, i) => i).filter((i) => i !== captionedIndex)
        : [0, 1, 2, 3, 4].slice(0, count)
    const order =
      count === 6
        ? [imageIndices[0], imageIndices[1], imageIndices[2], -1, imageIndices[3], imageIndices[4]]
        : [0, 1, 2, -1, 3, 4]
    return (
      <figure
        className="artwork-group artwork-group-6 artwork-group--caption-in-grid"
        style={{ margin: 0 }}
      >
        {order.map((_, cellIdx) => {
          if (cellIdx === CAPTION_CELL_INDEX) {
            return (
              <div key="caption" className="artwork-group-caption-cell">
                <span className="artwork-description">{formatCaptionText(sharedCaption)}</span>
              </div>
            )
          }
          const imgIdx = cellIdx < CAPTION_CELL_INDEX ? cellIdx : cellIdx - 1
          const sourceIndex = count === 6 ? imageIndices[imgIdx]! : [0, 1, 2, 3, 4][imgIdx]!
          const artwork = slice[sourceIndex]!
          const alt = getLocalized(artwork.description, locale) || artwork.id
          return (
            <button
              key={artwork.id}
              type="button"
              onClick={() => onSelect(sourceIndex)}
              style={{
                padding: 0,
                border: 'none',
                background: 'none',
                cursor: 'pointer',
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
                  <ArtworkInfoIcon info={getLocalized(artwork.info, locale) || null} />
                </span>
              </span>
            </button>
          )
        })}
      </figure>
    )
  }

  if (useSingleCaption) {
    return (
      <figure
        className={`artwork-group artwork-group-${count} artwork-group--single-caption`}
        style={{ margin: 0 }}
      >
        {slice.map((artwork, idx) => {
          const desc = getLocalized(artwork.description, locale)
          const alt = desc || artwork.id
          return (
            <button
              key={artwork.id}
              type="button"
              onClick={() => onSelect(idx)}
              style={{
                padding: 0,
                border: 'none',
                background: 'none',
                cursor: 'pointer',
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
                  <ArtworkInfoIcon info={getLocalized(artwork.info, locale) || null} />
                </span>
              </span>
            </button>
          )
        })}
        <figcaption className="artwork-group-caption" style={{ gridColumn: '1 / -1' }}>
          {sharedCaption ? (
            <span className="artwork-description">{formatCaptionText(sharedCaption)}</span>
          ) : null}
        </figcaption>
      </figure>
    )
  }

  if (usePerImageCaption) {
  return (
    <div
      className={`artwork-group artwork-group-${count} artwork-group--per-image-caption`}
      style={{ margin: 0 }}
      role="group"
    >
      {slice.map((artwork, idx) => {
        const desc = getLocalized(artwork.description, locale)
        const alt = desc || artwork.id
        return (
          <figure key={artwork.id} style={{ margin: 0 }}>
            <button
              type="button"
              onClick={() => onSelect(idx)}
              style={{
                padding: 0,
                border: 'none',
                background: 'none',
                cursor: 'pointer',
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
                  <ArtworkInfoIcon info={getLocalized(artwork.info, locale) || null} />
                </span>
              </span>
            </button>
            <figcaption>
              {desc ? (
                <span className="artwork-description">{formatCaptionText(desc)}</span>
              ) : null}
            </figcaption>
          </figure>
        )
      })}
    </div>
  )
  }

  return null
}

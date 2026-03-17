import { useId } from 'react'
import { Tooltip } from 'react-tooltip'
import { formatCaptionText } from '../utils/formatCaptionText'

const TOOLTIP_DELAY_SHOW = 400
const TOOLTIP_DELAY_HIDE = 150

type Props = {
  info: string | null
}

export function ArtworkInfoIcon({ info }: Props) {
  const hasInfo = info != null && info.trim() !== ''
  const tooltipId = useId()
  if (!hasInfo) return null

  return (
    <>
      <span
        className="artwork-info"
        data-tooltip-id={tooltipId}
        data-tooltip-place="bottom"
        data-tooltip-delay-show={TOOLTIP_DELAY_SHOW}
        data-tooltip-delay-hide={TOOLTIP_DELAY_HIDE}
        onClick={(e) => e.stopPropagation()}
        onMouseDown={(e) => e.stopPropagation()}
        aria-label="Informações da obra"
      >
        <svg
          className="artwork-info-icon"
          width="20"
          height="20"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
          aria-hidden
        >
          <circle cx="12" cy="12" r="10" />
          <path d="M12 16v-4M12 8h.01" />
        </svg>
      </span>
      <Tooltip id={tooltipId} className="artwork-info-tooltip">
        <div className="artwork-info-tooltip-content">
          {formatCaptionText(info)}
        </div>
      </Tooltip>
    </>
  )
}

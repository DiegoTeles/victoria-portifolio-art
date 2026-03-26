import { useCallback, useEffect, useRef, useState } from 'react'
import { Document, Page, pdfjs } from 'react-pdf'
import { useLocale } from '../i18n/LocaleContext'
import 'react-pdf/dist/Page/AnnotationLayer.css'
import 'react-pdf/dist/Page/TextLayer.css'

pdfjs.GlobalWorkerOptions.workerSrc = `https://unpkg.com/pdfjs-dist@${pdfjs.version}/build/pdf.worker.min.mjs`

const PDF_URL = '/pdf/tcc.pdf'

export function TccPdfPanel() {
  const { t } = useLocale()
  const containerRef = useRef<HTMLDivElement>(null)
  const [pageCount, setPageCount] = useState<number | null>(null)
  const [width, setWidth] = useState(720)
  const [loadError, setLoadError] = useState(false)

  const measure = useCallback(() => {
    const el = containerRef.current
    if (!el) return
    const w = el.getBoundingClientRect().width
    if (w > 0) setWidth(Math.min(1400, Math.floor(w)))
  }, [])

  useEffect(() => {
    measure()
    const ro = new ResizeObserver(() => measure())
    if (containerRef.current) ro.observe(containerRef.current)
    window.addEventListener('resize', measure)
    return () => {
      ro.disconnect()
      window.removeEventListener('resize', measure)
    }
  }, [measure])

  return (
    <div ref={containerRef} className="about-pdf-panel">
      {loadError ? (
        <p className="about-pdf-error" role="alert">
          {t('aboutPdfLoadError')}
        </p>
      ) : (
        <Document
          file={PDF_URL}
          loading={null}
          onLoadSuccess={({ numPages }) => {
            setLoadError(false)
            setPageCount(numPages)
          }}
          onLoadError={() => {
            setLoadError(true)
            setPageCount(null)
          }}
          className="about-pdf-document"
        >
          {pageCount != null &&
            pageCount > 0 &&
            Array.from({ length: pageCount }, (_, i) => (
              <Page
                key={i + 1}
                pageNumber={i + 1}
                width={width}
                className="about-pdf-page"
                renderTextLayer
                renderAnnotationLayer
              />
            ))}
        </Document>
      )}
    </div>
  )
}

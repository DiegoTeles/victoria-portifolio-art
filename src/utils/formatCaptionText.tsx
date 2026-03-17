import type { ReactNode } from 'react'

export function formatCaptionText(text: string): ReactNode {
  if (!text) return null
  const parts = text.split('*')
  if (parts.length === 1) return text
  return parts.map((segment, i) =>
    i % 2 === 1 ? <em key={i}>{segment}</em> : segment
  )
}

export function plainCaptionText(text: string): string {
  if (!text) return ''
  return text.replace(/\*([^*]*)\*/g, '$1')
}

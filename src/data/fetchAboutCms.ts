import { apiUrl } from '@/lib/apiUrl'

type CmsPublicPayload = {
  content?: string
}

function publicCmsHtmlFromPayload(data: unknown): string | null {
  if (!data || typeof data !== 'object') return null
  const o = data as CmsPublicPayload
  const raw = String(o.content ?? '').trim()
  if (!raw) return null
  return String(o.content ?? '')
}

export async function fetchAboutBio(locale: string): Promise<string | null> {
  try {
    const r = await fetch(
      apiUrl(`/api/about/bio?locale=${encodeURIComponent(locale)}`),
      { cache: 'no-store' },
    )
    if (!r.ok) return null
    const data: unknown = await r.json()
    return publicCmsHtmlFromPayload(data)
  } catch {
    return null
  }
}

export async function fetchAboutCurriculum(locale: string): Promise<string | null> {
  try {
    const r = await fetch(
      apiUrl(`/api/about/curriculum?locale=${encodeURIComponent(locale)}`),
      { cache: 'no-store' },
    )
    if (!r.ok) return null
    const data: unknown = await r.json()
    return publicCmsHtmlFromPayload(data)
  } catch {
    return null
  }
}

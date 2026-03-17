import { rewrite } from '@vercel/functions'

export default function middleware(request) {
  const url = new URL(request.url)
  const pathSegments = url.pathname.split('/').filter(Boolean)
  if (pathSegments.length === 2 && pathSegments[0] === 's' && pathSegments[1]) {
    return rewrite(new URL('/api/og-page?image=' + encodeURIComponent(pathSegments[1]), request.url))
  }
  if (url.pathname === '/' && url.searchParams.has('image')) {
    return rewrite(new URL('/api/og-page' + url.search, request.url))
  }
}

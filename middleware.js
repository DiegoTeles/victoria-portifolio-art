import { rewrite } from '@vercel/functions'

export default function middleware(request) {
  const url = new URL(request.url)
  if (url.pathname === '/' && url.searchParams.has('image')) {
    return rewrite(new URL('/api/og-page' + url.search, request.url))
  }
}

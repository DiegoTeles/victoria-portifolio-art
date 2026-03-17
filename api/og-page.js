import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))

function getText(obj, locale = 'pt-Br') {
  if (obj == null) return ''
  if (typeof obj === 'string') return obj
  if (typeof obj !== 'object') return ''
  return obj[locale] ?? obj['en'] ?? obj['pt-Br'] ?? Object.values(obj)[0] ?? ''
}

function plainText(str) {
  if (!str) return ''
  return String(str)
    .replace(/\*([^*]+)\*/g, '$1')
    .replace(/\n/g, ' ')
    .trim()
}

export default function handler(req, res) {
  const imageId = req.query?.image
  if (!imageId || typeof imageId !== 'string') {
    res.status(307).setHeader('Location', '/').end()
    return
  }

  let artworks
  try {
    const jsonPath = path.join(process.cwd(), 'src', 'data', 'artworks.json')
    const raw = fs.readFileSync(jsonPath, 'utf-8')
    const data = JSON.parse(raw)
    artworks = Array.isArray(data) ? data : []
  } catch {
    res.status(307).setHeader('Location', '/').end()
    return
  }

  const artwork = artworks.find((a) => a.id === imageId)
  if (!artwork) {
    res.status(307).setHeader('Location', '/').end()
    return
  }

  const protocol = req.headers['x-forwarded-proto'] === 'https' ? 'https' : 'http'
  let host = req.headers['x-forwarded-host'] || req.headers.host || ''
  if (!host || host.startsWith('localhost') || host.startsWith('127.0.0.1')) {
    host = process.env.VERCEL_URL ? `${process.env.VERCEL_URL}` : 'www.victoriamaria-art.com'
  }
  const origin = host.startsWith('http') ? host.replace(/\/$/, '') : `${protocol}://${host}`

  const title = plainText(getText(artwork.title))
  const description = plainText(getText(artwork.description))
  const imagePath = artwork.image || '/images/digital-art/digital-art-01.png'
  const imageUrl = imagePath.startsWith('http') ? imagePath : `${origin}${imagePath}`

  let html
  try {
    const distPath = path.join(process.cwd(), 'dist', 'index.html')
    html = fs.readFileSync(distPath, 'utf-8')
  } catch {
    try {
      html = fs.readFileSync(path.join(process.cwd(), 'index.html'), 'utf-8')
    } catch {
      res.status(500).end('Internal error')
      return
    }
  }

  const fullUrl = `${origin}/?image=${encodeURIComponent(imageId)}`

  const siteName = 'Victória Maria — Portfólio'
  const defaultTitle = 'Victória Maria — Portfólio e Currículo'
  const defaultDesc = 'Portfólio e currículo. Artes Visuais, desenho, pintura, fotografia, arte digital e vídeos.'

  const ogTitle = title ? `${title} — ${siteName}` : defaultTitle
  const ogDesc = description || defaultDesc

  const escape = (s) => String(s).replace(/&/g, '&amp;').replace(/"/g, '&quot;').replace(/</g, '&lt;')
  const ogImageTag = `<meta property="og:image" content="${escape(imageUrl)}" />`
  const twImageTag = `<meta name="twitter:image" content="${escape(imageUrl)}" />`
  html = html
    .replace(/<title>[\s\S]*?<\/title>/, `<title>${escape(ogTitle)}</title>`)
    .replace(/<meta name="description" content="[^"]*"[^>]*>/, `<meta name="description" content="${escape(ogDesc)}" />`)
    .replace(/<meta property="og:title" content="[^"]*"[^>]*>/, `<meta property="og:title" content="${escape(ogTitle)}" />`)
    .replace(/<meta property="og:description" content="[^"]*"[^>]*>/, `<meta property="og:description" content="${escape(ogDesc)}" />`)
    .replace(/<meta property="og:image" content="[^"]*"[^>]*>/, ogImageTag)
    .replace(/<meta property="og:url" content="[^"]*"[^>]*>/, `<meta property="og:url" content="${escape(fullUrl)}" />`)
    .replace(/<meta name="twitter:title" content="[^"]*"[^>]*>/, `<meta name="twitter:title" content="${escape(ogTitle)}" />`)
    .replace(/<meta name="twitter:description" content="[^"]*"[^>]*>/, `<meta name="twitter:description" content="${escape(ogDesc)}" />`)
    .replace(/<meta name="twitter:image" content="[^"]*"[^>]*>/, twImageTag)

  res.setHeader('Content-Type', 'text/html; charset=utf-8')
  res.setHeader('Cache-Control', 'public, max-age=3600')
  res.status(200).send(html)
}

import path from 'node:path'
import type { IncomingMessage, ServerResponse } from 'node:http'
import { fileURLToPath, pathToFileURL } from 'node:url'
import type { Plugin } from 'vite'

type ApiHandler = (req: IncomingMessage, res: unknown) => Promise<void>

const projectRoot = path.dirname(fileURLToPath(import.meta.url))

async function loadHandler(relativeToProject: string): Promise<ApiHandler> {
  const abs = path.join(projectRoot, relativeToProject)
  const mod = (await import(pathToFileURL(abs).href)) as { default: ApiHandler }
  return mod.default
}

function createVercelLikeRes(nodeRes: ServerResponse) {
  const api = {
    setHeader(name: string, value: string | number | readonly string[]) {
      nodeRes.setHeader(name, value)
      return api
    },
    status(code: number) {
      return {
        json(data: unknown) {
          if (nodeRes.writableEnded) return
          nodeRes.statusCode = code
          if (!nodeRes.getHeader('content-type')) {
            nodeRes.setHeader('Content-Type', 'application/json')
          }
          nodeRes.end(JSON.stringify(data))
        },
      }
    },
  }
  return api
}

async function readJsonBody(req: IncomingMessage): Promise<unknown> {
  const chunks: Buffer[] = []
  for await (const chunk of req) {
    chunks.push(chunk as Buffer)
  }
  const raw = Buffer.concat(chunks).toString('utf8')
  if (!raw) return {}
  return JSON.parse(raw)
}

function augmentReq(req: IncomingMessage, query: Record<string, string>) {
  ;(req as IncomingMessage & { body?: unknown; query?: Record<string, string> }).query = query
}

export function viteApiDevPlugin(): Plugin {
  return {
    name: 'vite-api-dev',
    configureServer(server) {
      server.middlewares.use(async (req, res, next) => {
        const pathname = req.url?.split('?')[0] ?? ''
        if (!pathname.startsWith('/api')) {
          next()
          return
        }
        const method = req.method ?? 'GET'
        const needsJsonBody =
          (method === 'POST' || method === 'PUT' || method === 'PATCH') &&
          pathname !== '/api/og-page'

        let body: unknown
        if (needsJsonBody) {
          try {
            body = await readJsonBody(req)
          } catch {
            const r = createVercelLikeRes(res)
            r.status(400).json({ error: 'Invalid JSON' })
            return
          }
          ;(req as IncomingMessage & { body?: unknown }).body = body
        }

        const vres = createVercelLikeRes(res)

        try {
          if (pathname === '/api/admin/login' && method === 'POST') {
            await (await loadHandler('api/admin/login.mjs'))(req, vres as never)
            return
          }
          if (pathname === '/api/admin/logout' && method === 'POST') {
            await (await loadHandler('api/admin/logout.mjs'))(req, vres as never)
            return
          }
          if (pathname === '/api/admin/me' && method === 'GET') {
            await (await loadHandler('api/admin/me.mjs'))(req, vres as never)
            return
          }
          if (pathname === '/api/admin/blob' && method === 'POST') {
            await (await loadHandler('api/admin/blob.mjs'))(req, vres as never)
            return
          }
          if (pathname === '/api/blob/private' && method === 'GET') {
            const url = req.url ? new URL(req.url, 'http://localhost').searchParams.get('url') : null
            augmentReq(req, { url: url ?? '' })
            await (await loadHandler('api/blob/private.mjs'))(req, res as never)
            return
          }
          if (pathname === '/api/artworks' && method === 'GET') {
            await (await loadHandler('api/artworks.mjs'))(req, vres as never)
            return
          }
          if (pathname.startsWith('/api/artworks/') && method === 'GET') {
            const id = decodeURIComponent(pathname.slice('/api/artworks/'.length))
            if (!id || id.includes('/')) {
              next()
              return
            }
            augmentReq(req, { id })
            await (await loadHandler('api/artworks/[id].mjs'))(req, vres as never)
            return
          }
          if (pathname === '/api/admin/artworks' && method === 'POST') {
            await (await loadHandler('api/admin/artworks.mjs'))(req, vres as never)
            return
          }
          if (pathname.startsWith('/api/admin/artworks/') && (method === 'PUT' || method === 'DELETE')) {
            const id = decodeURIComponent(pathname.slice('/api/admin/artworks/'.length))
            if (!id || id.includes('/')) {
              next()
              return
            }
            augmentReq(req, { id })
            await (await loadHandler('api/admin/artworks/[id].mjs'))(req, vres as never)
            return
          }
        } catch (e) {
          console.error(e)
          if (!res.writableEnded) {
            res.statusCode = 500
            res.setHeader('Content-Type', 'application/json')
            res.end(JSON.stringify({ error: 'Server error' }))
          }
          return
        }

        next()
      })
    },
  }
}

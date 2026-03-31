import { readFileSync } from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { neon } from '@neondatabase/serverless'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const root = path.join(__dirname, '..')

const url = process.env.DATABASE_URL
if (!url) {
  console.error('Defina DATABASE_URL (ex.: node --env-file=.env.local scripts/init-db.mjs)')
  process.exit(1)
}

const sql = neon(url)
const schema = readFileSync(path.join(root, 'db/schema.sql'), 'utf8')
const statements = schema
  .replace(/\r\n/g, '\n')
  .trim()
  .split(/;\s*(?=\n|$)/)
  .map((s) => s.trim())
  .filter(Boolean)

for (const st of statements) {
  await sql`${sql.unsafe(st + ';')}`
}

console.log('Schema aplicado: tabela artworks e índices.')

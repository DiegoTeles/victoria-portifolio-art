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

function splitSqlStatements(source) {
  return source
    .replace(/\r\n/g, '\n')
    .trim()
    .split(/;\s*(?=\n|$)/)
    .map((s) => s.trim())
    .filter(Boolean)
}

async function applySqlFile(relativePath, label) {
  const full = path.join(root, relativePath)
  const raw = readFileSync(full, 'utf8')
  const statements = splitSqlStatements(raw)
  for (const st of statements) {
    await sql`${sql.unsafe(st + ';')}`
  }
  console.log(label)
}

await applySqlFile('db/schema.sql', 'Schema base: artworks e índices.')
await applySqlFile(
  'db/migration-cms-relational.sql',
  'Migração CMS: categorias, subcategorias, artwork_categories, bio, currículo, redes.'
)
console.log('Concluído.')

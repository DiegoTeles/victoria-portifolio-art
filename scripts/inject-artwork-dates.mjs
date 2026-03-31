import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const filePath = path.join(__dirname, '../src/data/artworks.json')
const data = JSON.parse(fs.readFileSync(filePath, 'utf8'))
const base = new Date(Date.UTC(2020, 0, 1))
for (const item of data) {
  if (item.date) continue
  const d = new Date(base)
  d.setUTCDate(d.getUTCDate() + (item.order - 1))
  item.date = d.toISOString().slice(0, 10)
}
fs.writeFileSync(filePath, JSON.stringify(data, null, 2) + '\n')

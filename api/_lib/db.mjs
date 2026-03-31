import { neon } from '@neondatabase/serverless'

let sqlInstance

export function getSql() {
  if (!process.env.DATABASE_URL) {
    throw new Error('DATABASE_URL is not set')
  }
  if (!sqlInstance) {
    sqlInstance = neon(process.env.DATABASE_URL)
  }
  return sqlInstance
}

export function hasDatabase() {
  return Boolean(process.env.DATABASE_URL)
}

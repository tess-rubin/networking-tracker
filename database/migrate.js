import fs from 'node:fs/promises'
import path from 'node:path'
import process from 'node:process'
import pg from 'pg'

if (!process.env.DATABASE_URL) {
  console.error('DATABASE_URL is required. Copy .env.example to .env.local and load it before running migrations.')
  process.exit(1)
}

const client = new pg.Client({ connectionString: process.env.DATABASE_URL, ssl: { rejectUnauthorized: false } })
try {
  await client.connect()
  const sql = await fs.readFile(path.join(process.cwd(), 'database/001_contacts.sql'), 'utf8')
  await client.query('BEGIN')
  await client.query(sql)
  await client.query('COMMIT')
  console.log('Applied database/001_contacts.sql')
} catch (error) {
  await client.query('ROLLBACK').catch(() => {})
  console.error(error.message)
  process.exitCode = 1
} finally {
  await client.end().catch(() => {})
}

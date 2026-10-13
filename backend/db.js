const { Pool } = require('pg')

// ======================================================
// DATABASE CONNECTION
// ======================================================

// Prevent real database access during isolated tests
if (process.env.NODE_ENV === 'test') {
  throw new Error(
    'Database access is disabled during isolated tests'
  )
}

// PostgreSQL connection pool
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  connectionTimeoutMillis: 10000,
  max: 10
})

module.exports = pool
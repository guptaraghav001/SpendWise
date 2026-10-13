const request = require('supertest')
const jwt = require('jsonwebtoken')

// Use a test-only secret, never production credentials.
const TEST_SECRET =
  'spendwise-jwt-testing-secret-2026-secure-example'

process.env.JWT_SECRET = TEST_SECRET

const app = require('../server')

describe('SpendWise JWT Authentication', () => {
  test('Rejects requests without a token', async () => {
    const response = await request(app)
      .get('/api/expenses?month=10&year=2026')

    expect(response.status).toBe(401)
  })

  test('Rejects an invalid token', async () => {
    const response = await request(app)
      .get('/api/expenses?month=10&year=2026')
      .set('Authorization', 'Bearer invalid-token')

    expect(response.status).toBe(403)
  })

  test('Rejects an expired token', async () => {
    const token = jwt.sign(
      { userId: 999 },
      TEST_SECRET,
      { expiresIn: -10 }
    )

    const response = await request(app)
      .get('/api/expenses?month=10&year=2026')
      .set('Authorization', `Bearer ${token}`)

    expect(response.status).toBe(403)
  })

  test('Rejects a token signed with another secret', async () => {
    const token = jwt.sign(
      { userId: 999 },
      'different-test-secret-that-is-not-valid',
      { expiresIn: '1h' }
    )

    const response = await request(app)
      .get('/api/expenses?month=10&year=2026')
      .set('Authorization', `Bearer ${token}`)

    expect(response.status).toBe(403)
  })
})
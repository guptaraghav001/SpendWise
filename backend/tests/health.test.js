const request = require('supertest')
const app = require('../server')

describe('SpendWise Backend API', () => {
  test('GET / should return backend status', async () => {
    const response = await request(app)
      .get('/')

    expect(response.status).toBe(200)

    expect(response.text).toBe(
      'SpendWise backend is running!'
    )
  })

  test('Unknown API route should return 404', async () => {
    const response = await request(app)
      .get('/api/unknown-route')

    expect(response.status).toBe(404)

    expect(response.body).toEqual({
      message: 'API endpoint not found'
    })
  })

  test('Protected API should reject missing token', async () => {
    const response = await request(app)
      .get('/api/expenses?month=10&year=2026')

    expect(response.status).toBe(401)

    expect(response.body.message).toBe(
      'Authentication required'
    )
  })
})
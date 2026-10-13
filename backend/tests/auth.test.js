const request = require('supertest')
const app = require('../server')

describe('SpendWise Authentication Security', () => {
  test('Login rejects missing credentials', async () => {
    const response = await request(app)
      .post('/api/auth/login')
      .send({})

    expect(response.status).toBe(400)
    expect(response.body.message).toBe(
      'Email and password are required'
    )
  })

  test('Registration rejects missing fields', async () => {
    const response = await request(app)
      .post('/api/auth/register')
      .send({})

    expect(response.status).toBe(400)
    expect(response.body.message).toBe(
      'Name, email and password are required'
    )
  })

  test('Registration rejects short passwords', async () => {
    const response = await request(app)
      .post('/api/auth/register')
      .send({
        name: 'Test User',
        email: 'test@example.com',
        password: '123'
      })

    expect(response.status).toBe(400)
    expect(response.body.message).toBe(
      'Password must be at least 8 characters'
    )
  })

  test('Login rejects non-string email', async () => {
    const response = await request(app)
      .post('/api/auth/login')
      .send({
        email: 12345,
        password: 'testpassword123'
      })

    expect(response.status).toBe(400)
  })

  test('Registration rejects non-string password', async () => {
    const response = await request(app)
      .post('/api/auth/register')
      .send({
        name: 'Test User',
        email: 'test@example.com',
        password: 12345678
      })

    expect(response.status).toBe(400)
  })
})
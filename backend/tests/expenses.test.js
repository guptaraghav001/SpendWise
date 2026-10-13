const request = require('supertest')
const jwt = require('jsonwebtoken')

const pool = require('../db')
const app = require('../server')

const createToken = (userId) =>
  jwt.sign(
    { userId },
    process.env.JWT_SECRET,
    {
      algorithm: 'HS256',
      expiresIn: '1h'
    }
  )

describe('SpendWise Expense API', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  test('Authenticated user can retrieve their expenses', async () => {
    const token = createToken(1)

    const testExpenses = [
      {
        id: 10,
        user_id: 1,
        title: 'Groceries',
        category: 'Food',
        amount: '1500.00',
        expense_date: '2026-10-13'
      }
    ]

    pool.query.mockResolvedValueOnce({
      rows: testExpenses
    })

    const response = await request(app)
      .get('/api/expenses?month=10&year=2026')
      .set('Authorization', `Bearer ${token}`)

    expect(response.status).toBe(200)
    expect(response.body).toEqual(testExpenses)

    expect(pool.query).toHaveBeenCalledWith(
      expect.stringContaining('FROM expenses'),
      [1, 10, 2026]
    )
  })

  test('User cannot delete another user expense', async () => {
    const token = createToken(2)

    pool.query.mockResolvedValueOnce({
      rows: []
    })

    const response = await request(app)
      .delete('/api/expenses/10')
      .set('Authorization', `Bearer ${token}`)

    expect(response.status).toBe(404)
    expect(response.body.message).toBe(
      'Expense not found'
    )

    expect(pool.query).toHaveBeenCalledWith(
      expect.stringContaining('DELETE FROM expenses'),
      [10, 2]
    )
  })

  test('Rejects invalid expense month', async () => {
    const token = createToken(1)

    const response = await request(app)
      .get('/api/expenses?month=15&year=2026')
      .set('Authorization', `Bearer ${token}`)

    expect(response.status).toBe(400)
    expect(pool.query).not.toHaveBeenCalled()
  })

  test('Rejects invalid expense ID', async () => {
    const token = createToken(1)

    const response = await request(app)
      .delete('/api/expenses/invalid')
      .set('Authorization', `Bearer ${token}`)

    expect(response.status).toBe(400)
    expect(pool.query).not.toHaveBeenCalled()
  })
})
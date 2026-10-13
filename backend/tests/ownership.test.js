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

describe('SpendWise Ownership Security', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  test('User cannot update another user expense', async () => {
    const token = createToken(2)

    pool.query.mockResolvedValueOnce({
      rows: []
    })

    const response = await request(app)
      .put('/api/expenses/10')
      .set('Authorization', `Bearer ${token}`)
      .send({
        title: 'Updated Expense',
        category: 'Food',
        amount: 1500,
        expenseDate: '2026-10-13'
      })

    expect(response.status).toBe(404)

    expect(pool.query).toHaveBeenCalledWith(
      expect.stringContaining('UPDATE expenses'),
      [
        'Updated Expense',
        'Food',
        1500,
        '2026-10-13',
        10,
        2
      ]
    )
  })

  test('User cannot update another user income', async () => {
    const token = createToken(2)

    pool.query.mockResolvedValueOnce({
      rows: []
    })

    const response = await request(app)
      .put('/api/incomes/10')
      .set('Authorization', `Bearer ${token}`)
      .send({
        title: 'Updated Salary',
        source: 'Salary',
        amount: 60000,
        incomeDate: '2026-10-13'
      })

    expect(response.status).toBe(404)

    expect(pool.query).toHaveBeenCalledWith(
      expect.stringContaining('UPDATE incomes'),
      [
        'Updated Salary',
        'Salary',
        60000,
        '2026-10-13',
        10,
        2
      ]
    )
  })

  test('User cannot add money to another user savings goal', async () => {
    const token = createToken(2)

    pool.query.mockResolvedValueOnce({
      rows: []
    })

    const response = await request(app)
      .patch('/api/savings-goals/10/add')
      .set('Authorization', `Bearer ${token}`)
      .send({ amount: 500 })

    expect(response.status).toBe(404)

    expect(pool.query).toHaveBeenCalledWith(
      expect.stringContaining('UPDATE savings_goals'),
      [500, 10, 2]
    )
  })

  test('User cannot delete another user recurring expense', async () => {
    const token = createToken(2)

    pool.query.mockResolvedValueOnce({
      rows: []
    })

    const response = await request(app)
      .delete('/api/recurring-expenses/10')
      .set('Authorization', `Bearer ${token}`)

    expect(response.status).toBe(404)

    expect(pool.query).toHaveBeenCalledWith(
      expect.stringContaining('DELETE FROM recurring_expenses'),
      [10, 2]
    )
  })

  test('Invalid JWT is rejected before database access', async () => {
    const response = await request(app)
      .get('/api/savings-goals')
      .set('Authorization', 'Bearer invalid-token')

    expect(response.status).toBe(403)
    expect(pool.query).not.toHaveBeenCalled()
  })
})
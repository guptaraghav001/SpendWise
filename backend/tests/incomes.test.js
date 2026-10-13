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

describe('SpendWise Income API', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  test('Authenticated user can retrieve monthly income', async () => {
    const token = createToken(1)

    const testIncomes = [
      {
        id: 10,
        title: 'October Salary',
        source: 'Salary',
        amount: '60000.00',
        income_date: '2026-10-13'
      }
    ]

    pool.query.mockResolvedValueOnce({
      rows: testIncomes
    })

    const response = await request(app)
      .get('/api/incomes?month=10&year=2026')
      .set('Authorization', `Bearer ${token}`)

    expect(response.status).toBe(200)
    expect(response.body).toEqual(testIncomes)

    expect(pool.query).toHaveBeenCalledWith(
      expect.stringContaining('FROM incomes'),
      [1, 10, 2026]
    )
  })

  test('Authenticated user can create income', async () => {
    const token = createToken(1)

    const newIncome = {
      title: 'Freelance Work',
      source: 'Freelance',
      amount: 5000,
      incomeDate: '2026-10-13'
    }

    pool.query.mockResolvedValueOnce({
      rows: [
        {
          id: 11,
          user_id: 1,
          title: newIncome.title,
          source: newIncome.source,
          amount: '5000.00',
          income_date: newIncome.incomeDate
        }
      ]
    })

    const response = await request(app)
      .post('/api/incomes')
      .set('Authorization', `Bearer ${token}`)
      .send(newIncome)

    expect(response.status).toBe(201)
    expect(response.body.title).toBe('Freelance Work')

    expect(pool.query).toHaveBeenCalledWith(
      expect.stringContaining('INSERT INTO incomes'),
      [
        1,
        'Freelance Work',
        'Freelance',
        5000,
        '2026-10-13'
      ]
    )
  })

  test('User cannot delete another user income', async () => {
    const token = createToken(2)

    pool.query.mockResolvedValueOnce({
      rows: []
    })

    const response = await request(app)
      .delete('/api/incomes/10')
      .set('Authorization', `Bearer ${token}`)

    expect(response.status).toBe(404)

    expect(pool.query).toHaveBeenCalledWith(
      expect.stringContaining('DELETE FROM incomes'),
      [10, 2]
    )
  })

  test('Rejects invalid income amount', async () => {
    const token = createToken(1)

    const response = await request(app)
      .post('/api/incomes')
      .set('Authorization', `Bearer ${token}`)
      .send({
        title: 'Salary',
        source: 'Salary',
        amount: -500,
        incomeDate: '2026-10-13'
      })

    expect(response.status).toBe(400)
    expect(pool.query).not.toHaveBeenCalled()
  })

  test('Rejects invalid income source', async () => {
    const token = createToken(1)

    const response = await request(app)
      .post('/api/incomes')
      .set('Authorization', `Bearer ${token}`)
      .send({
        title: 'Test Income',
        source: 'UnknownSource',
        amount: 1000,
        incomeDate: '2026-10-13'
      })

    expect(response.status).toBe(400)
    expect(pool.query).not.toHaveBeenCalled()
  })

  test('Rejects unauthenticated income requests', async () => {
    const response = await request(app)
      .get('/api/incomes?month=10&year=2026')

    expect(response.status).toBe(401)
    expect(pool.query).not.toHaveBeenCalled()
  })
})
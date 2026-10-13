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

describe('SpendWise Savings Goals API', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  test('Authenticated user can retrieve savings goals', async () => {
    const token = createToken(1)

    const goals = [
      {
        id: 10,
        user_id: 1,
        title: 'Laptop',
        target_amount: '50000.00',
        saved_amount: '5000.00',
        target_date: '2026-12-31'
      }
    ]

    pool.query.mockResolvedValueOnce({
      rows: goals
    })

    const response = await request(app)
      .get('/api/savings-goals')
      .set('Authorization', `Bearer ${token}`)

    expect(response.status).toBe(200)
    expect(response.body).toEqual(goals)

    expect(pool.query).toHaveBeenCalledWith(
      expect.stringContaining('FROM savings_goals'),
      [1]
    )
  })

  test('Authenticated user can create a savings goal', async () => {
    const token = createToken(1)

    pool.query.mockResolvedValueOnce({
      rows: [{
        id: 11,
        user_id: 1,
        title: 'New Laptop',
        target_amount: '60000.00',
        saved_amount: '0.00'
      }]
    })

    const response = await request(app)
      .post('/api/savings-goals')
      .set('Authorization', `Bearer ${token}`)
      .send({
        title: 'New Laptop',
        targetAmount: 60000,
        targetDate: '2026-12-31'
      })

    expect(response.status).toBe(201)
    expect(response.body.title).toBe('New Laptop')

    expect(pool.query).toHaveBeenCalledWith(
      expect.stringContaining('INSERT INTO savings_goals'),
      [1, 'New Laptop', 60000, '2026-12-31']
    )
  })

  test('Authenticated user can add savings', async () => {
    const token = createToken(1)

    pool.query.mockResolvedValueOnce({
      rows: [{
        id: 10,
        user_id: 1,
        saved_amount: '10000.00'
      }]
    })

    const response = await request(app)
      .patch('/api/savings-goals/10/add')
      .set('Authorization', `Bearer ${token}`)
      .send({ amount: 5000 })

    expect(response.status).toBe(200)
    expect(response.body.saved_amount).toBe('10000.00')

    expect(pool.query).toHaveBeenCalledWith(
      expect.stringContaining('UPDATE savings_goals'),
      [5000, 10, 1]
    )
  })

  test('User cannot update another user savings goal', async () => {
    const token = createToken(2)

    pool.query.mockResolvedValueOnce({
      rows: []
    })

    const response = await request(app)
      .put('/api/savings-goals/10')
      .set('Authorization', `Bearer ${token}`)
      .send({
        title: 'Updated Laptop',
        targetAmount: 70000,
        targetDate: '2026-12-31'
      })

    expect(response.status).toBe(404)
    expect(response.body.message).toBe(
      'Savings goal not found'
    )

    expect(pool.query).toHaveBeenCalledWith(
      expect.stringContaining('UPDATE savings_goals'),
      ['Updated Laptop', 70000, '2026-12-31', 10, 2]
    )
  })

  test('User cannot delete another user savings goal', async () => {
    const token = createToken(2)

    pool.query.mockResolvedValueOnce({
      rows: []
    })

    const response = await request(app)
      .delete('/api/savings-goals/10')
      .set('Authorization', `Bearer ${token}`)

    expect(response.status).toBe(404)

    expect(pool.query).toHaveBeenCalledWith(
      expect.stringContaining('DELETE FROM savings_goals'),
      [10, 2]
    )
  })

  test('Rejects invalid savings amount', async () => {
    const token = createToken(1)

    const response = await request(app)
      .patch('/api/savings-goals/10/add')
      .set('Authorization', `Bearer ${token}`)
      .send({ amount: -500 })

    expect(response.status).toBe(400)
    expect(pool.query).not.toHaveBeenCalled()
  })

  test('Rejects invalid target amount', async () => {
    const token = createToken(1)

    const response = await request(app)
      .post('/api/savings-goals')
      .set('Authorization', `Bearer ${token}`)
      .send({
        title: 'Test Goal',
        targetAmount: 0,
        targetDate: '2026-12-31'
      })

    expect(response.status).toBe(400)
    expect(pool.query).not.toHaveBeenCalled()
  })

  test('Rejects unauthenticated savings requests', async () => {
    const response = await request(app)
      .get('/api/savings-goals')

    expect(response.status).toBe(401)
    expect(pool.query).not.toHaveBeenCalled()
  })
})
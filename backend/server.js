require('dotenv').config()
const express = require('express')
const cors = require('cors')


const { Pool } = require('pg')


const bcrypt = require('bcrypt')
const jwt = require('jsonwebtoken')


const app = express()

app.use(cors())
app.use(express.json())

const pool = new Pool({
  user: 'raghav',
  host: 'localhost',
  database: 'spendwise',
  port: 5432
})

pool.query('SELECT NOW()', (error, result) => {
  if (error) {
    console.error('Database connection error:', error)
  } else {
    console.log('Database connected successfully')
  }
})

const PORT = 5001

const authenticateToken = (req, res, next) => {

  const authHeader = req.headers.authorization

  const token =
    authHeader && authHeader.split(' ')[1]

  if (!token) {
    return res.status(401).json({
      message: 'Authentication required'
    })
  }

  jwt.verify(
    token,
    process.env.JWT_SECRET,
    (error, decoded) => {

      if (error) {
        return res.status(403).json({
          message: 'Invalid or expired token'
        })
      }

      req.user = decoded

      next()
    }
 


)
}

app.get('/', (req, res) => {
  res.send('SpendWise backend is running!')
})

// REGISTER USER
app.post('/api/auth/register', async (req, res) => {
  try {
    const { name, email, password } = req.body

    if (!name || !email || !password) {
      return res.status(400).json({
        message: 'Name, email and password are required'
      })
    }

    const existingUser = await pool.query(
      'SELECT id FROM users WHERE email = $1',
      [email]
    )

    if (existingUser.rows.length > 0) {
      return res.status(409).json({
        message: 'Email already registered'
      })
    }

    const hashedPassword = await bcrypt.hash(password, 12)

    const result = await pool.query(
      `INSERT INTO users (name, email, password)
       VALUES ($1, $2, $3)
       RETURNING id, name, email, created_at`,
      [name, email, hashedPassword]
    )

    res.status(201).json({
      message: 'Registration successful',
      user: result.rows[0]
    })

  } catch (error) {
    console.error('Registration error:', error)

    res.status(500).json({
      message: 'Server error'
    })
  }
})

// LOGIN USER
app.post('/api/auth/login', async (req, res) => {
  try {
    const { email, password } = req.body

    if (!email || !password) {
      return res.status(400).json({
        message: 'Email and password are required'
      })
    }

    const result = await pool.query(
      'SELECT * FROM users WHERE email = $1',
      [email]
    )

    if (result.rows.length === 0) {
      return res.status(401).json({
        message: 'Invalid email or password'
      })
    }

    const user = result.rows[0]

    const passwordMatches = await bcrypt.compare(
      password,
      user.password
    )

    if (!passwordMatches) {
      return res.status(401).json({
        message: 'Invalid email or password'
      })
    }

    const token = jwt.sign(
      {
        userId: user.id,
        email: user.email
      },
      process.env.JWT_SECRET,
      {
        expiresIn: '1h'
      }
    )

    res.json({
      message: 'Login successful',

      token: token,

      user: {
        id: user.id,
        name: user.name,
        email: user.email
      }
    })

  } catch (error) {
    console.error('Login error:', error)

    res.status(500).json({
      message: 'Server error'
    })
  }
})

app.get(
  '/api/expenses',
  authenticateToken,
  async (req, res) => {

    try {
const month = Number(req.query.month)
const year = Number(req.query.year)

if (!month || !year) {
  return res.status(400).json({
    message: 'Month and year are required'
  })
}
      const result = await pool.query(
        `SELECT *
         FROM expenses
         WHERE user_id = $1
         AND EXTRACT(MONTH FROM expense_date) = $2
         AND EXTRACT(YEAR FROM expense_date) = $3
         ORDER BY id DESC`,
        [req.user.userId, month, year]
      )

      res.json(result.rows)

    } catch (error) {

      console.error(error)

      res.status(500).json({
        message: 'Server error'
      })
    }
  }
)

app.post(
  '/api/expenses',
  authenticateToken,
  async (req, res) => {
    try {
      const { title, category, amount ,expenseDate} = req.body

if (!title || !category || !amount || !expenseDate) {        return res.status(400).json({
          message: 'Title, category, amount and date are required'
        })
      }

      if (Number(amount) <= 0) {
  return res.status(400).json({
    message: 'Amount must be greater than 0'
  })
}

     const result = await pool.query(
  `INSERT INTO expenses
   (title, category, amount, user_id, expense_date)

   VALUES ($1, $2, $3, $4, $5)

   RETURNING *`,
  [
    title,
    category,
    amount,
    req.user.userId,
    expenseDate
  ]
)

      res.status(201).json(result.rows[0])

    } catch (error) {
      console.error('Error creating expense:', error)

      res.status(500).json({
        message: 'Server error'
      })
    }
  }
)

app.put(
  '/api/expenses/:id',
  authenticateToken,
  async (req, res) => {
    try {
      const id = Number(req.params.id)
      const { title, category, amount, expenseDate } = req.body

      if (!title || !category || !amount || !expenseDate) {
        return res.status(400).json({
          message: 'Title, category, amount and date are required'
        })
      }

      if (Number(amount) <= 0) {
  return res.status(400).json({
    message: 'Amount must be greater than 0'
  })
}


      const result = await pool.query(
        `UPDATE expenses
         SET title = $1,
             category = $2,
             amount = $3,
             expense_date = $4
         WHERE id = $5
         AND user_id = $6
         RETURNING *`,
        [
          title,
          category,
          amount,
          expenseDate,
          id,
          req.user.userId
        ]
      )

      if (result.rows.length === 0) {
        return res.status(404).json({
          message: 'Expense not found'
        })
      }

      res.json(result.rows[0])

    } catch (error) {
      console.error('Error updating expense:', error)

      res.status(500).json({
        message: 'Server error'
      })
    }
  }
)

app.delete(
  '/api/expenses/:id',
  authenticateToken,
  async (req, res) => {
    try {
      const id = Number(req.params.id)

      const result = await pool.query(
        `DELETE FROM expenses
         WHERE id = $1
         AND user_id = $2
         RETURNING *`,
        [
          id,
          req.user.userId
        ]
      )

      if (result.rows.length === 0) {
        return res.status(404).json({
          message: 'Expense not found'
        })
      }

      res.json({
        message: 'Expense deleted successfully',
        expense: result.rows[0]
      })

    } catch (error) {
      console.error('Error deleting expense:', error)

      res.status(500).json({
        message: 'Server error'
      })
    }
  }
)

app.get(
  '/api/budget',
  authenticateToken,
  async (req, res) => {
    try {
      const month = Number(req.query.month)
      const year = Number(req.query.year)

      if (!month || !year) {
        return res.status(400).json({
          message: 'Month and year are required'
        })
      }

      const result = await pool.query(
        `SELECT *
         FROM budgets
         WHERE user_id = $1
         AND month = $2
         AND year = $3`,
        [
          req.user.userId,
          month,
          year
        ]
      )

      if (result.rows.length === 0) {
        return res.json({
          amount: 0
        })
      }

      res.json(result.rows[0])

    } catch (error) {
      console.error('Error fetching budget:', error)

      res.status(500).json({
        message: 'Server error'
      })
    }
  }
)



app.put(
  '/api/budget',
  authenticateToken,
  async (req, res) => {
    try {
      const { amount, month, year } = req.body

      if (!amount || !month || !year) {
        return res.status(400).json({
          message: 'Amount, month and year are required'
        })
      }

      if (Number(amount) <= 0) {
  return res.status(400).json({
    message: 'Budget must be greater than 0'
  })
}

      const result = await pool.query(
        `INSERT INTO budgets
           (user_id, amount, month, year)

         VALUES ($1, $2, $3, $4)

         ON CONFLICT (user_id, month, year)

         DO UPDATE SET
           amount = EXCLUDED.amount

         RETURNING *`,
        [
          req.user.userId,
          amount,
          month,
          year
        ]
      )

      res.json(result.rows[0])

    } catch (error) {
      console.error('Error saving budget:', error)

      res.status(500).json({
        message: 'Server error'
      })
    }
  }
)



app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`)
})
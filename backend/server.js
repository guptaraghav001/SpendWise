require('dotenv').config()

const express = require('express')
const cors = require('cors')
const rateLimit = require('express-rate-limit')
const { Pool } = require('pg')
const bcrypt = require('bcrypt')
const jwt = require('jsonwebtoken')
const helmet = require('helmet')

const app = express()

const PORT = process.env.PORT || 5001

// ======================================================
// SECURITY / MIDDLEWARE
// ======================================================

const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 20,
  standardHeaders: 'draft-7',
  legacyHeaders: false,
  message: {
    message:
      'Too many authentication attempts. Please try again later.'
  }
})

const allowedOrigins = [
  'http://localhost:5173',
  'https://spendwise-woml.onrender.com'
]

app.use(helmet())

app.use(
  cors({
    origin: (origin, callback) => {
      if (!origin || allowedOrigins.includes(origin)) {
        callback(null, true)
      } else {
        callback(new Error('Not allowed by CORS'))
      }
    }
  })
)

app.use(express.json({ limit: '100kb' }))

// ======================================================
// DATABASE
// ======================================================

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,

  ssl:
    process.env.NODE_ENV === 'production'
      ? { rejectUnauthorized: false }
      : false
})

pool.query('SELECT NOW()', (error) => {
  if (error) {
    console.error('Database connection error:', error)
  } else {
    console.log('Database connected successfully')
  }
})

// ======================================================
// COMMON VALIDATION
// ======================================================

const allowedCategories = [
  'Food',
  'Travel',
  'Shopping',
  'Bills',
  'Other'
]

const allowedFrequencies = [
  'monthly',
  'yearly'
]

const isValidDateString = (value) => {
  if (
    typeof value !== 'string' ||
    !/^\d{4}-\d{2}-\d{2}$/.test(value)
  ) {
    return false
  }

  const date = new Date(`${value}T00:00:00Z`)

  return (
    !Number.isNaN(date.getTime()) &&
    date.toISOString().slice(0, 10) === value
  )
}

// ======================================================
// AUTHENTICATION MIDDLEWARE
// ======================================================

const authenticateToken = (req, res, next) => {
  const authHeader = req.headers.authorization

  if (
    !authHeader ||
    !authHeader.startsWith('Bearer ')
  ) {
    return res.status(401).json({
      message: 'Authentication required'
    })
  }

  const token = authHeader.slice(7)

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

// ======================================================
// HEALTH ROUTE
// ======================================================

app.get('/', (req, res) => {
  res.send('SpendWise backend is running!')
})

// ======================================================
// AUTH
// ======================================================

// REGISTER USER
app.post(
  '/api/auth/register',
  authLimiter,
  async (req, res) => {
    try {
      const { name, email, password } = req.body

      const cleanName = name?.trim()
      const cleanEmail =
        email?.trim().toLowerCase()

      if (!cleanName || !cleanEmail || !password) {
        return res.status(400).json({
          message:
            'Name, email and password are required'
        })
      }

      if (cleanName.length > 100) {
        return res.status(400).json({
          message:
            'Name must be 100 characters or less'
        })
      }

      if (
        !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(
          cleanEmail
        )
      ) {
        return res.status(400).json({
          message:
            'Please enter a valid email address'
        })
      }

      if (password.length < 8) {
        return res.status(400).json({
          message:
            'Password must be at least 8 characters'
        })
      }

      if (password.length > 128) {
        return res.status(400).json({
          message: 'Password is too long'
        })
      }

      const existingUser = await pool.query(
        `SELECT id
         FROM users
         WHERE email = $1`,
        [cleanEmail]
      )

      if (existingUser.rows.length > 0) {
        return res.status(409).json({
          message: 'Email already registered'
        })
      }

      const hashedPassword =
        await bcrypt.hash(password, 12)

      const result = await pool.query(
        `INSERT INTO users
           (name, email, password)

         VALUES ($1, $2, $3)

         RETURNING
           id,
           name,
           email,
           created_at`,
        [
          cleanName,
          cleanEmail,
          hashedPassword
        ]
      )

      res.status(201).json({
        message: 'Registration successful',
        user: result.rows[0]
      })

    } catch (error) {
      console.error(
        'Registration error:',
        error
      )

      res.status(500).json({
        message: 'Server error'
      })
    }
  }
)

// LOGIN USER
app.post(
  '/api/auth/login',
  authLimiter,
  async (req, res) => {
    try {
      const { email, password } = req.body

      const cleanEmail =
        email?.trim().toLowerCase()

      if (!cleanEmail || !password) {
        return res.status(400).json({
          message:
            'Email and password are required'
        })
      }

      const result = await pool.query(
        `SELECT *
         FROM users
         WHERE email = $1`,
        [cleanEmail]
      )

      if (result.rows.length === 0) {
        return res.status(401).json({
          message:
            'Invalid email or password'
        })
      }

      const user = result.rows[0]

      const passwordMatches =
        await bcrypt.compare(
          password,
          user.password
        )

      if (!passwordMatches) {
        return res.status(401).json({
          message:
            'Invalid email or password'
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
        token,
        user: {
          id: user.id,
          name: user.name,
          email: user.email
        }
      })

    } catch (error) {
      console.error(
        'Login error:',
        error
      )

      res.status(500).json({
        message: 'Server error'
      })
    }
  }
)

// ======================================================
// EXPENSES
// ======================================================

// GET MONTHLY EXPENSES
app.get(
  '/api/expenses',
  authenticateToken,
  async (req, res) => {
    try {
      const month = Number(req.query.month)
      const year = Number(req.query.year)

      if (
        !Number.isInteger(month) ||
        month < 1 ||
        month > 12
      ) {
        return res.status(400).json({
          message: 'Invalid month'
        })
      }

      if (
        !Number.isInteger(year) ||
        year < 2000 ||
        year > 2100
      ) {
        return res.status(400).json({
          message: 'Invalid year'
        })
      }

      const result = await pool.query(
        `SELECT *
         FROM expenses

         WHERE user_id = $1

         AND EXTRACT(
           MONTH FROM expense_date
         ) = $2

         AND EXTRACT(
           YEAR FROM expense_date
         ) = $3

         ORDER BY
           expense_date DESC,
           id DESC`,
        [
          req.user.userId,
          month,
          year
        ]
      )

      res.json(result.rows)

    } catch (error) {
      console.error(
        'Error fetching expenses:',
        error
      )

      res.status(500).json({
        message: 'Server error'
      })
    }
  }
)

// CREATE EXPENSE
app.post(
  '/api/expenses',
  authenticateToken,
  async (req, res) => {
    try {
      const {
        title,
        category,
        amount,
        expenseDate
      } = req.body

      const cleanTitle = title?.trim()
      const numericAmount = Number(amount)

      if (
        !cleanTitle ||
        cleanTitle.length > 100
      ) {
        return res.status(400).json({
          message:
            'Expense title must be between 1 and 100 characters'
        })
      }

      if (
        !allowedCategories.includes(category)
      ) {
        return res.status(400).json({
          message:
            'Invalid expense category'
        })
      }

      if (
        !Number.isFinite(numericAmount) ||
        numericAmount <= 0
      ) {
        return res.status(400).json({
          message:
            'Amount must be greater than 0'
        })
      }

      if (!isValidDateString(expenseDate)) {
        return res.status(400).json({
          message:
            'A valid expense date is required'
        })
      }

      const result = await pool.query(
        `INSERT INTO expenses
           (
             title,
             category,
             amount,
             user_id,
             expense_date
           )

         VALUES ($1, $2, $3, $4, $5)

         RETURNING *`,
        [
          cleanTitle,
          category,
          numericAmount,
          req.user.userId,
          expenseDate
        ]
      )

      res.status(201).json(
        result.rows[0]
      )

    } catch (error) {
      console.error(
        'Error creating expense:',
        error
      )

      res.status(500).json({
        message: 'Server error'
      })
    }
  }
)

// UPDATE EXPENSE
app.put(
  '/api/expenses/:id',
  authenticateToken,
  async (req, res) => {
    try {
      const id = Number(req.params.id)

      if (
        !Number.isInteger(id) ||
        id <= 0
      ) {
        return res.status(400).json({
          message: 'Invalid expense ID'
        })
      }

      const {
        title,
        category,
        amount,
        expenseDate
      } = req.body

      const cleanTitle = title?.trim()
      const numericAmount = Number(amount)

      if (
        !cleanTitle ||
        cleanTitle.length > 100
      ) {
        return res.status(400).json({
          message:
            'Expense title must be between 1 and 100 characters'
        })
      }

      if (
        !allowedCategories.includes(category)
      ) {
        return res.status(400).json({
          message:
            'Invalid expense category'
        })
      }

      if (
        !Number.isFinite(numericAmount) ||
        numericAmount <= 0
      ) {
        return res.status(400).json({
          message:
            'Amount must be greater than 0'
        })
      }

      if (!isValidDateString(expenseDate)) {
        return res.status(400).json({
          message:
            'A valid expense date is required'
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
          cleanTitle,
          category,
          numericAmount,
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
      console.error(
        'Error updating expense:',
        error
      )

      res.status(500).json({
        message: 'Server error'
      })
    }
  }
)

// DELETE EXPENSE
app.delete(
  '/api/expenses/:id',
  authenticateToken,
  async (req, res) => {
    try {
      const id = Number(req.params.id)

      if (
        !Number.isInteger(id) ||
        id <= 0
      ) {
        return res.status(400).json({
          message: 'Invalid expense ID'
        })
      }

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
        message:
          'Expense deleted successfully',
        expense: result.rows[0]
      })

    } catch (error) {
      console.error(
        'Error deleting expense:',
        error
      )

      res.status(500).json({
        message: 'Server error'
      })
    }
  }
)

// ======================================================
// BUDGETS
// ======================================================

// GET BUDGET
app.get(
  '/api/budget',
  authenticateToken,
  async (req, res) => {
    try {
      const month = Number(req.query.month)
      const year = Number(req.query.year)

      if (
        !Number.isInteger(month) ||
        month < 1 ||
        month > 12
      ) {
        return res.status(400).json({
          message: 'Invalid month'
        })
      }

      if (
        !Number.isInteger(year) ||
        year < 2000 ||
        year > 2100
      ) {
        return res.status(400).json({
          message: 'Invalid year'
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
      console.error(
        'Error fetching budget:',
        error
      )

      res.status(500).json({
        message: 'Server error'
      })
    }
  }
)

// SAVE BUDGET
app.put(
  '/api/budget',
  authenticateToken,
  async (req, res) => {
    try {
      const {
        amount,
        month,
        year
      } = req.body

      const numericAmount = Number(amount)
      const numericMonth = Number(month)
      const numericYear = Number(year)

      if (
        !Number.isFinite(numericAmount) ||
        numericAmount <= 0
      ) {
        return res.status(400).json({
          message:
            'Budget must be greater than 0'
        })
      }

      if (
        !Number.isInteger(numericMonth) ||
        numericMonth < 1 ||
        numericMonth > 12
      ) {
        return res.status(400).json({
          message: 'Invalid month'
        })
      }

      if (
        !Number.isInteger(numericYear) ||
        numericYear < 2000 ||
        numericYear > 2100
      ) {
        return res.status(400).json({
          message: 'Invalid year'
        })
      }

      const result = await pool.query(
        `INSERT INTO budgets
           (
             user_id,
             amount,
             month,
             year
           )

         VALUES ($1, $2, $3, $4)

         ON CONFLICT (
           user_id,
           month,
           year
         )

         DO UPDATE SET
           amount = EXCLUDED.amount

         RETURNING *`,
        [
          req.user.userId,
          numericAmount,
          numericMonth,
          numericYear
        ]
      )

      res.json(result.rows[0])

    } catch (error) {
      console.error(
        'Error saving budget:',
        error
      )

      res.status(500).json({
        message: 'Server error'
      })
    }
  }
)

// ======================================================
// ANALYTICS
// ======================================================

// GET 6-MONTH SPENDING TREND
app.get(
  '/api/analytics/trend',
  authenticateToken,
  async (req, res) => {
    try {
      const month = Number(req.query.month)
      const year = Number(req.query.year)

      if (
        !Number.isInteger(month) ||
        month < 1 ||
        month > 12
      ) {
        return res.status(400).json({
          message:
            'Valid month and year are required'
        })
      }

      if (
        !Number.isInteger(year) ||
        year < 2000 ||
        year > 2100
      ) {
        return res.status(400).json({
          message:
            'Valid month and year are required'
        })
      }

      const result = await pool.query(
        `WITH selected_period AS (
           SELECT
             MAKE_DATE($2, $3, 1)
             AS selected_month
         ),

         months AS (
           SELECT
             generate_series(
               selected_month
                 - INTERVAL '5 months',
               selected_month,
               INTERVAL '1 month'
             )::DATE AS month_start

           FROM selected_period
         ),

         monthly_spending AS (
           SELECT
             DATE_TRUNC(
               'month',
               expense_date
             )::DATE AS month_start,

             SUM(amount)::NUMERIC AS total

           FROM expenses

           WHERE user_id = $1

           GROUP BY
             DATE_TRUNC(
               'month',
               expense_date
             )
         )

         SELECT
           EXTRACT(
             YEAR FROM months.month_start
           )::INTEGER AS year,

           EXTRACT(
             MONTH FROM months.month_start
           )::INTEGER AS month,

           COALESCE(
             monthly_spending.total,
             0
           )::NUMERIC AS total

         FROM months

         LEFT JOIN monthly_spending
           ON monthly_spending.month_start =
              months.month_start

         ORDER BY
           months.month_start ASC`,
        [
          req.user.userId,
          year,
          month
        ]
      )

      res.json(result.rows)

    } catch (error) {
      console.error(
        'Error fetching spending trend:',
        error
      )

      res.status(500).json({
        message: 'Server error'
      })
    }
  }
)

// GET CATEGORY SPENDING COMPARISON
app.get(
  '/api/analytics/category-comparison',
  authenticateToken,
  async (req, res) => {
    try {
      const month = Number(req.query.month)
      const year = Number(req.query.year)

      if (
        !Number.isInteger(month) ||
        month < 1 ||
        month > 12
      ) {
        return res.status(400).json({
          message: 'Invalid month'
        })
      }

      if (
        !Number.isInteger(year) ||
        year < 2000 ||
        year > 2100
      ) {
        return res.status(400).json({
          message: 'Invalid year'
        })
      }

      const result = await pool.query(
        `WITH selected_period AS (
           SELECT MAKE_DATE($2, $3, 1)
             AS current_month
         ),

         category_list AS (
           SELECT DISTINCT category
           FROM expenses
           WHERE user_id = $1
         ),

         current_totals AS (
           SELECT
             category,
             SUM(amount)::NUMERIC AS total

           FROM expenses,
                selected_period

           WHERE user_id = $1

           AND expense_date >=
             current_month

           AND expense_date <
             current_month
             + INTERVAL '1 month'

           GROUP BY category
         ),

         previous_totals AS (
           SELECT
             category,
             SUM(amount)::NUMERIC AS total

           FROM expenses,
                selected_period

           WHERE user_id = $1

           AND expense_date >=
             current_month
             - INTERVAL '1 month'

           AND expense_date <
             current_month

           GROUP BY category
         )

         SELECT
           category_list.category,

           COALESCE(
             current_totals.total,
             0
           )::NUMERIC AS current_total,

           COALESCE(
             previous_totals.total,
             0
           )::NUMERIC AS previous_total

         FROM category_list

         LEFT JOIN current_totals
           ON current_totals.category =
              category_list.category

         LEFT JOIN previous_totals
           ON previous_totals.category =
              category_list.category

         ORDER BY
           current_total DESC`,
        [
          req.user.userId,
          year,
          month
        ]
      )

      res.json(result.rows)

    } catch (error) {
      console.error(
        'Error fetching category comparison:',
        error
      )

      res.status(500).json({
        message: 'Server error'
      })
    }
  }
)


// ======================================================
// SAVINGS GOALS
// ======================================================

// GET ALL SAVINGS GOALS
app.get(
  '/api/savings-goals',
  authenticateToken,
  async (req, res) => {
    try {
      const result = await pool.query(
        `SELECT *
         FROM savings_goals

         WHERE user_id = $1

         ORDER BY created_at DESC`,
        [req.user.userId]
      )

      res.json(result.rows)

    } catch (error) {
      console.error(
        'Error fetching savings goals:',
        error
      )

      res.status(500).json({
        message: 'Server error'
      })
    }
  }
)

// CREATE SAVINGS GOAL
app.post(
  '/api/savings-goals',
  authenticateToken,
  async (req, res) => {
    try {
      const {
        title,
        targetAmount,
        targetDate
      } = req.body

      const cleanTitle = title?.trim()
      const numericTarget =
        Number(targetAmount)

      if (
        !cleanTitle ||
        cleanTitle.length > 100
      ) {
        return res.status(400).json({
          message:
            'Goal title must be between 1 and 100 characters'
        })
      }

      if (
        !Number.isFinite(numericTarget) ||
        numericTarget <= 0
      ) {
        return res.status(400).json({
          message:
            'Target amount must be greater than 0'
        })
      }

      if (
        targetDate &&
        !isValidDateString(targetDate)
      ) {
        return res.status(400).json({
          message: 'Invalid target date'
        })
      }

      const result = await pool.query(
        `INSERT INTO savings_goals
           (
             user_id,
             title,
             target_amount,
             target_date
           )

         VALUES ($1, $2, $3, $4)

         RETURNING *`,
        [
          req.user.userId,
          cleanTitle,
          numericTarget,
          targetDate || null
        ]
      )

      res.status(201).json(
        result.rows[0]
      )

    } catch (error) {
      console.error(
        'Error creating savings goal:',
        error
      )

      res.status(500).json({
        message: 'Server error'
      })
    }
  }
)

// UPDATE SAVINGS GOAL
app.put(
  '/api/savings-goals/:id',
  authenticateToken,
  async (req, res) => {
    try {
      const id = Number(req.params.id)

      if (
        !Number.isInteger(id) ||
        id <= 0
      ) {
        return res.status(400).json({
          message:
            'Invalid savings goal ID'
        })
      }

      const {
        title,
        targetAmount,
        targetDate
      } = req.body

      const cleanTitle = title?.trim()
      const numericTarget =
        Number(targetAmount)

      if (
        !cleanTitle ||
        cleanTitle.length > 100
      ) {
        return res.status(400).json({
          message:
            'Goal title must be between 1 and 100 characters'
        })
      }

      if (
        !Number.isFinite(numericTarget) ||
        numericTarget <= 0
      ) {
        return res.status(400).json({
          message:
            'Target amount must be greater than 0'
        })
      }

      if (
        targetDate &&
        !isValidDateString(targetDate)
      ) {
        return res.status(400).json({
          message: 'Invalid target date'
        })
      }

      const result = await pool.query(
        `UPDATE savings_goals

         SET title = $1,
             target_amount = $2,
             target_date = $3

         WHERE id = $4
         AND user_id = $5

         RETURNING *`,
        [
          cleanTitle,
          numericTarget,
          targetDate || null,
          id,
          req.user.userId
        ]
      )

      if (result.rows.length === 0) {
        return res.status(404).json({
          message:
            'Savings goal not found'
        })
      }

      res.json(result.rows[0])

    } catch (error) {
      console.error(
        'Error updating savings goal:',
        error
      )

      res.status(500).json({
        message: 'Server error'
      })
    }
  }
)

// ADD MONEY TO SAVINGS GOAL
app.patch(
  '/api/savings-goals/:id/add',
  authenticateToken,
  async (req, res) => {
    try {
      const id = Number(req.params.id)
      const numericAmount =
        Number(req.body.amount)

      if (
        !Number.isInteger(id) ||
        id <= 0
      ) {
        return res.status(400).json({
          message:
            'Invalid savings goal ID'
        })
      }

      if (
        !Number.isFinite(numericAmount) ||
        numericAmount <= 0
      ) {
        return res.status(400).json({
          message:
            'Amount must be greater than 0'
        })
      }

      const result = await pool.query(
        `UPDATE savings_goals

         SET saved_amount =
           saved_amount + $1

         WHERE id = $2
         AND user_id = $3

         RETURNING *`,
        [
          numericAmount,
          id,
          req.user.userId
        ]
      )

      if (result.rows.length === 0) {
        return res.status(404).json({
          message:
            'Savings goal not found'
        })
      }

      res.json(result.rows[0])

    } catch (error) {
      console.error(
        'Error adding savings:',
        error
      )

      res.status(500).json({
        message: 'Server error'
      })
    }
  }
)

// DELETE SAVINGS GOAL
app.delete(
  '/api/savings-goals/:id',
  authenticateToken,
  async (req, res) => {
    try {
      const id = Number(req.params.id)

      if (
        !Number.isInteger(id) ||
        id <= 0
      ) {
        return res.status(400).json({
          message:
            'Invalid savings goal ID'
        })
      }

      const result = await pool.query(
        `DELETE FROM savings_goals

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
          message:
            'Savings goal not found'
        })
      }

      res.json({
        message:
          'Savings goal deleted successfully',
        goal: result.rows[0]
      })

    } catch (error) {
      console.error(
        'Error deleting savings goal:',
        error
      )

      res.status(500).json({
        message: 'Server error'
      })
    }
  }
)

// ======================================================
// RECURRING EXPENSES
// ======================================================

// GET ALL RECURRING EXPENSES
app.get(
  '/api/recurring-expenses',
  authenticateToken,
  async (req, res) => {
    try {
      const result = await pool.query(
        `SELECT *
         FROM recurring_expenses

         WHERE user_id = $1

         ORDER BY next_due_date ASC`,
        [req.user.userId]
      )

      res.json(result.rows)

    } catch (error) {
      console.error(
        'Error fetching recurring expenses:',
        error
      )

      res.status(500).json({
        message: 'Server error'
      })
    }
  }
)

// CREATE RECURRING EXPENSE
app.post(
  '/api/recurring-expenses',
  authenticateToken,
  async (req, res) => {
    try {
      const {
        title,
        category,
        amount,
        frequency,
        startDate
      } = req.body

      const cleanTitle = title?.trim()
      const numericAmount = Number(amount)

      if (
        !cleanTitle ||
        cleanTitle.length > 100
      ) {
        return res.status(400).json({
          message:
            'Recurring expense title must be between 1 and 100 characters'
        })
      }

      if (
        !allowedCategories.includes(category)
      ) {
        return res.status(400).json({
          message:
            'Invalid recurring expense category'
        })
      }

      if (
        !Number.isFinite(numericAmount) ||
        numericAmount <= 0
      ) {
        return res.status(400).json({
          message:
            'Amount must be greater than 0'
        })
      }

      if (
        !allowedFrequencies.includes(
          frequency
        )
      ) {
        return res.status(400).json({
          message:
            'Invalid recurring frequency'
        })
      }

      if (!isValidDateString(startDate)) {
        return res.status(400).json({
          message:
            'A valid start date is required'
        })
      }

      const result = await pool.query(
        `INSERT INTO recurring_expenses
           (
             user_id,
             title,
             category,
             amount,
             frequency,
             start_date,
             billing_day,
             next_due_date
           )

         VALUES (
           $1,
           $2,
           $3,
           $4,
           $5,
           $6,
           EXTRACT(
             DAY FROM $6::DATE
           )::INTEGER,
           $6
         )

         RETURNING *`,
        [
          req.user.userId,
          cleanTitle,
          category,
          numericAmount,
          frequency,
          startDate
        ]
      )

      res.status(201).json(
        result.rows[0]
      )

    } catch (error) {
      console.error(
        'Error creating recurring expense:',
        error
      )

      res.status(500).json({
        message: 'Server error'
      })
    }
  }
)

// UPDATE RECURRING EXPENSE
app.put(
  '/api/recurring-expenses/:id',
  authenticateToken,
  async (req, res) => {
    try {
      const id = Number(req.params.id)

      if (
        !Number.isInteger(id) ||
        id <= 0
      ) {
        return res.status(400).json({
          message:
            'Invalid recurring expense ID'
        })
      }

      const {
        title,
        category,
        amount,
        frequency,
        startDate
      } = req.body

      const cleanTitle = title?.trim()
      const numericAmount = Number(amount)

      if (
        !cleanTitle ||
        cleanTitle.length > 100
      ) {
        return res.status(400).json({
          message:
            'Recurring expense title must be between 1 and 100 characters'
        })
      }

      if (
        !allowedCategories.includes(category)
      ) {
        return res.status(400).json({
          message:
            'Invalid recurring expense category'
        })
      }

      if (
        !Number.isFinite(numericAmount) ||
        numericAmount <= 0
      ) {
        return res.status(400).json({
          message:
            'Amount must be greater than 0'
        })
      }

      if (
        !allowedFrequencies.includes(
          frequency
        )
      ) {
        return res.status(400).json({
          message:
            'Invalid recurring frequency'
        })
      }

      if (!isValidDateString(startDate)) {
        return res.status(400).json({
          message:
            'A valid start date is required'
        })
      }

      const result = await pool.query(
        `UPDATE recurring_expenses

         SET title = $1,
             category = $2,
             amount = $3,
             frequency = $4,
             start_date = $5,
             billing_day =
               EXTRACT(
                 DAY FROM $5::DATE
               )::INTEGER,
             next_due_date = $5

         WHERE id = $6
         AND user_id = $7

         RETURNING *`,
        [
          cleanTitle,
          category,
          numericAmount,
          frequency,
          startDate,
          id,
          req.user.userId
        ]
      )

      if (result.rows.length === 0) {
        return res.status(404).json({
          message:
            'Recurring expense not found'
        })
      }

      res.json(result.rows[0])

    } catch (error) {
      console.error(
        'Error updating recurring expense:',
        error
      )

      res.status(500).json({
        message: 'Server error'
      })
    }
  }
)

// DELETE RECURRING EXPENSE
app.delete(
  '/api/recurring-expenses/:id',
  authenticateToken,
  async (req, res) => {
    try {
      const id = Number(req.params.id)

      if (
        !Number.isInteger(id) ||
        id <= 0
      ) {
        return res.status(400).json({
          message:
            'Invalid recurring expense ID'
        })
      }

      const result = await pool.query(
        `DELETE FROM recurring_expenses

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
          message:
            'Recurring expense not found'
        })
      }

      res.json({
        message:
          'Recurring expense deleted successfully',

        recurringExpense:
          result.rows[0]
      })

    } catch (error) {
      console.error(
        'Error deleting recurring expense:',
        error
      )

      res.status(500).json({
        message: 'Server error'
      })
    }
  }
)

// ======================================================
// PROCESS DUE RECURRING EXPENSES
// ======================================================

app.post(
  '/api/recurring-expenses/process',
  authenticateToken,
  async (req, res) => {
    const client = await pool.connect()

    try {
      await client.query('BEGIN')

      const recurringResult =
        await client.query(
          `SELECT *
           FROM recurring_expenses

           WHERE user_id = $1
           AND active = TRUE
           AND next_due_date <= CURRENT_DATE

           ORDER BY next_due_date ASC

           FOR UPDATE`,
          [req.user.userId]
        )

      let generatedCount = 0

      for (
        const recurring
        of recurringResult.rows
      ) {
        let dueDate = new Date(
          `${recurring.next_due_date
            .toISOString()
            .split('T')[0]}T00:00:00Z`
        )

        const today = new Date()
        today.setUTCHours(0, 0, 0, 0)

        while (dueDate <= today) {
          const dueDateString =
            dueDate
              .toISOString()
              .split('T')[0]

          const insertResult =
            await client.query(
              `INSERT INTO expenses
                 (
                   user_id,
                   recurring_expense_id,
                   title,
                   category,
                   amount,
                   expense_date
                 )

               VALUES (
                 $1,
                 $2,
                 $3,
                 $4,
                 $5,
                 $6
               )

               ON CONFLICT (
                 recurring_expense_id,
                 expense_date
               )

               WHERE
                 recurring_expense_id
                 IS NOT NULL

               DO NOTHING

               RETURNING id`,
              [
                req.user.userId,
                recurring.id,
                recurring.title,
                recurring.category,
                recurring.amount,
                dueDateString
              ]
            )

          if (
            insertResult.rows.length > 0
          ) {
            generatedCount += 1
          }

          if (
            recurring.frequency ===
            'monthly'
          ) {
            const nextMonthFirstDay =
              new Date(
                Date.UTC(
                  dueDate.getUTCFullYear(),
                  dueDate.getUTCMonth() + 1,
                  1
                )
              )

            const lastDayOfNextMonth =
              new Date(
                Date.UTC(
                  nextMonthFirstDay
                    .getUTCFullYear(),

                  nextMonthFirstDay
                    .getUTCMonth() + 1,

                  0
                )
              ).getUTCDate()

            const safeDay = Math.min(
              recurring.billing_day,
              lastDayOfNextMonth
            )

            dueDate = new Date(
              Date.UTC(
                nextMonthFirstDay
                  .getUTCFullYear(),

                nextMonthFirstDay
                  .getUTCMonth(),

                safeDay
              )
            )

          } else {
            const targetYear =
              dueDate.getUTCFullYear() + 1

            const targetMonth =
              dueDate.getUTCMonth()

            const targetDay =
              recurring.billing_day

            const lastDayOfTargetMonth =
              new Date(
                Date.UTC(
                  targetYear,
                  targetMonth + 1,
                  0
                )
              ).getUTCDate()

            dueDate = new Date(
              Date.UTC(
                targetYear,
                targetMonth,
                Math.min(
                  targetDay,
                  lastDayOfTargetMonth
                )
              )
            )
          }
        }

        const nextDueDate =
          dueDate
            .toISOString()
            .split('T')[0]

        await client.query(
          `UPDATE recurring_expenses

           SET next_due_date = $1

           WHERE id = $2
           AND user_id = $3`,
          [
            nextDueDate,
            recurring.id,
            req.user.userId
          ]
        )
      }

      await client.query('COMMIT')

      res.json({
        message:
          'Recurring expenses processed successfully',
        generatedCount
      })

    } catch (error) {
      await client.query('ROLLBACK')

      console.error(
        'Error processing recurring expenses:',
        error
      )

      res.status(500).json({
        message: 'Server error'
      })

    } finally {
      client.release()
    }
  }
)

// ======================================================
// START SERVER
// ======================================================

app.listen(PORT, () => {
  console.log(
    `Server running on port ${PORT}`
  )
})
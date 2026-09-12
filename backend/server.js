require('dotenv').config()
const express = require('express')
const cors = require('cors')


const { Pool } = require('pg')


const bcrypt = require('bcrypt')
const jwt = require('jsonwebtoken')


const app = express()

const allowedOrigins = [
  'http://localhost:5173',
  'https://spendwise-woml.onrender.com'
]

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


app.use(express.json())

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,

  ssl:
    process.env.NODE_ENV === 'production'
      ? { rejectUnauthorized: false }
      : false
})

pool.query('SELECT NOW()', (error, result) => {
  if (error) {
    console.error('Database connection error:', error)
  } else {
    console.log('Database connected successfully')
  }
})

const PORT = process.env.PORT || 5001
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


// GET 6-MONTH SPENDING TREND
app.get(
  '/api/analytics/trend',
  authenticateToken,
  async (req, res) => {
    try {
      const month = Number(req.query.month)
      const year = Number(req.query.year)

      if (
        !month ||
        !year ||
        month < 1 ||
        month > 12
      ) {
        return res.status(400).json({
          message: 'Valid month and year are required'
        })
      }

      const result = await pool.query(
  `WITH selected_period AS (
     SELECT MAKE_DATE($2, $3, 1) AS selected_month
   ),

   months AS (
     SELECT generate_series(
       selected_month - INTERVAL '5 months',
       selected_month,
       INTERVAL '1 month'
     )::DATE AS month_start

     FROM selected_period
   ),

   monthly_spending AS (
     SELECT
       DATE_TRUNC('month', expense_date)::DATE AS month_start,
       SUM(amount)::NUMERIC AS total

     FROM expenses

     WHERE user_id = $1

     GROUP BY
       DATE_TRUNC('month', expense_date)
   )

   SELECT
     EXTRACT(YEAR FROM months.month_start)::INTEGER AS year,
     EXTRACT(MONTH FROM months.month_start)::INTEGER AS month,

     COALESCE(
       monthly_spending.total,
       0
     )::NUMERIC AS total

   FROM months

   LEFT JOIN monthly_spending
     ON monthly_spending.month_start =
        months.month_start

   ORDER BY months.month_start ASC`,
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
      console.error('Error fetching savings goals:', error)

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

      if (!title || !targetAmount) {
        return res.status(400).json({
          message: 'Title and target amount are required'
        })
      }

      if (Number(targetAmount) <= 0) {
        return res.status(400).json({
          message: 'Target amount must be greater than 0'
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
          title.trim(),
          Number(targetAmount),
          targetDate || null
        ]
      )

      res.status(201).json(result.rows[0])

    } catch (error) {
      console.error('Error creating savings goal:', error)

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

      const {
        title,
        targetAmount,
        targetDate
      } = req.body

      if (!Number.isInteger(id) || id <= 0) {
        return res.status(400).json({
          message: 'Invalid savings goal ID'
        })
      }

      if (!title || !targetAmount) {
        return res.status(400).json({
          message: 'Title and target amount are required'
        })
      }

      if (Number(targetAmount) <= 0) {
        return res.status(400).json({
          message: 'Target amount must be greater than 0'
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
          title.trim(),
          Number(targetAmount),
          targetDate || null,
          id,
          req.user.userId
        ]
      )

      if (result.rows.length === 0) {
        return res.status(404).json({
          message: 'Savings goal not found'
        })
      }

      res.json(result.rows[0])

    } catch (error) {
      console.error('Error updating savings goal:', error)

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
      const { amount } = req.body

      if (!Number.isInteger(id) || id <= 0) {
        return res.status(400).json({
          message: 'Invalid savings goal ID'
        })
      }

      if (!amount || Number(amount) <= 0) {
        return res.status(400).json({
          message: 'Amount must be greater than 0'
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
          Number(amount),
          id,
          req.user.userId
        ]
      )

      if (result.rows.length === 0) {
        return res.status(404).json({
          message: 'Savings goal not found'
        })
      }

      res.json(result.rows[0])

    } catch (error) {
      console.error('Error adding savings:', error)

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

      if (!Number.isInteger(id) || id <= 0) {
        return res.status(400).json({
          message: 'Invalid savings goal ID'
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
          message: 'Savings goal not found'
        })
      }

      res.json({
        message: 'Savings goal deleted successfully',
        goal: result.rows[0]
      })

    } catch (error) {
      console.error('Error deleting savings goal:', error)

      res.status(500).json({
        message: 'Server error'
      })
    }
  }
)


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

      if (
        !title ||
        !category ||
        !amount ||
        !frequency ||
        !startDate
      ) {
        return res.status(400).json({
          message:
            'Title, category, amount, frequency and start date are required'
        })
      }

      if (Number(amount) <= 0) {
        return res.status(400).json({
          message: 'Amount must be greater than 0'
        })
      }

      if (
        frequency !== 'monthly' &&
        frequency !== 'yearly'
      ) {
        return res.status(400).json({
          message: 'Invalid recurring frequency'
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
           EXTRACT(DAY FROM $6::DATE)::INTEGER,
           $6
         )

         RETURNING *`,
        [
          req.user.userId,
          title.trim(),
          category,
          Number(amount),
          frequency,
          startDate
        ]
      )

      res.status(201).json(result.rows[0])

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

      const {
        title,
        category,
        amount,
        frequency,
        startDate
      } = req.body

      if (!Number.isInteger(id) || id <= 0) {
        return res.status(400).json({
          message: 'Invalid recurring expense ID'
        })
      }

      if (
        !title ||
        !category ||
        !amount ||
        !frequency ||
        !startDate
      ) {
        return res.status(400).json({
          message:
            'Title, category, amount, frequency and start date are required'
        })
      }

      if (Number(amount) <= 0) {
        return res.status(400).json({
          message: 'Amount must be greater than 0'
        })
      }

      if (
        frequency !== 'monthly' &&
        frequency !== 'yearly'
      ) {
        return res.status(400).json({
          message: 'Invalid recurring frequency'
        })
      }

      const result = await pool.query(
        `UPDATE recurring_expenses

         SSET title = $1,
    category = $2,
    amount = $3,
    frequency = $4,
    start_date = $5,
    billing_day =
      EXTRACT(DAY FROM $5::DATE)::INTEGER,
    next_due_date = $5

         WHERE id = $6
         AND user_id = $7

         RETURNING *`,
        [
          title.trim(),
          category,
          Number(amount),
          frequency,
          startDate,
          id,
          req.user.userId
        ]
      )

      if (result.rows.length === 0) {
        return res.status(404).json({
          message: 'Recurring expense not found'
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

      if (!Number.isInteger(id) || id <= 0) {
        return res.status(400).json({
          message: 'Invalid recurring expense ID'
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
          message: 'Recurring expense not found'
        })
      }

      res.json({
        message:
          'Recurring expense deleted successfully',
        recurringExpense: result.rows[0]
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

// PROCESS DUE RECURRING EXPENSES
app.post(
  '/api/recurring-expenses/process',
  authenticateToken,
  async (req, res) => {

    const client = await pool.connect()

    try {
      await client.query('BEGIN')

      const recurringResult = await client.query(
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

      for (const recurring of recurringResult.rows) {

        let dueDate = new Date(
          `${recurring.next_due_date
            .toISOString()
            .split('T')[0]}T00:00:00Z`
        )

        const today = new Date()

        today.setUTCHours(0, 0, 0, 0)

        while (dueDate <= today) {

          const dueDateString =
            dueDate.toISOString().split('T')[0]

          const insertResult = await client.query(
            `INSERT INTO expenses
             (
               user_id,
               recurring_expense_id,
               title,
               category,
               amount,
               expense_date
             )

             VALUES ($1, $2, $3, $4, $5, $6)

             ON CONFLICT (
               recurring_expense_id,
               expense_date
             )
             WHERE recurring_expense_id IS NOT NULL

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

        if (recurring.frequency === 'monthly') {

  const nextMonthFirstDay = new Date(
    Date.UTC(
      dueDate.getUTCFullYear(),
      dueDate.getUTCMonth() + 1,
      1
    )
  )

  const lastDayOfNextMonth =
    new Date(
      Date.UTC(
        nextMonthFirstDay.getUTCFullYear(),
        nextMonthFirstDay.getUTCMonth() + 1,
        0
      )
    ).getUTCDate()

  const safeDay = Math.min(
    recurring.billing_day,
    lastDayOfNextMonth
  )

  dueDate = new Date(
    Date.UTC(
      nextMonthFirstDay.getUTCFullYear(),
      nextMonthFirstDay.getUTCMonth(),
      safeDay
    )
  )

} else {

  dueDate.setUTCFullYear(
    dueDate.getUTCFullYear() + 1
  )

}
        }

        const nextDueDate =
          dueDate.toISOString().split('T')[0]

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
        message: 'Recurring expenses processed successfully',
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

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`)
})
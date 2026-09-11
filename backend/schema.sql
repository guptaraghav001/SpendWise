CREATE TABLE IF NOT EXISTS users (
  id SERIAL PRIMARY KEY,
  name VARCHAR(100) NOT NULL,
  email VARCHAR(255) UNIQUE NOT NULL,
  password VARCHAR(255) NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);


CREATE TABLE IF NOT EXISTS expenses (
  id SERIAL PRIMARY KEY,
  user_id INTEGER NOT NULL,
  title VARCHAR(100) NOT NULL,
  category VARCHAR(50) NOT NULL,

  amount DECIMAL(10, 2) NOT NULL
    CHECK (amount > 0),

  expense_date DATE NOT NULL
    DEFAULT CURRENT_DATE,

  created_at TIMESTAMP
    DEFAULT CURRENT_TIMESTAMP,

  CONSTRAINT fk_expense_user
    FOREIGN KEY (user_id)
    REFERENCES users(id)
    ON DELETE CASCADE
);


CREATE TABLE IF NOT EXISTS budgets (
  id SERIAL PRIMARY KEY,
  user_id INTEGER NOT NULL,

  amount DECIMAL(10, 2) NOT NULL
    CHECK (amount > 0),

  month INTEGER NOT NULL
    CHECK (month BETWEEN 1 AND 12),

  year INTEGER NOT NULL,

  created_at TIMESTAMP
    DEFAULT CURRENT_TIMESTAMP,

  CONSTRAINT fk_budget_user
    FOREIGN KEY (user_id)
    REFERENCES users(id)
    ON DELETE CASCADE,

  CONSTRAINT unique_user_month_budget
    UNIQUE (user_id, month, year)
)


;

CREATE TABLE IF NOT EXISTS savings_goals (
  id SERIAL PRIMARY KEY,

  user_id INTEGER NOT NULL,

  title VARCHAR(100) NOT NULL,

  target_amount DECIMAL(10, 2) NOT NULL
    CHECK (target_amount > 0),

  saved_amount DECIMAL(10, 2) NOT NULL
    DEFAULT 0
    CHECK (saved_amount >= 0),

  target_date DATE,

  created_at TIMESTAMP
    DEFAULT CURRENT_TIMESTAMP,

  CONSTRAINT fk_savings_goal_user
    FOREIGN KEY (user_id)
    REFERENCES users(id)
    ON DELETE CASCADE
);
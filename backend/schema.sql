CREATE TABLE users (
  id INT IDENTITY(1,1) PRIMARY KEY,
  name VARCHAR(100) NOT NULL,
  email VARCHAR(255) NOT NULL UNIQUE,
  password VARCHAR(255) NOT NULL,
  created_at DATETIME2 DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE expenses (
  id INT IDENTITY(1,1) PRIMARY KEY,
  user_id INT NOT NULL,
  title VARCHAR(100) NOT NULL,
  category VARCHAR(50) NOT NULL,
  amount DECIMAL(10, 2) NOT NULL
    CHECK (amount > 0),
  expense_date DATE NOT NULL
    DEFAULT CAST(GETDATE() AS DATE),
  created_at DATETIME2
    DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT fk_expense_user
    FOREIGN KEY (user_id)
    REFERENCES users(id)
    ON DELETE CASCADE
);

CREATE TABLE budgets (
  id INT IDENTITY(1,1) PRIMARY KEY,
  user_id INT NOT NULL,
  amount DECIMAL(10, 2) NOT NULL
    CHECK (amount > 0),
  month INT NOT NULL
    CHECK (month BETWEEN 1 AND 12),
  year INT NOT NULL,
  created_at DATETIME2
    DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT fk_budget_user
    FOREIGN KEY (user_id)
    REFERENCES users(id)
    ON DELETE CASCADE,
  CONSTRAINT unique_user_month_budget
    UNIQUE (user_id, month, year)
);
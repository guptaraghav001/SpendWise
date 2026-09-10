# SpendWise

SpendWise is a full-stack personal expense tracking and monthly budget
management application built with React, Node.js, Express, and PostgreSQL.

It allows users to securely manage expenses, create month-specific budgets,
navigate financial history, and analyze spending patterns through interactive
category analytics.

## Live Application

**Live Demo:** https://spendwise-woml.onrender.com

> Note: The backend is hosted on a free Render instance. The first request
> after a period of inactivity may take a short time while the service starts.

## Preview

![SpendWise Dashboard](docs/screenshots/dashboard.png)

---

## Features

### Authentication
- User registration and login
- Password hashing using bcrypt
- JWT-based authentication
- Protected API routes
- User-specific financial data
- Persistent login and logout

### Expense Management
- Add expenses
- Edit expenses
- Delete expenses
- Categorize expenses
- Record expense dates
- View expenses month-by-month

### Budget Management
- Set monthly budgets
- Separate budget for each month
- Calculate total monthly spending
- Calculate remaining budget
- Budget utilization percentage

### Analytics
- Spending totals by category
- Category spending percentages
- Interactive bar chart
- Month-specific analytics

---

## Technology Stack

### Frontend
- React
- JavaScript
- Vite
- CSS
- Recharts

## Production Architecture

```text
                    User
                     |
                     v
              React + Vite
            Render Static Site
                     |
                HTTPS / JSON
                     |
                     v
             Node.js + Express
            Render Web Service
                     |
                 SQL / SSL
                     |
                     v
              Neon PostgreSQL
                     |
          +----------+----------+
          |          |          |
        users     expenses    budgets




### Backend
- Node.js
- Express.js
- REST API

### Database
- PostgreSQL

### Authentication & Security
- bcrypt
- JSON Web Token (JWT)
- Protected API endpoints
- User-based authorization

## Security
SpendWise implements:

- bcrypt password hashing
- JWT-based authentication
- Protected backend API routes
- User-specific authorization
- Backend input validation
- PostgreSQL constraints
- CORS restrictions
- Environment variables for secrets and deployment configuration

Sensitive values such as database credentials and JWT secrets are excluded
from version control.

For a larger production system, authentication could be further hardened
using secure HttpOnly cookies, refresh-token handling, rate limiting, and
additional CSRF/XSS protections.

---

## System Architecture

```text
                    USER
                     |
                     v
               React Frontend
                     |
                     | HTTP / JSON
                     | REST API
                     v
              Node.js + Express
                     |
                     | SQL
                     v
                PostgreSQL


 ## Using SpendWise

1. Open the live application.
2. Create a new account.
3. Log in securely.
4. Set a budget for the selected month.
5. Add expenses with a title, amount, category, and date.
6. Navigate between months using the month selector.
7. Edit or delete existing expenses.
8. Review total spending, remaining budget, and category analytics.
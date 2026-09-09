# SpendWise

SpendWise is a full-stack personal expense tracking and monthly budget
management application.

It allows users to securely create accounts, manage their expenses,
set monthly budgets, navigate between months, and analyze spending
patterns through category-based analytics and charts.

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
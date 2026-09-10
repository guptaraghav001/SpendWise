import { useEffect, useState } from 'react'
import {BarChart,Bar,XAxis,YAxis,Tooltip,ResponsiveContainer} from 'recharts'
import DashboardHeader from '../components/DashboardHeader.jsx'

import API_URL from '../config/api.js'

function DashboardPage({ onLogout }) {
const [budget, setBudget] = useState(0)
const [budgetInput, setBudgetInput] = useState('')

const today = new Date()

const [selectedMonth, setSelectedMonth] = useState(
  today.getMonth() + 1
)

const [selectedYear, setSelectedYear] = useState(
  today.getFullYear()
)
    // Get the logged-in user's information
  const storedUser = localStorage.getItem('user')
  const user = storedUser ? JSON.parse(storedUser) : null
  const [showForm, setShowForm] = useState(false)
  const [title, setTitle] = useState('')
  const [amount, setAmount] = useState('')
  const [category, setCategory] = useState('Food')
  const [expenseDate, setExpenseDate] = useState(
  new Date().toISOString().split('T')[0]
)
const [editingId, setEditingId] = useState(null)

  const [expenses, setExpenses] = useState([])

  const [loading, setLoading] = useState(true)
const [error, setError] = useState('')


  
useEffect(() => {
  const token = localStorage.getItem('token')

  setLoading(true)
  setError('')

  fetch(
    `${API_URL}/api/expenses?month=${selectedMonth}&year=${selectedYear}`,
    {
      headers: {
        Authorization: `Bearer ${token}`
      }
    }
  )
    .then(async (response) => {
      if (response.status === 401 || response.status === 403) {
        localStorage.removeItem('token')
        localStorage.removeItem('user')

        onLogout()

        throw new Error('Your session has expired')
      }

      if (!response.ok) {
        throw new Error('Failed to load expenses')
      }

      return response.json()
    })
    .then((data) => {
      setExpenses(data)
    })
    .catch((error) => {
      if (error.message !== 'Your session has expired') {
        setError(error.message)
      }
    })
    .finally(() => {
      setLoading(false)
    })

}, [selectedMonth, selectedYear, onLogout])


useEffect(() => {
  const token = localStorage.getItem('token')

  fetch(
    `${API_URL}/api/budget?month=${selectedMonth}&year=${selectedYear}`,
    {
      headers: {
        Authorization: `Bearer ${token}`
      }
    }
  )
    .then((response) => {
      if (!response.ok) {
        throw new Error('Failed to fetch budget')
      }

      return response.json()
    })
    .then((data) => {
      setBudget(Number(data.amount) || 0)
    })
    .catch((error) => {
      console.error('Error fetching budget:', error)
      setBudget(0)
    })

}, [selectedMonth, selectedYear])

      const spent = expenses.reduce(
  (total, expense) => total + Number(expense.amount),
  0

)

  const remaining = budget - spent

  const budgetUsedPercentage =
  budget > 0
    ? Math.min((spent / budget) * 100, 100)
    : 0


const categoryTotals = expenses.reduce(
  (totals, expense) => {

    const category = expense.category
    const amount = Number(expense.amount)

    if (!totals[category]) {
      totals[category] = 0
    }

    totals[category] += amount

    return totals
  },
  {}
)

const chartData = Object.entries(categoryTotals).map(
  ([category, amount]) => ({
    category: category,
    amount: amount
  })
)


const largestExpense =
  expenses.length > 0
    ? expenses.reduce((largest, expense) =>
        Number(expense.amount) > Number(largest.amount)
          ? expense
          : largest
      )
    : null

    const averageExpense =
  expenses.length > 0
    ? spent / expenses.length
    : 0


    const topCategory =
  Object.entries(categoryTotals).length > 0
    ? Object.entries(categoryTotals).reduce(
        (highest, current) =>
          current[1] > highest[1]
            ? current
            : highest
      )
    : null



const handleAddExpense = () => {

  if (!title || !amount || !expenseDate) {
  alert('Please enter title, amount and date')
  return
}

  if (Number(amount) <= 0) {
    alert('Amount must be greater than 0')
    return
  }

  const newExpense = {
  title: title,
  category: category,
  amount: Number(amount),
  expenseDate: expenseDate
}

  const token = localStorage.getItem('token')

fetch(`${API_URL}/api/expenses`, {
  method: 'POST',

  headers: {
    'Content-Type': 'application/json',
    Authorization: `Bearer ${token}`
  },

    body: JSON.stringify(newExpense)
  })
    .then((response) => response.json())
    .then((createdExpense) => {

const createdDate = new Date(
  createdExpense.expense_date
)

const createdMonth = createdDate.getUTCMonth() + 1
const createdYear = createdDate.getUTCFullYear()

if (
  createdMonth === selectedMonth &&
  createdYear === selectedYear
) {
  setExpenses([...expenses, createdExpense])
}
      setTitle('')
      setAmount('')
      setCategory('Food')
      setExpenseDate(
  new Date().toISOString().split('T')[0]
)
      setEditingId(null)
      setShowForm(false)
    })
    .catch((error) => {
      console.error('Error adding expense:', error)
    })
}
const handleDeleteExpense = (id) => {

  const confirmDelete = window.confirm(
    'Are you sure you want to delete this expense?'
  )

  if (!confirmDelete) {
    return
  }
const token = localStorage.getItem('token')
  fetch(`${API_URL}/api/expenses/${id}`, {
    method: 'DELETE',
    headers: {
      Authorization: `Bearer ${token}`
    }
  })
    .then((response) => {

      if (!response.ok) {
        throw new Error('Failed to delete expense')
      }

      return response.json()
    })
    .then(() => {

      const updatedExpenses = expenses.filter(
        (expense) => expense.id !== id
      )

      setExpenses(updatedExpenses)
    })
    .catch((error) => {
      console.error('Error deleting expense:', error)
    })
}

const handleEditExpense = (expense) => {
  setEditingId(expense.id)

  setTitle(expense.title)
  setAmount(expense.amount)
  setCategory(expense.category)

  setExpenseDate(
  expense.expense_date.split('T')[0]
)

  setShowForm(true)
}

const handleUpdateExpense = () => {

  if (!title || !amount || !expenseDate) {
  alert('Please enter title, amount and date')
  return
}

  if (Number(amount) <= 0) {
    alert('Amount must be greater than 0')
    return
  }

  const updatedData = {
  title: title,
  category: category,
  amount: Number(amount),
  expenseDate: expenseDate
}


const token = localStorage.getItem('token')

  fetch(`${API_URL}/api/expenses/${editingId}`, {
    method: 'PUT',

    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`
    },

    body: JSON.stringify(updatedData)
  })
    .then((response) => {

      if (!response.ok) {
        throw new Error('Failed to update expense')
      }

      return response.json()
    })
    .then((updatedExpense) => {

      const updatedExpenses = expenses.map((expense) =>
        expense.id === editingId
          ? updatedExpense
          : expense
      )

      setExpenses(updatedExpenses)

      setEditingId(null)
      setTitle('')
      setAmount('')
      setCategory('Food')
      setExpenseDate(
  new Date().toISOString().split('T')[0]
)
      setShowForm(false)
    })
    .catch((error) => {
      console.error('Error updating expense:', error)
    })
}

const handleLogout = () => {
  localStorage.removeItem('token')
  localStorage.removeItem('user')

  onLogout()
}

const handleSaveBudget = () => {
  if (!budgetInput) {
    alert('Please enter a budget amount')
    return
  }

  if (Number(budgetInput) <= 0) {
    alert('Budget amount must be greater than 0')
    return
  }

  const token = localStorage.getItem('token')

  fetch(`${API_URL}/api/budget`, {
    method: 'PUT',

    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`
    },

    body: JSON.stringify({
      amount: Number(budgetInput),
      month: selectedMonth,
      year: selectedYear
    })
  })
    .then((response) => {

      if (!response.ok) {
        throw new Error('Failed to save budget')
      }

      return response.json()
    })
    .then((data) => {

setBudget(Number(data.amount) || 0)      
setBudgetInput('')

    })
    .catch((error) => {

      console.error('Error saving budget:', error)

    })
}

const handlePreviousMonth = () => {
  if (selectedMonth === 1) {
    setSelectedMonth(12)
    setSelectedYear(selectedYear - 1)
  } else {
    setSelectedMonth(selectedMonth - 1)
  }
}

const handleNextMonth = () => {
  if (selectedMonth === 12) {
    setSelectedMonth(1)
    setSelectedYear(selectedYear + 1)
  } else {
    setSelectedMonth(selectedMonth + 1)
  }
}

const monthNames = [
  'January',
  'February',
  'March',
  'April',
  'May',
  'June',
  'July',
  'August',
  'September',
  'October',
  'November',
  'December'
]


const formatCurrency = (value) => {
  return Number(value).toLocaleString('en-IN')
}


  return (

    <div className="dashboard">
<DashboardHeader
  user={user}
  selectedMonth={selectedMonth}
  selectedYear={selectedYear}
  monthNames={monthNames}
  onPreviousMonth={handlePreviousMonth}
  onNextMonth={handleNextMonth}
  onLogout={handleLogout}
/>

      <div className="summary">

       <div className="summary-card">

  <p>Monthly Budget</p>

  <h2>₹{budget}</h2>
<div className="budget-progress">

  <div
    className="budget-progress-fill"
    style={{
      width: `${budgetUsedPercentage}%`
    }}
  />

</div>

<p>
  {budget > 0
    ? `${((spent / budget) * 100).toFixed(1)}% used`
    : 'No budget set'}
</p>


  <input
    type="number"
    placeholder="Set budget"
    value={budgetInput}
    onChange={(event) =>
      setBudgetInput(event.target.value)
    }
  />

  <button onClick={handleSaveBudget}>
    Save Budget
  </button>

</div>

        <div className="summary-card">
          <p>Total Spent</p>
          <h2>₹{spent}</h2>
        </div>

        <div className="summary-card">
          <p>Remaining</p>
          <h2>₹{remaining}</h2>
        </div>

      </div>

      <div className="transactions">

        <div className="transactions-header">

          {loading && (
  <p>Loading expenses...</p>
)}

{error && (
  <p className="error-message">
    {error}
  </p>
)}

          <h2>Recent Expenses</h2>
<button onClick={() => setShowForm(true)}>
  + Add Expense
</button>       
 </div>


{showForm && (
  <div className="expense-form">

    <input
      type="text"
      placeholder="Expense title"
      value={title}
      onChange={(event) => setTitle(event.target.value)}
    />

    <input
      type="number"
      placeholder="Amount"
      value={amount}
      onChange={(event) => setAmount(event.target.value)}
    />

<input
  type="date"
  value={expenseDate}
  onChange={(event) =>
    setExpenseDate(event.target.value)
  }
/>

    <select
      value={category}
      onChange={(event) => setCategory(event.target.value)}
    >
      <option>Food</option>
      <option>Travel</option>
      <option>Shopping</option>
      <option>Bills</option>
      <option>Other</option>
    </select>

<button
  onClick={
    editingId
      ? handleUpdateExpense
      : handleAddExpense
  }
>
  {editingId ? 'Update Expense' : 'Add Expense'}
</button>
  </div>
)}

{!loading && !error && expenses.length === 0 && (
  <p>No expenses recorded for this month.</p>
)}

       {expenses.map((expense) => (
  <div className="transaction" key={expense.id}>

    <div>
  <strong>{expense.title}</strong>

  <p>{expense.category}</p>

  <small>
  {new Date(expense.expense_date).toLocaleDateString(
    'en-IN',
    {
      day: '2-digit',
      month: 'short',
      year: 'numeric'
    }
  )}
</small>


</div>

    <div>
      <strong>₹{expense.amount}</strong>

<button
  onClick={() => handleEditExpense(expense)}
>
  Edit
</button>

      <button
        onClick={() => handleDeleteExpense(expense.id)}
      >
        Delete
      </button>
    </div>

  </div>
))}

</div>



<div className="analytics-summary">

  <div className="analytics-card">
    <p>Top Category</p>

    <h3>
      {topCategory
        ? topCategory[0]
        : 'No data'}
    </h3>

    {topCategory && (
      <span>
        ₹{formatCurrency(topCategory[1])}
      </span>
    )}
  </div>


  <div className="analytics-card">
    <p>Largest Expense</p>

    <h3>
      {largestExpense
        ? largestExpense.title
        : 'No data'}
    </h3>

    {largestExpense && (
      <span>
        ₹{formatCurrency(largestExpense.amount)}
      </span>
    )}
  </div>


  <div className="analytics-card">
    <p>Average Expense</p>

    <h3>
      ₹{formatCurrency(
        averageExpense.toFixed(0)
      )}
    </h3>

    <span>
      {expenses.length} transactions
    </span>
  </div>

</div>


<div className="analytics">

  <h2>Spending by Category</h2>

{chartData.length > 0 && (

  <div className="chart-container">

    <ResponsiveContainer
      width="100%"
      height={300}
    >

      <BarChart data={chartData}>

        <XAxis
          dataKey="category"
        />

        <YAxis />

        <Tooltip />

        <Bar
          dataKey="amount"
          fill="#646cff"
        />

      </BarChart>

    </ResponsiveContainer>

  </div>

)}


  {Object.entries(categoryTotals).length === 0 ? (
    <p>No spending data for this month.</p>
  ) : (
    Object.entries(categoryTotals).map(([category, amount]) => {
      const percentage =
        spent > 0
          ? ((amount / spent) * 100).toFixed(1)
          : 0

      return (
        <div className="category-row" key={category}>
          <span>{category}</span>

          <span>
            ₹{amount.toFixed(2)}
          </span>

          <strong>
            {percentage}%
          </strong>
        </div>
      )
    })
  )}

</div>

      </div>
    
  )
}

export default DashboardPage
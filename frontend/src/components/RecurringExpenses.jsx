import { useEffect, useState } from 'react'
import API_URL from '../config/api.js'

function RecurringExpenses() {
  const [recurringExpenses, setRecurringExpenses] = useState([])

  const [showForm, setShowForm] = useState(false)
  const [editingId, setEditingId] = useState(null)

  const [title, setTitle] = useState('')
  const [category, setCategory] = useState('Bills')
  const [amount, setAmount] = useState('')
  const [frequency, setFrequency] = useState('monthly')
  const [startDate, setStartDate] = useState('')

  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    const token = localStorage.getItem('token')

    fetch(`${API_URL}/api/recurring-expenses`, {
      headers: {
        Authorization: `Bearer ${token}`
      }
    })
      .then((response) => {
        if (!response.ok) {
          throw new Error('Failed to load recurring expenses')
        }

        return response.json()
      })
      .then((data) => {
        setRecurringExpenses(data)
      })
      .catch((error) => {
        setError(error.message)
      })
      .finally(() => {
        setLoading(false)
      })
  }, [])

  const resetForm = () => {
    setTitle('')
    setCategory('Bills')
    setAmount('')
    setFrequency('monthly')
    setStartDate('')
    setEditingId(null)
    setShowForm(false)
  }

  const handleSave = () => {
    if (!title || !amount || !startDate) {
      alert('Please complete all required fields')
      return
    }

    if (Number(amount) <= 0) {
      alert('Amount must be greater than 0')
      return
    }

    const token = localStorage.getItem('token')

    const recurringData = {
      title,
      category,
      amount: Number(amount),
      frequency,
      startDate
    }

    const url = editingId
      ? `${API_URL}/api/recurring-expenses/${editingId}`
      : `${API_URL}/api/recurring-expenses`

    fetch(url, {
      method: editingId ? 'PUT' : 'POST',

      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`
      },

      body: JSON.stringify(recurringData)
    })
      .then((response) => {
        if (!response.ok) {
          throw new Error(
            editingId
              ? 'Failed to update recurring expense'
              : 'Failed to create recurring expense'
          )
        }

        return response.json()
      })
      .then((savedExpense) => {
        if (editingId) {
          setRecurringExpenses((current) =>
            current.map((expense) =>
              expense.id === editingId
                ? savedExpense
                : expense
            )
          )
        } else {
          setRecurringExpenses((current) => [
            ...current,
            savedExpense
          ])
        }

        resetForm()
      })
      .catch((error) => {
        setError(error.message)
      })
  }

  const handleEdit = (expense) => {
    setEditingId(expense.id)

    setTitle(expense.title)
    setCategory(expense.category)
    setAmount(expense.amount)
    setFrequency(expense.frequency)

    setStartDate(
      expense.start_date
        ? expense.start_date.split('T')[0]
        : ''
    )

    setShowForm(true)
  }

  const handleDelete = (id) => {
    const confirmed = window.confirm(
      'Delete this recurring expense?'
    )

    if (!confirmed) {
      return
    }

    const token = localStorage.getItem('token')

    fetch(`${API_URL}/api/recurring-expenses/${id}`, {
      method: 'DELETE',

      headers: {
        Authorization: `Bearer ${token}`
      }
    })
      .then((response) => {
        if (!response.ok) {
          throw new Error('Failed to delete recurring expense')
        }

        return response.json()
      })
      .then(() => {
        setRecurringExpenses((current) =>
          current.filter(
            (expense) => expense.id !== id
          )
        )
      })
      .catch((error) => {
        setError(error.message)
      })
  }

  const formatCurrency = (value) =>
    Number(value).toLocaleString('en-IN')

  return (
    <div className="recurring-section">

      <div className="recurring-header">
        <div>
          <h2>Recurring Expenses</h2>
          <p>
            Manage expenses that repeat automatically.
          </p>
        </div>

        <button
          onClick={() => {
            if (showForm) {
              resetForm()
            } else {
              setShowForm(true)
            }
          }}
        >
          {showForm ? 'Cancel' : '+ New Recurring'}
        </button>
      </div>

      {showForm && (
        <div className="recurring-form">

          <input
            type="text"
            placeholder="Expense title"
            value={title}
            onChange={(event) =>
              setTitle(event.target.value)
            }
          />

          <input
            type="number"
            placeholder="Amount"
            value={amount}
            onChange={(event) =>
              setAmount(event.target.value)
            }
          />

          <select
            value={category}
            onChange={(event) =>
              setCategory(event.target.value)
            }
          >
            <option>Food</option>
            <option>Travel</option>
            <option>Shopping</option>
            <option>Bills</option>
            <option>Other</option>
          </select>

          <select
            value={frequency}
            onChange={(event) =>
              setFrequency(event.target.value)
            }
          >
            <option value="monthly">Monthly</option>
            <option value="yearly">Yearly</option>
          </select>

          <input
            type="date"
            value={startDate}
            onChange={(event) =>
              setStartDate(event.target.value)
            }
          />

          <button onClick={handleSave}>
            {editingId
              ? 'Update Recurring'
              : 'Create Recurring'}
          </button>

        </div>
      )}

      {loading && (
        <p>Loading recurring expenses...</p>
      )}

      {error && (
        <p className="error-message">{error}</p>
      )}

      {!loading &&
        !error &&
        recurringExpenses.length === 0 && (
          <p>No recurring expenses yet.</p>
        )}

      <div className="recurring-grid">

        {recurringExpenses.map((expense) => (

          <div
            className="recurring-card"
            key={expense.id}
          >

            <div className="recurring-card-header">
              <h3>{expense.title}</h3>

              <strong>
                ₹{formatCurrency(expense.amount)}
              </strong>
            </div>

            <p>
              {expense.category}
              {' • '}
              {expense.frequency === 'monthly'
                ? 'Monthly'
                : 'Yearly'}
            </p>

            <small>
              Next due:{' '}
              {new Date(
                expense.next_due_date
              ).toLocaleDateString(
                'en-IN',
                {
                  day: '2-digit',
                  month: 'short',
                  year: 'numeric'
                }
              )}
            </small>

            <div className="recurring-actions">

              <button
                onClick={() => handleEdit(expense)}
              >
                Edit
              </button>

              <button
                onClick={() => handleDelete(expense.id)}
              >
                Delete
              </button>

            </div>

          </div>

        ))}

      </div>

    </div>
  )
}

export default RecurringExpenses
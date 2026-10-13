import { useEffect, useState } from 'react'
import { apiRequest } from '../utils/apiRequest.js'

const incomeSources = [
  'Salary',
  'Freelance',
  'Business',
  'Investment',
  'Other'
]

function IncomeSection({
  selectedMonth,
  selectedYear,
  onIncomeChanged
}) {
  const [incomes, setIncomes] = useState([])

  const [showForm, setShowForm] =
    useState(false)

  const [editingId, setEditingId] =
    useState(null)

  const [title, setTitle] =
    useState('')

  const [source, setSource] =
    useState('Salary')

  const [amount, setAmount] =
    useState('')

  const [incomeDate, setIncomeDate] =
    useState(
      new Date()
        .toISOString()
        .split('T')[0]
    )

  const [loading, setLoading] =
    useState(true)

  const [saving, setSaving] =
    useState(false)

  const [error, setError] =
    useState('')


  useEffect(() => {
    setLoading(true)
    setError('')

    apiRequest(
      `/api/incomes?month=${selectedMonth}&year=${selectedYear}`
    )
      .then((data) => {
        setIncomes(data)
      })
      .catch((error) => {
        setError(error.message)
      })
      .finally(() => {
        setLoading(false)
      })

  }, [
    selectedMonth,
    selectedYear
  ])


  const resetForm = () => {
    setTitle('')
    setSource('Salary')
    setAmount('')

    setIncomeDate(
      new Date()
        .toISOString()
        .split('T')[0]
    )

    setEditingId(null)
    setShowForm(false)
  }


  const validateForm = () => {
    if (!title.trim()) {
      alert(
        'Please enter an income title'
      )

      return false
    }

    if (
      !amount ||
      Number(amount) <= 0
    ) {
      alert(
        'Please enter a valid amount greater than 0'
      )

      return false
    }

    if (!incomeDate) {
      alert(
        'Please select an income date'
      )

      return false
    }

    return true
  }


  const handleSave = () => {
    if (!validateForm()) {
      return
    }

    setError('')
    setSaving(true)

    const incomeData = {
      title: title.trim(),
      source,
      amount: Number(amount),
      incomeDate
    }

    const endpoint = editingId
      ? `/api/incomes/${editingId}`
      : '/api/incomes'

    apiRequest(endpoint, {
      method: editingId
        ? 'PUT'
        : 'POST',

      body: JSON.stringify(
        incomeData
      )
    })
      .then((savedIncome) => {
        if (editingId) {
          setIncomes(
            (currentIncomes) =>
              currentIncomes.map(
                (income) =>
                  income.id === editingId
                    ? savedIncome
                    : income
              )
          )
        } else {
          const savedDate =
            new Date(
              savedIncome.income_date
            )

          const savedMonth =
            savedDate.getUTCMonth() + 1

          const savedYear =
            savedDate.getUTCFullYear()

          if (
            savedMonth ===
              selectedMonth &&
            savedYear === selectedYear
          ) {
            setIncomes(
              (currentIncomes) => [
                savedIncome,
                ...currentIncomes
              ]
            )
          }
        }
if (onIncomeChanged) {
  onIncomeChanged()
}


        resetForm()
      })
      .catch((error) => {
        setError(error.message)
      })
      .finally(() => {
        setSaving(false)
      })
  }


  const handleEdit = (income) => {
    setEditingId(income.id)

    setTitle(income.title)
    setSource(income.source)
    setAmount(income.amount)

    setIncomeDate(
      income.income_date
        ? income.income_date
            .split('T')[0]
        : ''
    )

    setShowForm(true)
  }


  const handleDelete = (id) => {
    const confirmed =
      window.confirm(
        'Delete this income?'
      )

    if (!confirmed) {
      return
    }

    setError('')

    apiRequest(
      `/api/incomes/${id}`,
      {
        method: 'DELETE'
      }
    )
      .then(() => {
        setIncomes(
          (currentIncomes) =>
            currentIncomes.filter(
              (income) =>
                income.id !== id
            )
        )
        if (onIncomeChanged) {
  onIncomeChanged()
}
      })
      .catch((error) => {
        setError(error.message)
      })
  }


  const totalIncome =
    incomes.reduce(
      (total, income) =>
        total +
        Number(income.amount),
      0
    )


  const formatCurrency = (value) =>
    Number(value).toLocaleString(
      'en-IN'
    )


  return (
    <div className="income-section">

      <div className="income-header">

        <div>
          <h2>Income</h2>

          <p>
            Track money received during
            the selected month.
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
          {showForm
            ? 'Cancel'
            : '+ Add Income'}
        </button>

      </div>


      <div className="income-summary">

        <p>Total Income</p>

        <h2>
          ₹{formatCurrency(
            totalIncome
          )}
        </h2>

        <span>
          {incomes.length}
          {' '}
          {incomes.length === 1
            ? 'income entry'
            : 'income entries'}
        </span>

      </div>


      {showForm && (
        <div className="income-form">

          <input
            type="text"
            maxLength={100}
            placeholder="Income title"
            value={title}
            onChange={(event) =>
              setTitle(
                event.target.value
              )
            }
          />

          <input
            type="number"
            min="0.01"
            step="0.01"
            placeholder="Amount"
            value={amount}
            onChange={(event) =>
              setAmount(
                event.target.value
              )
            }
          />

          <select
            value={source}
            onChange={(event) =>
              setSource(
                event.target.value
              )
            }
          >
            {incomeSources.map(
              (incomeSource) => (
                <option
                  value={incomeSource}
                  key={incomeSource}
                >
                  {incomeSource}
                </option>
              )
            )}
          </select>

          <input
            type="date"
            value={incomeDate}
            onChange={(event) =>
              setIncomeDate(
                event.target.value
              )
            }
          />

          <button
            disabled={saving}
            onClick={handleSave}
          >
            {saving
              ? 'Saving...'
              : editingId
                ? 'Update Income'
                : 'Add Income'}
          </button>

        </div>
      )}


      {loading && (
        <p>Loading income...</p>
      )}

      {error && (
        <p className="error-message">
          {error}
        </p>
      )}


      {!loading &&
        !error &&
        incomes.length === 0 && (
          <p>
            No income recorded for
            this month.
          </p>
        )}


      <div className="income-list">

        {incomes.map((income) => (
          <div
            className="income-card"
            key={income.id}
          >

            <div>
              <strong>
                {income.title}
              </strong>

              <p>
                {income.source}
              </p>

              <small>
                {new Date(
                  income.income_date
                ).toLocaleDateString(
                  'en-IN',
                  {
                    day: '2-digit',
                    month: 'short',
                    year: 'numeric'
                  }
                )}
              </small>
            </div>


            <div className="income-card-actions">

              <strong>
                ₹{formatCurrency(
                  income.amount
                )}
              </strong>

              <button
                onClick={() =>
                  handleEdit(income)
                }
              >
                Edit
              </button>

              <button
                onClick={() =>
                  handleDelete(
                    income.id
                  )
                }
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

export default IncomeSection
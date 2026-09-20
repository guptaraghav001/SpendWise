import { useEffect, useState } from 'react'
import { apiRequest } from '../utils/apiRequest.js'

const categories = [
  'Food',
  'Travel',
  'Shopping',
  'Bills',
  'Other'
]

function CategoryBudgets({
  selectedMonth,
  selectedYear,
  expenses,
  onBudgetSaved
}) 

{
  const [budgets, setBudgets] = useState({})
  const [inputs, setInputs] = useState({})
  const [loading, setLoading] = useState(true)
  const [savingCategory, setSavingCategory] =
    useState(null)
  const [error, setError] = useState('')

  useEffect(() => {
    setLoading(true)
    setError('')

    apiRequest(
      `/api/category-budgets?month=${selectedMonth}&year=${selectedYear}`
    )
      .then((data) => {
        const budgetMap = {}

        data.forEach((item) => {
          budgetMap[item.category] =
            Number(item.amount)
        })

        setBudgets(budgetMap)

        const inputMap = {}

        categories.forEach((category) => {
          inputMap[category] =
            budgetMap[category] || ''
        })

        setInputs(inputMap)
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


  const categorySpending =
    expenses.reduce(
      (totals, expense) => {
        const category =
          expense.category

        const amount =
          Number(expense.amount)

        if (!totals[category]) {
          totals[category] = 0
        }

        totals[category] += amount

        return totals
      },
      {}
    )


  const handleInputChange = (
    category,
    value
  ) => {
    setInputs((current) => ({
      ...current,
      [category]: value
    }))
  }


  const handleSaveBudget = (
    category
  ) => {
    const amount =
      Number(inputs[category])

    if (
      !Number.isFinite(amount) ||
      amount <= 0
    ) {
      alert(
        'Please enter a valid category budget greater than 0'
      )

      return
    }

    setSavingCategory(category)

    apiRequest(
      '/api/category-budgets',
      {
        method: 'PUT',

        body: JSON.stringify({
          category,
          amount,
          month: selectedMonth,
          year: selectedYear
        })
      }
    )
      .then((savedBudget) => {
        setBudgets((current) => ({
          ...current,
          [category]:
            Number(savedBudget.amount)

            
        }))

        if (onBudgetSaved) {
  onBudgetSaved(savedBudget)
}
        setInputs((current) => ({
          ...current,
          [category]:
            Number(savedBudget.amount)
        }))
      })
      .catch((error) => {
        setError(error.message)
      })
      .finally(() => {
        setSavingCategory(null)
      })
  }


  const formatCurrency = (value) =>
    Number(value).toLocaleString(
      'en-IN'
    )


  if (loading) {
    return (
      <div className="category-budgets-section">
        <p>
          Loading category budgets...
        </p>
      </div>
    )
  }


  return (
    <div className="category-budgets-section">

      <div className="category-budgets-header">
        <div>
          <h2>Category Budgets</h2>

          <p>
            Set monthly spending limits
            for individual categories.
          </p>
        </div>
      </div>


      {error && (
        <p className="error-message">
          {error}
        </p>
      )}


      <div className="category-budget-grid">

        {categories.map((category) => {
          const budget =
            Number(budgets[category]) || 0

          const spent =
            Number(
              categorySpending[
                category
              ]
            ) || 0

          const percentage =
            budget > 0
              ? (spent / budget) * 100
              : 0

              let budgetStatus = 'normal'

if (budget > 0 && percentage >= 100) {
  budgetStatus = 'danger'
} else if (
  budget > 0 &&
  percentage >= 80
) {
  budgetStatus = 'warning'
}


          const progressWidth =
            Math.min(
              percentage,
              100
            )

          const remaining =
            budget - spent

          return (


           <div
  className={`category-budget-card category-budget-card-${budgetStatus}`}
  key={category}
>

              <div className="category-budget-card-header">

                <div>
                  <p>Category</p>

                  <h3>
                    {category}
                  </h3>
                </div>

                {budget > 0 && (
                  <strong>
                    {percentage.toFixed(
                      1
                    )}
                    %
                  </strong>
                )}

              </div>


              {budget > 0 ? (
                <>
                <div
  className={`category-budget-status category-budget-status-${budgetStatus}`}
>
  {budgetStatus === 'danger'
    ? 'Budget exceeded'
    : budgetStatus === 'warning'
      ? 'Near category limit'
      : 'Within category budget'}
</div>

                  <p className="category-budget-amount">
                    ₹{formatCurrency(
                      spent
                    )}
                    {' / '}
                    ₹{formatCurrency(
                      budget
                    )}
                  </p>

                  <div className="category-budget-progress">
                 
                  <div
  className={`category-budget-progress-fill category-budget-progress-fill-${budgetStatus}`}
  style={{
    width: `${progressWidth}%`
  }}
/>


                  </div>

                  <small>
                    {remaining >= 0
                      ? `₹${formatCurrency(
                          remaining
                        )} remaining`
                      : `₹${formatCurrency(
                          Math.abs(
                            remaining
                          )
                        )} over budget`}
                  </small>
                </>
              ) : (
                <p className="category-budget-empty">
                  No budget set for this
                  category.
                </p>
              )}


              <div className="category-budget-form">

                <input
                  type="number"
                  min="0.01"
                  step="0.01"
                  placeholder="Set budget"
                  value={
                    inputs[category] ??
                    ''
                  }
                  onChange={(event) =>
                    handleInputChange(
                      category,
                      event.target.value
                    )
                  }
                />

                <button
                  disabled={
                    savingCategory ===
                    category
                  }
                  onClick={() =>
                    handleSaveBudget(
                      category
                    )
                  }
                >
                  {savingCategory ===
                  category
                    ? 'Saving...'
                    : budget > 0
                      ? 'Update'
                      : 'Save'}
                </button>

              </div>

            </div>
          )
        })}

      </div>

    </div>
  )
}

export default CategoryBudgets
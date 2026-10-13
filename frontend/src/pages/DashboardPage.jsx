import { useEffect, useRef, useState } from 'react'
import DashboardHeader from '../components/DashboardHeader.jsx'


import { apiRequest }
  from '../utils/apiRequest.js'

  import CategoryBudgets
  from '../components/CategoryBudgets.jsx'


import {
  getBudgetStatus,
  getSpendingPace,
  getSavingsInsight,
  getUpcomingPaymentAlert,
  getFinancialOverview,
  getImportantInsightCount,getCashFlowInsight
} from '../utils/financialInsights.js'

import SavingsGoals from '../components/SavingsGoals.jsx'
import RecurringExpenses from '../components/RecurringExpenses.jsx'
import Sidebar from '../components/Sidebar.jsx'
import AnalyticsSection from '../components/AnalyticsSection.jsx'
import TransactionsSection from '../components/TransactionsSection.jsx'
import DashboardOverview from '../components/DashboardOverview.jsx'
import InsightsSection from '../components/InsightsSection.jsx'
import IncomeSection
  from '../components/IncomeSection.jsx'

import FinancialReports from '../components/FinancialReports.jsx'

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
const [incomes, setIncomes] = useState([])
const incomeRequestVersion = useRef(0)
  const [searchTerm, setSearchTerm] = useState('')
const [filterCategory, setFilterCategory] = useState('All')
const [sortOption, setSortOption] = useState('newest')

const [trendData, setTrendData] = useState([])
const [
  cashFlowTrend,
  setCashFlowTrend
] = useState([])

const [trendRefresh, setTrendRefresh] = useState(0)
const [expenseRefresh, setExpenseRefresh] = useState(0)
  const [loading, setLoading] = useState(true)
const [error, setError] = useState('')


const [
  categoryComparison,


  setCategoryComparison
] = useState([])

const [activeSection, setActiveSection] = useState('dashboard')

const [dashboardRefresh, setDashboardRefresh] = useState(0)


const [savingExpense, setSavingExpense] = useState(false)


const [savingsSummary, setSavingsSummary] = useState({
  totalSaved: 0,
  totalTarget: 0,
  goalsCount: 0,
  achievedCount: 0
})

const [recurringSummary, setRecurringSummary] = useState({
  count: 0,
  monthlyTotal: 0,
  nextExpense: null
})

const [
  categoryBudgets,
  setCategoryBudgets
] = useState([])


const processRecurringExpenses =
  async () => {
    try {
      return await apiRequest(
        '/api/recurring-expenses/process',
        {
          method: 'POST'
        }
      )
    } catch (error) {
      console.error(
        'Recurring expense processing error:',
        error
      )

      return null
    }
  }


  useEffect(() => {
  const runRecurringProcessing = async () => {
    const result = await processRecurringExpenses()

    if (
      result &&
      result.generatedCount > 0
    ) {
      setExpenseRefresh(
        (value) => value + 1
      )

      setTrendRefresh(
        (value) => value + 1
      )
    }
  }

  runRecurringProcessing()

}, [])



useEffect(() => {
  let cancelled = false

  setLoading(true)
  setError('')
  setExpenses([])

  apiRequest(
    `/api/expenses?month=${selectedMonth}&year=${selectedYear}`
  )
    .then((data) => {
      if (!cancelled) {
        setExpenses(data)
      }
    })
    .catch((error) => {
      if (cancelled) return

      if (
        error.message !==
        'Your session has expired. Please log in again.'
      ) {
        setError(error.message)
      }
    })
    .finally(() => {
      if (!cancelled) {
        setLoading(false)
      }
    })

  return () => {
    cancelled = true
  }
}, [
  selectedMonth,
  selectedYear,
  expenseRefresh
])

useEffect(() => {
  let cancelled = false

  const requestVersion =
    ++incomeRequestVersion.current

  setIncomes([])

  apiRequest(
    `/api/incomes?month=${selectedMonth}&year=${selectedYear}`
  )
    .then((data) => {
      if (
        !cancelled &&
        requestVersion === incomeRequestVersion.current
      ) {
        setIncomes(data)
      }
    })
    .catch((error) => {
      if (
        cancelled ||
        requestVersion !== incomeRequestVersion.current
      ) {
        return
      }

      console.error('Income fetch error:', error)
      setIncomes([])
    })

  return () => {
    cancelled = true
  }
}, [selectedMonth, selectedYear])



useEffect(() => {
  let cancelled = false

  setBudget(0)

  apiRequest(
    `/api/budget?month=${selectedMonth}&year=${selectedYear}`
  )
    .then((data) => {
      if (!cancelled) {
        setBudget(Number(data.amount) || 0)
      }
    })
    .catch((error) => {
      if (cancelled) return

      console.error('Error fetching budget:', error)
      setBudget(0)
    })

  return () => {
    cancelled = true
  }
}, [selectedMonth, selectedYear])


useEffect(() => {
  let cancelled = false

  setCategoryComparison([])

  apiRequest(
    `/api/analytics/category-comparison?month=${selectedMonth}&year=${selectedYear}`
  )
    .then((data) => {
      if (!cancelled) {
        setCategoryComparison(data)
      }
    })
    .catch((error) => {
      if (cancelled) return

      console.error('Category comparison error:', error)
      setCategoryComparison([])
    })

  return () => {
    cancelled = true
  }
}, [selectedMonth, selectedYear, trendRefresh])


useEffect(() => {
  let cancelled = false

  setTrendData([])

  apiRequest(
    `/api/analytics/trend?month=${selectedMonth}&year=${selectedYear}`
  )
    .then((data) => {
      if (!cancelled) {
        setTrendData(data)
      }
    })
    .catch((error) => {
      if (cancelled) return

      console.error('Spending trend error:', error)
      setTrendData([])
    })

  return () => {
    cancelled = true
  }
}, [selectedMonth, selectedYear, trendRefresh])

useEffect(() => {
  let cancelled = false

  setCashFlowTrend([])

  apiRequest(
    `/api/analytics/cash-flow-trend?month=${selectedMonth}&year=${selectedYear}`
  )
    .then((data) => {
      if (!cancelled) {
        setCashFlowTrend(data)
      }
    })
    .catch((error) => {
      if (cancelled) return

      console.error('Cash flow trend error:', error)
      setCashFlowTrend([])
    })

  return () => {
    cancelled = true
  }
}, [selectedMonth, selectedYear, trendRefresh])


useEffect(() => {
  apiRequest('/api/savings-goals')
    .then((goals) => {
      const totalSaved = goals.reduce(
        (total, goal) =>
          total +
          Number(goal.saved_amount),
        0
      )

      const totalTarget = goals.reduce(
        (total, goal) =>
          total +
          Number(goal.target_amount),
        0
      )

      const achievedCount =
        goals.filter(
          (goal) =>
            Number(goal.saved_amount) >=
            Number(goal.target_amount)
        ).length

      setSavingsSummary({
        totalSaved,
        totalTarget,
        goalsCount: goals.length,
        achievedCount
      })
    })
    .catch((error) => {
      console.error(
        'Savings summary error:',
        error
      )
    })

}, [dashboardRefresh])



useEffect(() => {
  apiRequest('/api/recurring-expenses')
    .then((items) => {
      const activeItems =
        items.filter(
          (item) => item.active
        )

      const monthlyTotal =
        activeItems.reduce(
          (total, item) => {
            if (
              item.frequency === 'monthly'
            ) {
              return (
                total +
                Number(item.amount)
              )
            }

            return total
          },
          0
        )

      const sorted =
        [...activeItems].sort(
          (a, b) =>
            new Date(a.next_due_date) -
            new Date(b.next_due_date)
        )

      setRecurringSummary({
        count: activeItems.length,
        monthlyTotal,

        nextExpense:
          sorted.length > 0
            ? sorted[0]
            : null
      })
    })
    .catch((error) => {
      console.error(
        'Recurring summary error:',
        error
      )
    })

}, [dashboardRefresh])



useEffect(() => {
  let cancelled = false

  setCategoryBudgets([])

  apiRequest(
    `/api/category-budgets?month=${selectedMonth}&year=${selectedYear}`
  )
    .then((data) => {
      if (!cancelled) {
        setCategoryBudgets(data)
      }
    })
    .catch((error) => {
      if (cancelled) return

      console.error('Category budgets error:', error)
      setCategoryBudgets([])
    })

  return () => {
    cancelled = true
  }
}, [selectedMonth, selectedYear])

      const spent = expenses.reduce(
  (total, expense) => total + Number(expense.amount),
  0

)

const totalIncome = incomes.reduce(
  (total, income) =>
    total + Number(income.amount),
  0
)
const netCashFlow =
  totalIncome - spent

  const cashFlowInsight =
  getCashFlowInsight(
    totalIncome,
    spent
  )

  
  const savingsRate =
  totalIncome > 0
    ? (netCashFlow / totalIncome) * 100
    : null

  const remaining = budget - spent

  const budgetUsedPercentage =
  budget > 0
    ? Math.min((spent / budget) * 100, 100)
    : 0

const formatCurrency = (value) => {
  return Number(value)
    .toLocaleString('en-IN')
}

const budgetStatus = getBudgetStatus(
  budget,
  spent,
  formatCurrency
)

const spendingPace = getSpendingPace(
  budget,
  spent,
  selectedMonth,
  selectedYear
)

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

const categoryBudgetAlerts =
  categoryBudgets
    .map((item) => {
      const budgetAmount =
        Number(item.amount)

      const categorySpent =
        Number(
          categoryTotals[item.category]
        ) || 0

      const percentage =
        budgetAmount > 0
          ? (
              categorySpent /
              budgetAmount
            ) * 100
          : 0

      let type = 'normal'

      if (percentage >= 100) {
        type = 'danger'
      } else if (percentage >= 80) {
        type = 'warning'
      }

      return {
        category: item.category,
        budget: budgetAmount,
        spent: categorySpent,
        percentage,
        type
      }
    })
    .filter(
      (item) =>
        item.type === 'warning' ||
        item.type === 'danger'
    )
    .sort(
      (a, b) =>
        b.percentage -
        a.percentage
    )

const topCategoryBudgetAlert =
  categoryBudgetAlerts[0] || null


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

  if (!title.trim()) {
    alert('Please enter an expense title')
    return
  }

  if (!amount || Number(amount) <= 0) {
    alert('Please enter a valid amount greater than 0')
    return
  }

  if (!category) {
    alert('Please select a category')
    return
  }

  if (!expenseDate) {
    alert('Please select an expense date')
    return
  }

  setSavingExpense(true)

  const newExpense = {
  title: title,
  category: category,
  amount: Number(amount),
  expenseDate: expenseDate
}


 apiRequest('/api/expenses', {
  method: 'POST',

  body: JSON.stringify(newExpense)
})
  .then((createdExpense) => {
    const createdDate = new Date(
      createdExpense.expense_date
    )

    const createdMonth =
      createdDate.getUTCMonth() + 1

    const createdYear =
      createdDate.getUTCFullYear()

    if (
      createdMonth === selectedMonth &&
      createdYear === selectedYear
    ) {
      setExpenses((currentExpenses) => [
        ...currentExpenses,
        createdExpense
      ])
    }

    setTitle('')
    setAmount('')
    setCategory('Food')

    setExpenseDate(
      new Date()
        .toISOString()
        .split('T')[0]
    )

    setTrendRefresh(
      (value) => value + 1
    )

    setEditingId(null)
    setShowForm(false)
  })
  .catch((error) => {
    console.error(
      'Error adding expense:',
      error
    )
  })
  .finally(() => {
    setSavingExpense(false)
  })
}



const handleDeleteExpense = (id) => {
  const confirmDelete = window.confirm(
    'Are you sure you want to delete this expense?'
  )

  if (!confirmDelete) {
    return
  }

 apiRequest(`/api/expenses/${id}`, {
  method: 'DELETE'
})
  .then(() => {
    setExpenses((currentExpenses) =>
      currentExpenses.filter(
        (expense) =>
          expense.id !== id
      )
    )

    setTrendRefresh(
      (value) => value + 1
    )
  })
  .catch((error) => {
    console.error(
      'Error deleting expense:',
      error
    )
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

  if (!title.trim()) {
    alert('Please enter an expense title')
    return
  }

  if (!amount || Number(amount) <= 0) {
    alert('Please enter a valid amount greater than 0')
    return
  }

  if (!category) {
    alert('Please select a category')
    return
  }

  if (!expenseDate) {
    alert('Please select an expense date')
    return
  }

  setSavingExpense(true)


  const updatedData = {
  title: title,
  category: category,
  amount: Number(amount),
  expenseDate: expenseDate
}

apiRequest(
  `/api/expenses/${editingId}`,
  {
    method: 'PUT',

    body: JSON.stringify(updatedData)
  }
)
  .then((updatedExpense) => {
    setExpenses((currentExpenses) =>
      currentExpenses.map(
        (expense) =>
          expense.id === editingId
            ? updatedExpense
            : expense
      )
    )

    setTrendRefresh(
      (value) => value + 1
    )

    setEditingId(null)
    setTitle('')
    setAmount('')
    setCategory('Food')

    setExpenseDate(
      new Date()
        .toISOString()
        .split('T')[0]
    )

    setShowForm(false)
  })
  .catch((error) => {
    console.error(
      'Error updating expense:',
      error
    )
  })
  .finally(() => {
    setSavingExpense(false)
  })
}

const handleLogout = () => {
  localStorage.removeItem('token')
  localStorage.removeItem('user')

  onLogout()
}

const handleSaveBudget = () => {
  if (
    !budgetInput ||
    Number(budgetInput) <= 0
  ) {
    alert(
      'Please enter a valid budget greater than 0'
    )
    return
  }

  apiRequest('/api/budget', {
  method: 'PUT',

  body: JSON.stringify({
    amount: Number(budgetInput),
    month: selectedMonth,
    year: selectedYear
  })
})
  .then((data) => {
    setBudget(
      Number(data.amount) || 0
    )

    setBudgetInput('')
  })
  .catch((error) => {
    console.error(
      'Error saving budget:',
      error
    )
  })
}

const handlePreviousMonth = () => {
  if (selectedMonth === 1) {
    setSelectedMonth(12)

    setSelectedYear(
      (currentYear) =>
        currentYear - 1
    )
  } else {
    setSelectedMonth(
      (currentMonth) =>
        currentMonth - 1
    )
  }
}

const handleNextMonth = () => {
  if (selectedMonth === 12) {
    setSelectedMonth(1)

    setSelectedYear(
      (currentYear) =>
        currentYear + 1
    )
  } else {
    setSelectedMonth(
      (currentMonth) =>
        currentMonth + 1
    )
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


const formattedTrendData = trendData.map((item) => ({
  month: monthNames[Number(item.month) - 1].slice(0, 3),
  amount: Number(item.total)
}))

const formattedCashFlowTrend =
  cashFlowTrend.map((item) => ({
    month:
      monthNames[
        Number(item.month) - 1
      ].slice(0, 3),

    income:
      Number(item.income),

    expenses:
      Number(item.expenses),

    net:
      Number(item.net)
  }))

const currentTrendItem = trendData.find(
  (item) =>
    Number(item.month) === selectedMonth &&
    Number(item.year) === selectedYear
)

let previousMonth = selectedMonth - 1
let previousYear = selectedYear

if (previousMonth === 0) {
  previousMonth = 12
  previousYear = selectedYear - 1
}

const previousTrendItem = trendData.find(
  (item) =>
    Number(item.month) === previousMonth &&
    Number(item.year) === previousYear
)

const currentMonthSpent = currentTrendItem
  ? Number(currentTrendItem.total)
  : 0

const previousMonthSpent = previousTrendItem
  ? Number(previousTrendItem.total)
  : 0

  const spendingChange =
  previousMonthSpent > 0
    ? (
        ((currentMonthSpent - previousMonthSpent) /
          previousMonthSpent) *
        100
      ).toFixed(1)
    : null



const filteredExpenses = expenses
  .filter((expense) => {

    const matchesSearch =
      expense.title
        .toLowerCase()
        .includes(searchTerm.toLowerCase())

    const matchesCategory =
      filterCategory === 'All' ||
      expense.category === filterCategory

    return matchesSearch && matchesCategory
  })
  .sort((a, b) => {

    if (sortOption === 'newest') {
      return (
        new Date(b.expense_date) -
        new Date(a.expense_date)
      )
    }

    if (sortOption === 'oldest') {
      return (
        new Date(a.expense_date) -
        new Date(b.expense_date)
      )
    }

    if (sortOption === 'highest') {
      return Number(b.amount) - Number(a.amount)
    }

    if (sortOption === 'lowest') {
      return Number(a.amount) - Number(b.amount)
    }

    return 0
  })


  const handleExportCSV = () => {

  if (expenses.length === 0) {
    alert('No expenses available to export')
    return
  }

  const headers = [
    'Title',
    'Category',
    'Amount',
    'Date'
  ]

  const rows = expenses.map((expense) => [
    expense.title,
    expense.category,
    Number(expense.amount),
    new Date(expense.expense_date)
      .toLocaleDateString('en-IN')
  ])

  const csvContent = [
    headers,
    ...rows
  ]
    .map((row) =>
      row
        .map((value) =>
          `"${String(value).replace(/"/g, '""')}"`
        )
        .join(',')
    )
    .join('\n')

  const blob = new Blob(
    [csvContent],
    {
      type: 'text/csv;charset=utf-8;'
    }
  )

  const url = URL.createObjectURL(blob)

  const link = document.createElement('a')

  link.href = url

  link.download =
    `SpendWise-${monthNames[selectedMonth - 1]}-${selectedYear}.csv`

  document.body.appendChild(link)

  link.click()

  document.body.removeChild(link)

  URL.revokeObjectURL(url)
}


const handleSectionChange = (section) => {
  setActiveSection(section)

  if (section === 'dashboard') {
    setDashboardRefresh(
      (value) => value + 1
    )
  }
}

const categoryChanges =
  categoryComparison.map((item) => {
    const current =
      Number(item.current_total)

    const previous =
      Number(item.previous_total)

    const difference =
      current - previous

    let percentageChange = null

    if (previous > 0) {
      percentageChange =
        (difference / previous) * 100
    }

    return {
      category: item.category,
      current,
      previous,
      difference,
      percentageChange
    }
  })

const biggestCategoryChange =
  categoryChanges
    .filter(
      (item) => item.difference !== 0
    )
    .sort(
      (a, b) =>
        Math.abs(b.difference) -
        Math.abs(a.difference)
    )[0] || null


const savingsProgress =
  savingsSummary.totalTarget > 0
    ? (
        savingsSummary.totalSaved /
        savingsSummary.totalTarget
      ) * 100
    : 0

const savingsRemaining = Math.max(
  savingsSummary.totalTarget -
    savingsSummary.totalSaved,
  0
)

const savingsInsight = getSavingsInsight(
  savingsSummary,
  savingsProgress
)

const upcomingPaymentAlert =
  getUpcomingPaymentAlert(
    recurringSummary.nextExpense
  )

const financialOverview =
  getFinancialOverview(
    budget,
    spent,
    spendingPace
  )

const importantInsightCount =
  getImportantInsightCount(
    financialOverview,
    spendingPace,
    upcomingPaymentAlert,
    cashFlowInsight
  ) +
  categoryBudgetAlerts.length

  return (
    
  <div className="app-layout">

    <Sidebar
      activeSection={activeSection}
onSectionChange={handleSectionChange}
      onLogout={handleLogout}
    />

    <main className="main-content">

      <div className="dashboard">
        
<DashboardHeader
  user={user}
  activeSection={activeSection}
  selectedMonth={selectedMonth}
  selectedYear={selectedYear}
  monthNames={monthNames}
  onPreviousMonth={handlePreviousMonth}
  onNextMonth={handleNextMonth}
  onLogout={handleLogout}
/>




{activeSection === 'dashboard' && (
  
  <DashboardOverview
    budget={budget}
    spent={spent}
    remaining={remaining}

    budgetInput={budgetInput}
    setBudgetInput={setBudgetInput}

    budgetUsedPercentage={
      budgetUsedPercentage
    }

    budgetStatus={budgetStatus}

    handleSaveBudget={
      handleSaveBudget
    }

    topCategory={topCategory}

    savingsSummary={
      savingsSummary
    }

    recurringSummary={
      recurringSummary
    }

    financialOverview={
      financialOverview
    }

    spendingPace={
      spendingPace
    }

    biggestCategoryChange={
      biggestCategoryChange
    }

    totalIncome={
  totalIncome
}

netCashFlow={
  netCashFlow
}

savingsRate={
  savingsRate
}

    savingsInsight={
      savingsInsight
    }

    savingsProgress={
      savingsProgress
    }

    topCategoryBudgetAlert={
  topCategoryBudgetAlert
}

    savingsRemaining={
      savingsRemaining
    }

    upcomingPaymentAlert={
      upcomingPaymentAlert
    }

    formatCurrency={
      formatCurrency
    }
  />
)}


{activeSection === 'transactions' && (
  <TransactionsSection
    loading={loading}
    error={error}

    expenses={expenses}
    filteredExpenses={filteredExpenses}

    searchTerm={searchTerm}
    setSearchTerm={setSearchTerm}

    filterCategory={filterCategory}
    setFilterCategory={setFilterCategory}

    sortOption={sortOption}
    setSortOption={setSortOption}

    showForm={showForm}
    setShowForm={setShowForm}

    title={title}
    setTitle={setTitle}

    amount={amount}
    setAmount={setAmount}

    category={category}
    setCategory={setCategory}

    expenseDate={expenseDate}
    setExpenseDate={setExpenseDate}

    editingId={editingId}
    savingExpense={savingExpense}

    handleExportCSV={handleExportCSV}
    handleAddExpense={handleAddExpense}
    handleUpdateExpense={handleUpdateExpense}
    handleEditExpense={handleEditExpense}
    handleDeleteExpense={handleDeleteExpense}
  />
)}


{activeSection === 'income' && (
<IncomeSection
  selectedMonth={selectedMonth}
  selectedYear={selectedYear}

onIncomeChanged={() => {
  const requestVersion =
    ++incomeRequestVersion.current

  apiRequest(
    `/api/incomes?month=${selectedMonth}&year=${selectedYear}`
  )
    .then((data) => {
      if (
        requestVersion === incomeRequestVersion.current
      ) {
        setIncomes(data)
      }
    })
    .catch((error) => {
      if (
        requestVersion !== incomeRequestVersion.current
      ) {
        return
      }

      console.error('Income refresh error:', error)
    })
}}
/>
)}

{activeSection === 'analytics' && (
  <AnalyticsSection
    topCategory={topCategory}
    largestExpense={largestExpense}
    averageExpense={averageExpense}
    expenses={expenses}

    chartData={chartData}
    formattedTrendData={
      formattedTrendData
    }

    currentMonthSpent={
      currentMonthSpent
    }

    previousMonthSpent={
      previousMonthSpent
    }

    spendingChange={
      spendingChange
    }

    categoryTotals={
      categoryTotals
    }

    formattedCashFlowTrend={
  formattedCashFlowTrend
}

    spent={spent}

    formatCurrency={
      formatCurrency
    }
  />
)}



{activeSection === 'savings' && (
  <SavingsGoals />
)}



{activeSection === 'recurring' && (
  <RecurringExpenses />
)} 

{activeSection ===
  'category-budgets' && (
 
   <CategoryBudgets
  selectedMonth={selectedMonth}
  selectedYear={selectedYear}
  expenses={expenses}


  onBudgetSaved={(
    savedBudget
  ) => {
    setCategoryBudgets(
      (current) => {
        const exists =
          current.some(
            (item) =>
              item.category ===
              savedBudget.category
          )

        if (exists) {
          return current.map(
            (item) =>
              item.category ===
              savedBudget.category
                ? savedBudget
                : item
          )
        }

        return [
          ...current,
          savedBudget
        ]
      }
    )
  }}
/>
)}

{activeSection === 'insights' && (
  <InsightsSection
  
  cashFlowInsight={
  cashFlowInsight
}


    financialOverview={
      financialOverview
    }

    spendingPace={
      spendingPace
    }
    topCategoryBudgetAlert={
  topCategoryBudgetAlert
}

    biggestCategoryChange={
      biggestCategoryChange
    }

    savingsInsight={
      savingsInsight
    }

    upcomingPaymentAlert={
      upcomingPaymentAlert
    }

    recurringSummary={
      recurringSummary
    }

    importantInsightCount={
      importantInsightCount
    }

    formatCurrency={
      formatCurrency
    }
  />
)}

{activeSection === 'reports' && (
  <FinancialReports
    selectedMonth={selectedMonth}
    selectedYear={selectedYear}
  />
)}

     </div>
    </main>

  </div>
)

}

export default DashboardPage
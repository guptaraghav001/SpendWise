import { useEffect, useState } from 'react'
import {BarChart,Bar,LineChart,Line,XAxis,YAxis,Tooltip,CartesianGrid,ResponsiveContainer} from 'recharts'
   


import DashboardHeader from '../components/DashboardHeader.jsx'

import API_URL from '../config/api.js'

import { handleApiResponse } from '../utils/handleApiResponse.js'
import SavingsGoals from '../components/SavingsGoals.jsx'
import RecurringExpenses from '../components/RecurringExpenses.jsx'
import Sidebar from '../components/Sidebar.jsx'
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

  const [searchTerm, setSearchTerm] = useState('')
const [filterCategory, setFilterCategory] = useState('All')
const [sortOption, setSortOption] = useState('newest')

const [trendData, setTrendData] = useState([])
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




const processRecurringExpenses = async () => {
  const token = localStorage.getItem('token')

  try {
     const response = await fetch(
      `${API_URL}/api/recurring-expenses/process`,
      {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`
        }
      }
    )

return await handleApiResponse(response)
  } 
  
  catch (error) {
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
    .then(handleApiResponse)

    .then((data) => {
      setExpenses(data)
    })
 .catch((error) => {
  if (
    error.message !==
    'Your session has expired. Please log in again.'
  ) {
    setError(error.message)
  }
})
    .finally(() => {
      setLoading(false)
    })

}, [selectedMonth, selectedYear, expenseRefresh])


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
   .then(handleApiResponse)

    .then((data) => {
      setBudget(Number(data.amount) || 0)
    })
    .catch((error) => {
      console.error('Error fetching budget:', error)
      setBudget(0)
    })

}, [selectedMonth, selectedYear ,expenseRefresh])


useEffect(() => {
  const token = localStorage.getItem('token')

  fetch(
    `${API_URL}/api/analytics/category-comparison?month=${selectedMonth}&year=${selectedYear}`,
    {
      headers: {
        Authorization: `Bearer ${token}`
      }
    }
  )
    .then(handleApiResponse)
    .then((data) => {
      setCategoryComparison(data)
    })
    .catch((error) => {
      console.error(
        'Category comparison error:',
        error
      )
    })

}, [
  selectedMonth,
  selectedYear,
  trendRefresh
])

useEffect(() => {
  const token = localStorage.getItem('token')

fetch(
  `${API_URL}/api/analytics/trend?month=${selectedMonth}&year=${selectedYear}`,
  {
        headers: {
      Authorization: `Bearer ${token}`
    }
  })
   .then(handleApiResponse)

    .then((data) => {
      setTrendData(data)
    })
    .catch((error) => {
      console.error(
        'Error fetching spending trend:',
        error
      )
    })

}, [trendRefresh, selectedMonth, selectedYear])



useEffect(() => {
  const token = localStorage.getItem('token')

  fetch(`${API_URL}/api/savings-goals`, {
    headers: {
      Authorization: `Bearer ${token}`
    }
  })
   .then(handleApiResponse)


    .then((goals) => {
      const totalSaved = goals.reduce(
        (total, goal) =>
          total + Number(goal.saved_amount),
        0
      )

      const totalTarget = goals.reduce(
        (total, goal) =>
          total + Number(goal.target_amount),
        0
      )

      const achievedCount = goals.filter(
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
  const token = localStorage.getItem('token')

  fetch(`${API_URL}/api/recurring-expenses`, {
    headers: {
      Authorization: `Bearer ${token}`
    }
  })
 .then(handleApiResponse)

    .then((items) => {
      const activeItems = items.filter(
        (item) => item.active
      )

      const monthlyTotal = activeItems.reduce(
        (total, item) => {
          if (item.frequency === 'monthly') {
            return total + Number(item.amount)
          }

          return total
        },
        0
      )

      const sorted = [...activeItems].sort(
        (a, b) =>
          new Date(a.next_due_date) -
          new Date(b.next_due_date)
      )

      setRecurringSummary({
        count: activeItems.length,
        monthlyTotal,
        nextExpense:
          sorted.length > 0 ? sorted[0] : null
      })
    })
    .catch((error) => {
      console.error(
        'Recurring summary error:',
        error
      )
    })

}, [dashboardRefresh])


      const spent = expenses.reduce(
  (total, expense) => total + Number(expense.amount),
  0

)

  const remaining = budget - spent

  const budgetUsedPercentage =
  budget > 0
    ? Math.min((spent / budget) * 100, 100)
    : 0

    const getBudgetStatus = () => {
  if (budget <= 0) {
    return null
  }

  const actualPercentage =
    (spent / budget) * 100

  if (actualPercentage >= 100) {
    return {
      type: 'danger',
      title: 'Budget exceeded',
      message: `You are ₹${formatCurrency(
        spent - budget
      )} over your monthly budget.`
    }
  }

  if (actualPercentage >= 80) {
    return {
      type: 'warning',
      title: 'Near budget limit',
      message: `${actualPercentage.toFixed(
        1
      )}% of your budget has been used.`
    }
  }

  if (actualPercentage >= 50) {
    return {
      type: 'caution',
      title: 'Watch your spending',
      message: `${actualPercentage.toFixed(
        1
      )}% of your budget has been used.`
    }
  }

  return {
    type: 'safe',
    title: 'Spending on track',
    message: `${actualPercentage.toFixed(
      1
    )}% of your budget has been used.`
  }
}

const budgetStatus = getBudgetStatus()

const getSpendingPace = () => {
  if (budget <= 0) {
    return null
  }

  const now = new Date()

  const currentMonth = now.getMonth() + 1
  const currentYear = now.getFullYear()

  if (
    selectedMonth !== currentMonth ||
    selectedYear !== currentYear
  ) {
    return null
  }

  const daysInMonth = new Date(
    selectedYear,
    selectedMonth,
    0
  ).getDate()

  const currentDay = now.getDate()

  const monthElapsedPercentage =
    (currentDay / daysInMonth) * 100

  const budgetUsed =
    (spent / budget) * 100

  const paceDifference =
    budgetUsed - monthElapsedPercentage

  if (paceDifference >= 20) {
    return {
      type: 'danger',
      title: 'Spending much faster than planned',
      message: `You've used ${budgetUsed.toFixed(
        1
      )}% of your budget while ${monthElapsedPercentage.toFixed(
        1
      )}% of the month has passed.`
    }
  }

  if (paceDifference >= 10) {
    return {
      type: 'warning',
      title: 'Spending slightly ahead of pace',
      message: `You've used ${budgetUsed.toFixed(
        1
      )}% of your budget while ${monthElapsedPercentage.toFixed(
        1
      )}% of the month has passed.`
    }
  }

  return {
    type: 'safe',
    title: 'Spending pace looks comfortable',
    message: `You've used ${budgetUsed.toFixed(
      1
    )}% of your budget with ${monthElapsedPercentage.toFixed(
      1
    )}% of the month completed.`
  }
}

const spendingPace = getSpendingPace()
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


  const token = localStorage.getItem('token')



fetch(`${API_URL}/api/expenses`, {
  method: 'POST',

  headers: {
    'Content-Type': 'application/json',
    Authorization: `Bearer ${token}`
  },

    body: JSON.stringify(newExpense)
  })
.then(handleApiResponse)  

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

setTrendRefresh((value) => value + 1)

      setEditingId(null)
      setShowForm(false)
    })
    .catch((error) => {
      console.error('Error adding expense:', error)
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

  const token = localStorage.getItem('token')

  fetch(`${API_URL}/api/expenses/${id}`, {
    method: 'DELETE',

    headers: {
      Authorization: `Bearer ${token}`
    }
  })
    .then(handleApiResponse)
    .then(() => {
      setExpenses((currentExpenses) =>
        currentExpenses.filter(
          (expense) => expense.id !== id
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

  if (Number(amount) <= 0) {
    alert('Amount must be greater than 0')
    return
  }

  setSavingExpense(true)


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

   .then(handleApiResponse)

    .then((updatedExpense) => {

      const updatedExpenses = expenses.map((expense) =>
        expense.id === editingId
          ? updatedExpense
          : expense
      )

      setExpenses(updatedExpenses)
setTrendRefresh((value) => value + 1)

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

  const token =
    localStorage.getItem('token')

  if (!budgetInput || Number(budgetInput) <= 0) {
  alert('Please enter a valid budget greater than 0')
  return
}

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
   .then(handleApiResponse)
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


const formattedTrendData = trendData.map((item) => ({
  month: monthNames[Number(item.month) - 1].slice(0, 3),
  amount: Number(item.total)
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

const formatCurrency = (value) => {
  return Number(value).toLocaleString('en-IN')
}


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

const getSavingsInsight = () => {
  if (savingsSummary.goalsCount === 0) {
    return null
  }

  if (
    savingsSummary.achievedCount ===
    savingsSummary.goalsCount
  ) {
    return {
      type: 'success',
      title: 'All savings goals achieved',
      message:
        'You have completed all of your current savings goals.'
    }
  }

  if (savingsProgress >= 75) {
    return {
      type: 'strong',
      title: 'Savings goals are close',
      message:
        `You have completed ${savingsProgress.toFixed(
          1
        )}% of your combined savings targets.`
    }
  }

  if (savingsProgress >= 40) {
    return {
      type: 'steady',
      title: 'Savings are progressing',
      message:
        `You have completed ${savingsProgress.toFixed(
          1
        )}% of your combined savings targets.`
    }
  }


  const getUpcomingPaymentAlert = () => {
  if (!recurringSummary.nextExpense) {
    return null
  }

  const dueDate = new Date(
    recurringSummary.nextExpense.next_due_date
  )

  const today = new Date()

  dueDate.setHours(0, 0, 0, 0)
  today.setHours(0, 0, 0, 0)

  const millisecondsPerDay =
    1000 * 60 * 60 * 24

  const daysUntilDue = Math.round(
    (dueDate - today) / millisecondsPerDay
  )

  if (daysUntilDue < 0) {
    return {
      type: 'danger',
      label: `Overdue by ${Math.abs(
        daysUntilDue
      )} ${
        Math.abs(daysUntilDue) === 1
          ? 'day'
          : 'days'
      }`
    }
  }

  if (daysUntilDue === 0) {
    return {
      type: 'danger',
      label: 'Due today'
    }
  }

  if (daysUntilDue === 1) {
    return {
      type: 'warning',
      label: 'Due tomorrow'
    }
  }

  if (daysUntilDue <= 7) {
    return {
      type: 'warning',
      label: `Due in ${daysUntilDue} days`
    }
  }

  return {
    type: 'normal',
    label: `Due in ${daysUntilDue} days`
  }
}

const upcomingPaymentAlert =
  getUpcomingPaymentAlert()


  return {
    type: 'starting',
    title: 'Savings goals are getting started',
    message:
      `You have completed ${savingsProgress.toFixed(
        1
      )}% of your combined savings targets.`
  }
}

const savingsInsight = getSavingsInsight()

const getUpcomingPaymentAlert = () => {
  if (!recurringSummary.nextExpense) {
    return null
  }

  const dueDate = new Date(
    recurringSummary.nextExpense.next_due_date
  )

  const today = new Date()

  dueDate.setHours(0, 0, 0, 0)
  today.setHours(0, 0, 0, 0)

  const millisecondsPerDay =
    1000 * 60 * 60 * 24

  const daysUntilDue = Math.round(
    (dueDate - today) / millisecondsPerDay
  )

  if (daysUntilDue < 0) {
    const overdueDays =
      Math.abs(daysUntilDue)

    return {
      type: 'danger',
      label: `Overdue by ${overdueDays} ${
        overdueDays === 1
          ? 'day'
          : 'days'
      }`
    }
  }

  if (daysUntilDue === 0) {
    return {
      type: 'danger',
      label: 'Due today'
    }
  }

  if (daysUntilDue === 1) {
    return {
      type: 'warning',
      label: 'Due tomorrow'
    }
  }

  if (daysUntilDue <= 7) {
    return {
      type: 'warning',
      label: `Due in ${daysUntilDue} days`
    }
  }

  return {
    type: 'normal',
    label: `Due in ${daysUntilDue} days`
  }
}

const upcomingPaymentAlert =
  getUpcomingPaymentAlert()


const getFinancialOverview = () => {
  if (budget <= 0) {
    return {
      type: 'neutral',
      title: 'Budget needed',
      message:
        'Set a monthly budget to enable a fuller financial overview.'
    }
  }

  const budgetUsage =
    (spent / budget) * 100

  if (budgetUsage >= 100) {
    return {
      type: 'danger',
      title: 'Budget exceeded',
      message:
        'Your spending has exceeded the budget set for this month.'
    }
  }

  if (
    spendingPace?.type === 'danger'
  ) {
    return {
      type: 'warning',
      title: 'Spending pace is high',
      message:
        'Your spending is currently progressing faster than the month.'
    }
  }

  if (
    budgetUsage >= 80 ||
    spendingPace?.type === 'warning'
  ) {
    return {
      type: 'caution',
      title: 'Keep an eye on spending',
      message:
        'Your budget usage or spending pace is approaching its warning range.'
    }
  }

  return {
    type: 'stable',
    title: 'Current indicators are stable',
    message:
      'Your current budget usage and spending pace are within the app’s normal ranges.'
  }
}

const financialOverview =
  getFinancialOverview()


const importantInsightCount = [
  financialOverview.type === 'danger' ||
  financialOverview.type === 'warning' ||
  financialOverview.type === 'caution',

  spendingPace?.type === 'danger' ||
  spendingPace?.type === 'warning',

  upcomingPaymentAlert?.type === 'danger' ||
  upcomingPaymentAlert?.type === 'warning'
].filter(Boolean).length


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
  <>

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

{budgetStatus && (
  <div
    className={`budget-status budget-status-${budgetStatus.type}`}
  >
    <strong>
      {budgetStatus.title}
    </strong>

    <span>
      {budgetStatus.message}
    </span>
  </div>
)}

  <input
    type="number"
    placeholder="Set budget"
    min="0.01"
step="0.01"
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



<div className="dashboard-overview">

  <div className="overview-card">
    <p>Top Spending Category</p>

    <h3>
      {topCategory
        ? topCategory[0]
        : 'No spending yet'}
    </h3>

    {topCategory && (
      <span>
        ₹{formatCurrency(topCategory[1])}
      </span>
    )}
  </div>


  <div className="overview-card">
    <p>Total Savings</p>

    <h3>
      ₹{formatCurrency(
        savingsSummary.totalSaved
      )}
    </h3>

    <span>
      {savingsSummary.achievedCount}
      {' of '}
      {savingsSummary.goalsCount}
      {' goals achieved'}
    </span>
  </div>


  <div className="overview-card">
    <p>Monthly Recurring</p>

    <h3>
      ₹{formatCurrency(
        recurringSummary.monthlyTotal
      )}
    </h3>

    <span>
      {recurringSummary.count}
      {' active recurring expenses'}
    </span>
  </div>

</div>


<div
  className={`financial-overview financial-overview-${financialOverview.type}`}
>
  <div>
    <p>Financial Overview</p>

    <strong>
      {financialOverview.title}
    </strong>

    <span>
      {financialOverview.message}
    </span>
  </div>

  <div className="financial-overview-stats">

    <span>
      Budget used
      <strong>
        {budget > 0
          ? `${((spent / budget) * 100).toFixed(1)}%`
          : '—'}
      </strong>
    </span>

    <span>
      Savings progress
      <strong>
        {savingsSummary.goalsCount > 0
          ? `${savingsProgress.toFixed(1)}%`
          : '—'}
      </strong>
    </span>

    <span>
      Active recurring
      <strong>
        {recurringSummary.count}
      </strong>
    </span>

  </div>
</div>



{spendingPace && (
  <div
    className={`insight-item insight-item-${spendingPace.type}`}
  >
    <p>Spending Pace</p>

    <strong>
      {spendingPace.title}
    </strong>

    <span>
      {spendingPace.message}
    </span>
  </div>
)}


{biggestCategoryChange && (
  <div className="category-insight">

    <p>Category Insight</p>

    <strong>
      {biggestCategoryChange.category}
    </strong>

    <span>
      {biggestCategoryChange.difference > 0
        ? `Spending increased by ₹${formatCurrency(
            biggestCategoryChange.difference
          )} compared with last month.`
        : `Spending decreased by ₹${formatCurrency(
            Math.abs(
              biggestCategoryChange.difference
            )
          )} compared with last month.`}
    </span>

    {biggestCategoryChange.percentageChange !== null && (
      <small>
        {biggestCategoryChange.percentageChange >= 0
          ? '↑'
          : '↓'}
        {' '}
        {Math.abs(
          biggestCategoryChange.percentageChange
        ).toFixed(1)}
        % month over month
      </small>
    )}

  </div>
)}


{savingsInsight && (
  <div
    className={`savings-insight savings-insight-${savingsInsight.type}`}
  >

    <div className="savings-insight-header">

      <div>
        <p>Savings Progress</p>

        <strong>
          {savingsInsight.title}
        </strong>
      </div>

      <strong>
        {savingsProgress.toFixed(1)}%
      </strong>

    </div>


    <div className="savings-insight-progress">

      <div
        className="savings-insight-progress-fill"
        style={{
          width: `${Math.min(
            savingsProgress,
            100
          )}%`
        }}
      />

    </div>


    <span>
      {savingsInsight.message}
    </span>


    {savingsRemaining > 0 && (
      <small>
        ₹{formatCurrency(savingsRemaining)}
        {' remaining across your goals'}
      </small>
    )}

  </div>
)}





<div className="dashboard-next">

  <h2>Upcoming Payment</h2>

  {recurringSummary.nextExpense ? (
    <div className="upcoming-payment">

      <div>
        <strong>
          {recurringSummary.nextExpense.title}
        </strong>

        <p>
          {recurringSummary.nextExpense.category}
          {' • '}
          {recurringSummary.nextExpense.frequency}
        </p>
      </div>

     <div className="upcoming-payment-details">

  <strong>
    ₹{formatCurrency(
      recurringSummary.nextExpense.amount
    )}
  </strong>

  <p>
    {new Date(
      recurringSummary.nextExpense.next_due_date
    ).toLocaleDateString(
      'en-IN',
      {
        day: '2-digit',
        month: 'short',
        year: 'numeric'
      }
    )}
  </p>

  {upcomingPaymentAlert && (
    <span
      className={`payment-alert payment-alert-${upcomingPaymentAlert.type}`}
    >
      {upcomingPaymentAlert.label}
    </span>
  )}

</div>

    </div>
  ) : (
    <p>No upcoming recurring expenses.</p>
  )}

</div>



  </>
)}



{activeSection === 'transactions' && (

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

            <button onClick={handleExportCSV}>
    Export CSV
  </button>

  <button onClick={() => setShowForm(true)}>
    + Add Expense
  </button>    
 </div>



<div className="expense-filters">

  <input
    type="text"
    placeholder="Search expenses..."
    value={searchTerm}
    onChange={(event) =>
      setSearchTerm(event.target.value)
    }
  />

  <select
    value={filterCategory}
    onChange={(event) =>
      setFilterCategory(event.target.value)
    }
  >
    <option value="All">All Categories</option>
    <option value="Food">Food</option>
    <option value="Travel">Travel</option>
    <option value="Shopping">Shopping</option>
    <option value="Bills">Bills</option>
    <option value="Other">Other</option>
  </select>

  <select
    value={sortOption}
    onChange={(event) =>
      setSortOption(event.target.value)
    }
  >
    <option value="newest">Newest First</option>
    <option value="oldest">Oldest First</option>
    <option value="highest">Highest Amount</option>
    <option value="lowest">Lowest Amount</option>
  </select>

  <button
    onClick={() => {
      setSearchTerm('')
      setFilterCategory('All')
      setSortOption('newest')
    }}
  >
    Clear Filters
  </button>

</div>




{showForm && (
  <div className="expense-form">

    <input
      type="text"
      placeholder="Expense title"
      maxLength={100}
      value={title}
      onChange={(event) => setTitle(event.target.value)}
    />

    <input
      type="number"
      min="0.01"
step="0.01"
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
  disabled={savingExpense}
  onClick={
    editingId
      ? handleUpdateExpense
      : handleAddExpense
  }
>
  {savingExpense
    ? 'Saving...'
    : editingId
      ? 'Update Expense'
      : 'Add Expense'}
</button>
  </div>
)}

{!loading && !error && expenses.length === 0 && (
  <p>No expenses recorded for this month.</p>
)}

{!loading &&
  !error &&
  expenses.length > 0 &&
  filteredExpenses.length === 0 && (
    <p>
      No expenses match your search or filters.
    </p>
  )}

{filteredExpenses.map((expense) => (
   <div className="transaction-actions">

  <strong>
    ₹{expense.amount}
  </strong>

  <button
    onClick={() =>
      handleEditExpense(expense)
    }
  >
    Edit
  </button>

  <button
    onClick={() =>
      handleDeleteExpense(expense.id)
    }
  >
    Delete
  </button>

</div>
))}

</div>
  
)}

{activeSection === 'analytics' && (
  <>
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

</div>


<div className="trend-analytics">

  <h2>6-Month Spending Trend</h2>

<div className="month-comparison">

  <div>
    <p>This Month</p>
    <strong>
      ₹{formatCurrency(currentMonthSpent)}
    </strong>
  </div>

  <div>
    <p>Previous Month</p>
    <strong>
      ₹{formatCurrency(previousMonthSpent)}
    </strong>
  </div>

  <div>
    <p>Change</p>

    <strong>
      {spendingChange === null
        ? 'No comparison'
        : `${Number(spendingChange) >= 0 ? '↑' : '↓'} ${Math.abs(
            Number(spendingChange)
          )}%`}
    </strong>
  </div>


</div>

  {formattedTrendData.length === 0 ? (

    <p>No spending history available yet.</p>

  ) : (

    <div className="trend-chart">

      <ResponsiveContainer
        width="100%"
        height={300}
      >

        <LineChart data={formattedTrendData}>

          <CartesianGrid strokeDasharray="3 3" />

          <XAxis dataKey="month" />

          <YAxis />

          <Tooltip />

          <Line
            type="monotone"
            dataKey="amount"
            stroke="#646cff"
            strokeWidth={3}
          />

        </LineChart>

      </ResponsiveContainer>

    </div>

  )}

</div>

<div className="category-breakdown">
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

  </>
)}

{activeSection === 'savings' && (
  <SavingsGoals />
)}
{activeSection === 'recurring' && (
  <RecurringExpenses />
)} 

{activeSection === 'insights' && (
  <div className="insights-section">

  <div className="insights-header">

  <div>
    <h2>Financial Insights</h2>

    <p>
      Important updates based on your current
      spending, budget and financial goals.
    </p>
  </div>

  <span className="insight-count">
    {importantInsightCount > 0
      ? `${importantInsightCount} ${
          importantInsightCount === 1
            ? 'alert'
            : 'alerts'
        }`
      : 'No urgent alerts'}
  </span>

</div>

    <div className="insights-list">

     <div
  className={`insight-item insight-item-${financialOverview.type}`}
>

        <strong>
          {financialOverview.title}
        </strong>

        <span>
          {financialOverview.message}
        </span>
      </div>


      {spendingPace && (
        <div className="insight-item">
          <p>Spending Pace</p>

          <strong>
            {spendingPace.title}
          </strong>

          <span>
            {spendingPace.message}
          </span>
        </div>
      )}


      {biggestCategoryChange && (
        <div className="insight-item">
          <p>Category Change</p>

          <strong>
            {biggestCategoryChange.category}
          </strong>

          <span>
            {biggestCategoryChange.difference > 0
              ? `Spending increased by ₹${formatCurrency(
                  biggestCategoryChange.difference
                )} compared with last month.`
              : `Spending decreased by ₹${formatCurrency(
                  Math.abs(
                    biggestCategoryChange.difference
                  )
                )} compared with last month.`}
          </span>
        </div>
      )}


      {savingsInsight && (
        <div className="insight-item">
          <p>Savings</p>

          <strong>
            {savingsInsight.title}
          </strong>

          <span>
            {savingsInsight.message}
          </span>
        </div>
      )}


   {upcomingPaymentAlert &&
  recurringSummary.nextExpense && (
    <div
      className={`insight-item insight-item-${upcomingPaymentAlert.type}`}
    >
            <p>Upcoming Payment</p>

            <strong>
              {recurringSummary.nextExpense.title}
            </strong>

            <span>
              ₹{formatCurrency(
                recurringSummary.nextExpense.amount
              )}
              {' • '}
              {upcomingPaymentAlert.label}
            </span>

          </div>
        )}

    </div>

  </div>
)}

     </div>
    </main>

  </div>
)

}

export default DashboardPage
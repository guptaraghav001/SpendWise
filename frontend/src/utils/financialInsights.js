// ======================================================
// FINANCIAL INSIGHT UTILITIES
// ======================================================


// ======================================================
// BUDGET STATUS
// ======================================================

export const getBudgetStatus = (
  budget,
  spent,
  formatCurrency
) => {
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


// ======================================================
// SPENDING PACE
// ======================================================

export const getSpendingPace = (
  budget,
  spent,
  selectedMonth,
  selectedYear
) => {
  if (budget <= 0) {
    return null
  }

  const now = new Date()

  const currentMonth =
    now.getMonth() + 1

  const currentYear =
    now.getFullYear()

  // Spending pace only makes sense
  // for the current month.
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

  const currentDay =
    now.getDate()

  const monthElapsedPercentage =
    (currentDay / daysInMonth) * 100

  const budgetUsed =
    (spent / budget) * 100

  const paceDifference =
    budgetUsed -
    monthElapsedPercentage

  if (paceDifference >= 20) {
    return {
      type: 'danger',

      title:
        'Spending much faster than planned',

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

      title:
        'Spending slightly ahead of pace',

      message: `You've used ${budgetUsed.toFixed(
        1
      )}% of your budget while ${monthElapsedPercentage.toFixed(
        1
      )}% of the month has passed.`
    }
  }

  return {
    type: 'safe',

    title:
      'Spending pace looks comfortable',

    message: `You've used ${budgetUsed.toFixed(
      1
    )}% of your budget with ${monthElapsedPercentage.toFixed(
      1
    )}% of the month completed.`
  }
}


// ======================================================
// SAVINGS INSIGHT
// ======================================================

export const getSavingsInsight = (
  savingsSummary,
  savingsProgress
) => {
  if (
    !savingsSummary ||
    savingsSummary.goalsCount === 0
  ) {
    return null
  }

  if (
    savingsSummary.achievedCount ===
    savingsSummary.goalsCount
  ) {
    return {
      type: 'success',

      title:
        'All savings goals achieved',

      message:
        'You have completed all of your current savings goals.'
    }
  }

  if (savingsProgress >= 75) {
    return {
      type: 'strong',

      title:
        'Savings goals are close',

      message: `You have completed ${savingsProgress.toFixed(
        1
      )}% of your combined savings targets.`
    }
  }

  if (savingsProgress >= 40) {
    return {
      type: 'steady',

      title:
        'Savings are progressing',

      message: `You have completed ${savingsProgress.toFixed(
        1
      )}% of your combined savings targets.`
    }
  }

  return {
    type: 'starting',

    title:
      'Savings goals are getting started',

    message: `You have completed ${savingsProgress.toFixed(
      1
    )}% of your combined savings targets.`
  }
}


// ======================================================
// UPCOMING PAYMENT ALERT
// ======================================================

export const getUpcomingPaymentAlert = (
  nextExpense
) => {
  if (!nextExpense?.next_due_date) {
    return null
  }

  const dueDate = new Date(
    nextExpense.next_due_date
  )

  const today = new Date()

  dueDate.setHours(0, 0, 0, 0)
  today.setHours(0, 0, 0, 0)

  const millisecondsPerDay =
    1000 * 60 * 60 * 24

  const daysUntilDue =
    Math.round(
      (dueDate - today) /
        millisecondsPerDay
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


// ======================================================
// FINANCIAL OVERVIEW
// ======================================================

export const getFinancialOverview = (
  budget,
  spent,
  spendingPace
) => {
  if (budget <= 0) {
    return {
      type: 'neutral',

      title:
        'Budget needed',

      message:
        'Set a monthly budget to enable a fuller financial overview.'
    }
  }

  const budgetUsage =
    (spent / budget) * 100

  if (budgetUsage >= 100) {
    return {
      type: 'danger',

      title:
        'Budget exceeded',

      message:
        'Your spending has exceeded the budget set for this month.'
    }
  }

  if (
    spendingPace?.type === 'danger'
  ) {
    return {
      type: 'warning',

      title:
        'Spending pace is high',

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

      title:
        'Keep an eye on spending',

      message:
        'Your budget usage or spending pace is approaching its warning range.'
    }
  }

  return {
    type: 'stable',

    title:
      'Current indicators are stable',

    message:
      'Your current budget usage and spending pace are within the app’s normal ranges.'
  }
}


// ======================================================
// IMPORTANT INSIGHT COUNT
// ======================================================

export const getImportantInsightCount = (
  financialOverview,
  spendingPace,
  upcomingPaymentAlert,
  cashFlowInsight
) => {
  const alerts = [
    financialOverview?.type === 'danger' ||
      financialOverview?.type === 'warning' ||
      financialOverview?.type === 'caution',

    spendingPace?.type === 'danger' ||
      spendingPace?.type === 'warning',

    upcomingPaymentAlert?.type ===
      'danger' ||
      upcomingPaymentAlert?.type ===
        'warning',

    cashFlowInsight?.type === 'danger' ||
      cashFlowInsight?.type === 'warning'
  ]

  return alerts.filter(Boolean).length
}

// ======================================================
// CASH FLOW INSIGHT
// ======================================================

export const getCashFlowInsight = (
  totalIncome,
  spent
) => {
  const income =
    Number(totalIncome) || 0

  const expenses =
    Number(spent) || 0

  if (income <= 0) {
    return {
      type: 'neutral',
      title: 'No income recorded',
      message:
        'Add income for this month to calculate your cash flow.'
    }
  }

  const net =
    income - expenses

  const remainingRate =
    (net / income) * 100

  if (net < 0) {
    return {
      type: 'danger',
      title:
        'Expenses exceed recorded income',
      message:
        `Tracked expenses exceed recorded income by ₹${Math.abs(
          net
        ).toLocaleString('en-IN')}.`,
      net,
      remainingRate
    }
  }

  if (net === 0) {
    return {
      type: 'warning',
      title:
        'Income and expenses are equal',
      message:
        'All recorded income has been matched by tracked expenses.',
      net,
      remainingRate: 0
    }
  }

  return {
    type: 'positive',
    title: 'Positive cash flow',
    message:
      `Recorded income exceeds tracked expenses by ₹${net.toLocaleString(
        'en-IN'
      )}.`,
    net,
    remainingRate
  }
}

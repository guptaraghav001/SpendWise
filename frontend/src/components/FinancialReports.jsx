import { useEffect, useState } from 'react'
import { apiRequest } from '../utils/apiRequest.js'
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip
} from 'recharts'
import { exportFinancialReport } from '../utils/exportFinancialReport.js'


function FinancialReports({
  selectedMonth,
  selectedYear
}) {
  const [report, setReport] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    let cancelled = false

    setLoading(true)
    setError('')
    setReport(null)

    apiRequest(
      `/api/reports/monthly?month=${selectedMonth}&year=${selectedYear}`
    )
      .then((data) => {
        if (!cancelled) {
          setReport(data)
        }
      })
      .catch((error) => {
        if (!cancelled) {
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
  }, [selectedMonth, selectedYear])

  const formatCurrency = (value) =>
    Number(value || 0).toLocaleString('en-IN', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    })



    const budgetUsage =
  report && Number(report.monthlyBudget) > 0
    ? (
        Number(report.totalExpenses) /
        Number(report.monthlyBudget)
      ) * 100
    : null

const expensePercentage = (amount) => {
  if (!report || Number(report.totalExpenses) <= 0) {
    return 0
  }

  return (
    Number(amount) /
    Number(report.totalExpenses)
  ) * 100
}

const cashFlowChartData = report
  ? [
      {
        name: 'Income',
        amount: Number(report.totalIncome) || 0,
        fill: '#34d399'
      },
      {
        name: 'Expenses',
        amount: Number(report.totalExpenses) || 0,
        fill: '#fb7185'
      },
      {
        name: 'Net Cash Flow',
        amount: Number(report.netCashFlow) || 0,
        fill:
          Number(report.netCashFlow) >= 0
            ? '#60a5fa'
            : '#fbbf24'
      }
    ]
  : []


  if (loading) {
    return (
      <div className="financial-reports">
        <p>Loading financial report...</p>
      </div>
    )
  }

  if (error) {
    return (
      <div className="financial-reports">
        <p className="error-message">
          {error}
        </p>
      </div>
    )
  }

  if (!report) {
    return (
      <div className="financial-reports">
        <p>No report available.</p>
      </div>
    )
  }


  
  return (
    <div className="financial-reports">

<div className="report-title-row">

  <h2>Monthly Financial Report</h2>

  <button
    type="button"
    className="report-download-button"
    onClick={() => {
      try {
        exportFinancialReport(report)
      } catch (error) {
        console.error(
          'PDF export failed:',
          error
        )

        alert('Unable to generate PDF report')
      }
    }}
  >
    Download PDF
  </button>

</div>
      <p>
        Financial summary for the selected month.
      </p>

      <div className="report-summary">

        <div className="report-card">
          <p>Total Income</p>
          <h3>
            ₹{formatCurrency(report.totalIncome)}
          </h3>
        </div>

        <div className="report-card">
          <p>Total Expenses</p>
          <h3>
            ₹{formatCurrency(report.totalExpenses)}
          </h3>
        </div>

        <div className="report-card">
          <p>Net Cash Flow</p>
          <h3>
            {report.netCashFlow >= 0 ? '+' : '-'}
            ₹{formatCurrency(
              Math.abs(report.netCashFlow)
            )}
          </h3>
        </div>

        <div className="report-card">
          <p>Monthly Budget</p>
          <h3>
            ₹{formatCurrency(report.monthlyBudget)}
          </h3>
        </div>

      </div>


      <div className="report-details report-chart-section">

  <h3>Income vs Expenses vs Net Cash Flow</h3>

  <p>
    Visual comparison of your monthly financial activity.
  </p>

  <div className="report-chart-container">
    <ResponsiveContainer width="100%" height={300}>
      <BarChart
        data={cashFlowChartData}
        margin={{
          top: 15,
          right: 10,
          left: 0,
          bottom: 10
        }}
      >
        <CartesianGrid
          strokeDasharray="3 3"
          stroke="#444"
          vertical={false}
        />

        <XAxis
          dataKey="name"
          tick={{ fill: '#a1a1aa', fontSize: 12 }}
          interval={0}
        />

        <YAxis
          tick={{ fill: '#a1a1aa', fontSize: 12 }}
          width={55}
        />

        <Tooltip
          formatter={(value) =>
            `₹${formatCurrency(value)}`
          }
          contentStyle={{
            backgroundColor: '#292929',
            border: '1px solid #444',
            borderRadius: '8px',
            color: '#f4f4f5'
          }}
        />

        <Bar
          dataKey="amount"
          radius={[5, 5, 0, 0]}
          maxBarSize={85}
        >
          {cashFlowChartData.map((item) => (
            <Cell
              key={item.name}
              fill={item.fill}
            />
          ))}
        </Bar>

      </BarChart>
    </ResponsiveContainer>
  </div>

</div>

      <div className="report-details">

  <h3>Budget Performance</h3>

  {budgetUsage !== null ? (
    <>
      <div className="report-budget-header">
        <span>Budget Utilization</span>

        <strong>
          {budgetUsage.toFixed(1)}%
        </strong>
      </div>

      <div className="report-progress">
        <div
          className={`report-progress-fill ${
            budgetUsage >= 100
              ? 'report-progress-danger'
              : budgetUsage >= 80
                ? 'report-progress-warning'
                : 'report-progress-normal'
          }`}
          style={{
            width: `${Math.min(budgetUsage, 100)}%`
          }}
        />
      </div>

      <p>
        {budgetUsage >= 100
          ? 'Monthly budget limit reached or exceeded.'
          : budgetUsage >= 80
            ? 'Spending is approaching the monthly budget limit.'
            : 'Spending is below the monthly budget warning threshold.'}
      </p>
    </>
  ) : (
    <p>No monthly budget set.</p>
  )}

</div>


     <div className="report-details report-overview">

  <h3>Monthly Overview</h3>

  <div className="report-overview-row">
    <span>Total Transactions</span>

    <strong>
      {report.transactionCount}
    </strong>
  </div>

  <div className="report-overview-row">
    <span>Budget Remaining</span>

    <strong>
      ₹{formatCurrency(report.budgetRemaining)}
    </strong>
  </div>

  <div className="report-overview-row">
    <span>Cash Flow Rate</span>

    <strong>
      {report.cashFlowRate !== null
        ? `${Number(report.cashFlowRate).toFixed(1)}%`
        : 'Not available'}
    </strong>
  </div>

</div>

      <div className="report-details">
        <h3>Category Spending</h3>

        {report.categoryBreakdown.map((item) => {
          const percentage = expensePercentage(item.amount)
const categoryColors = {
  Food: '#34d399',
  Travel: '#a78bfa',
  Shopping: '#f472b6',
  Bills: '#fbbf24',
  Other: '#60a5fa'
}

          return (
            <div
              className="report-category-item"
              key={item.category}
            >
              <div className="report-category-row">
                <span>{item.category}</span>

                <strong>
                  ₹{formatCurrency(item.amount)}
                  {' · '}
                  {percentage.toFixed(1)}%
                </strong>
              </div>

              <div className="report-progress">
              <div
  className="report-progress-fill"
  style={{
    width: `${Math.min(
      Math.max(percentage, 0),
      100
    )}%`,
    backgroundColor:
      categoryColors[item.category] || '#646cff'
  }}
/>


              </div>
            </div>
          )
        })}
      </div>

    </div>
  )
}

export default FinancialReports
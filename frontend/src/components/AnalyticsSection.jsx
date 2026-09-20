import {
  BarChart,
  Bar,
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  ResponsiveContainer
} from 'recharts'

function AnalyticsSection({
  topCategory,
  largestExpense,
  averageExpense,
  expenses,

  chartData,
  formattedTrendData,

  currentMonthSpent,
  previousMonthSpent,
  spendingChange,

  categoryTotals,
  spent,

  formatCurrency
}) {
  return (
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
              ₹{formatCurrency(
                topCategory[1]
              )}
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
              ₹{formatCurrency(
                largestExpense.amount
              )}
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

        {chartData.length > 0 ? (
          <div className="chart-container">

            <ResponsiveContainer
              width="100%"
              height={300}
            >
              <BarChart data={chartData}>

                <XAxis dataKey="category" />

                <YAxis />

                <Tooltip />

                <Bar
                  dataKey="amount"
                  fill="#646cff"
                />

              </BarChart>
            </ResponsiveContainer>

          </div>
        ) : (
          <p>
            No spending data for this month.
          </p>
        )}

      </div>


      <div className="trend-analytics">

        <h2>6-Month Spending Trend</h2>

        <div className="month-comparison">

          <div>
            <p>This Month</p>

            <strong>
              ₹{formatCurrency(
                currentMonthSpent
              )}
            </strong>
          </div>


          <div>
            <p>Previous Month</p>

            <strong>
              ₹{formatCurrency(
                previousMonthSpent
              )}
            </strong>
          </div>


          <div>
            <p>Change</p>

            <strong>
              {spendingChange === null
                ? 'No comparison'
                : `${
                    Number(spendingChange) >= 0
                      ? '↑'
                      : '↓'
                  } ${Math.abs(
                    Number(spendingChange)
                  )}%`}
            </strong>
          </div>

        </div>


        {formattedTrendData.length === 0 ? (
          <p>
            No spending history available yet.
          </p>
        ) : (
          <div className="trend-chart">

            <ResponsiveContainer
              width="100%"
              height={300}
            >
              <LineChart
                data={formattedTrendData}
              >

                <CartesianGrid
                  strokeDasharray="3 3"
                />

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

        {Object.entries(
          categoryTotals
        ).length === 0 ? (
          <p>
            No spending data for this month.
          </p>
        ) : (
          Object.entries(
            categoryTotals
          ).map(([category, amount]) => {

            const percentage =
              spent > 0
                ? (
                    (amount / spent) *
                    100
                  ).toFixed(1)
                : 0

            return (
              <div
                className="category-row"
                key={category}
              >
                <span>
                  {category}
                </span>

                <span>
                  ₹{Number(
                    amount
                  ).toFixed(2)}
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
  )
}

export default AnalyticsSection
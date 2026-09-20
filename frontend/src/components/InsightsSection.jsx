function InsightsSection({
  financialOverview,
  spendingPace,topCategoryBudgetAlert,
  biggestCategoryChange,
  savingsInsight,
  upcomingPaymentAlert,
  recurringSummary,
  importantInsightCount,
  formatCurrency
}) {
  return (
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
          <p>Budget</p>

          <strong>
            {financialOverview.title}
          </strong>

          <span>
            {financialOverview.message}
          </span>
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


{topCategoryBudgetAlert && (
  <div
    className={`insight-item insight-item-${topCategoryBudgetAlert.type}`}
  >
    <p>Category Budget</p>

    <strong>
      {topCategoryBudgetAlert.category}
    </strong>

    <span>
      {topCategoryBudgetAlert.type ===
      'danger'
        ? `${topCategoryBudgetAlert.percentage.toFixed(
            1
          )}% used — category budget exceeded.`
        : `${topCategoryBudgetAlert.percentage.toFixed(
            1
          )}% used — approaching category limit.`}
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
  )
}

export default InsightsSection
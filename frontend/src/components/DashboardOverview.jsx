function DashboardOverview({
  budget,
  spent,
  remaining,
  topCategoryBudgetAlert,
  budgetInput,
  setBudgetInput,
  budgetUsedPercentage,
  budgetStatus,
  handleSaveBudget,

  topCategory,
  savingsSummary,
  recurringSummary,

  financialOverview,
  spendingPace,

  biggestCategoryChange,

  savingsInsight,
  savingsProgress,
  savingsRemaining,

  upcomingPaymentAlert,

  formatCurrency
}) {
  return (
    <>
      {/* =========================
          SUMMARY
          ========================= */}

      <div className="summary">

        <div className="summary-card">

          <p>Monthly Budget</p>

          <h2>
            ₹{formatCurrency(budget)}
          </h2>

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
              ? `${(
                  (spent / budget) *
                  100
                ).toFixed(1)}% used`
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
              setBudgetInput(
                event.target.value
              )
            }
          />

          <button
            onClick={handleSaveBudget}
          >
            Save Budget
          </button>

        </div>


        <div className="summary-card">
          <p>Total Spent</p>

          <h2>
            ₹{formatCurrency(spent)}
          </h2>
        </div>


        <div className="summary-card">
          <p>Remaining</p>

          <h2>
            ₹{formatCurrency(remaining)}
          </h2>
        </div>

      </div>


      {/* =========================
          OVERVIEW CARDS
          ========================= */}

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
              ₹{formatCurrency(
                topCategory[1]
              )}
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




      {/* =========================
          FINANCIAL OVERVIEW
          ========================= */}

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
                ? `${(
                    (spent / budget) *
                    100
                  ).toFixed(1)}%`
                : '—'}
            </strong>
          </span>

          <span>
            Savings progress

            <strong>
              {savingsSummary.goalsCount > 0
                ? `${savingsProgress.toFixed(
                    1
                  )}%`
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


{topCategoryBudgetAlert && (
  <div
    className={`category-budget-dashboard-alert category-budget-dashboard-alert-${topCategoryBudgetAlert.type}`}
  >
    <div>
      <p>Category Budget Alert</p>

      <strong>
        {topCategoryBudgetAlert.category}
      </strong>

      <span>
        {topCategoryBudgetAlert.type ===
        'danger'
          ? 'Category budget exceeded'
          : 'Approaching category limit'}
      </span>
    </div>

    <div className="category-budget-dashboard-values">
      <strong>
        {topCategoryBudgetAlert.percentage.toFixed(
          1
        )}
        %
      </strong>

      <span>
        ₹{formatCurrency(
          topCategoryBudgetAlert.spent
        )}
        {' / '}
        ₹{formatCurrency(
          topCategoryBudgetAlert.budget
        )}
      </span>
    </div>
  </div>
)}

      {/* =========================
          SPENDING PACE
          ========================= */}

      {spendingPace && (
        <div
          className={`spending-insight spending-insight-${spendingPace.type}`}
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


      {/* =========================
          CATEGORY INSIGHT
          ========================= */}

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

          {biggestCategoryChange
            .percentageChange !== null && (
            <small>
              {biggestCategoryChange
                .percentageChange >= 0
                ? '↑'
                : '↓'}
              {' '}
              {Math.abs(
                biggestCategoryChange
                  .percentageChange
              ).toFixed(1)}
              % month over month
            </small>
          )}

        </div>
      )}


      {/* =========================
          SAVINGS INSIGHT
          ========================= */}

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
              ₹{formatCurrency(
                savingsRemaining
              )}
              {' remaining across your goals'}
            </small>
          )}

        </div>
      )}


      {/* =========================
          UPCOMING PAYMENT
          ========================= */}

      <div className="dashboard-next">

        <h2>Upcoming Payment</h2>

        {recurringSummary.nextExpense ? (
          <div className="upcoming-payment">

            <div>
              <strong>
                {
                  recurringSummary
                    .nextExpense.title
                }
              </strong>

              <p>
                {
                  recurringSummary
                    .nextExpense.category
                }
                {' • '}
                {
                  recurringSummary
                    .nextExpense.frequency
                }
              </p>
            </div>


            <div className="upcoming-payment-details">

              <strong>
                ₹{formatCurrency(
                  recurringSummary
                    .nextExpense.amount
                )}
              </strong>

              <p>
                {new Date(
                  recurringSummary
                    .nextExpense
                    .next_due_date
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
                  {
                    upcomingPaymentAlert
                      .label
                  }
                </span>
              )}

            </div>

          </div>
        ) : (
          <p>
            No upcoming recurring expenses.
          </p>
        )}

      </div>

    </>
  )
}

export default DashboardOverview
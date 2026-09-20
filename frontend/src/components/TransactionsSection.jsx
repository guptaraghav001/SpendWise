function TransactionsSection({
  loading,
  error,

  expenses,
  filteredExpenses,

  searchTerm,
  setSearchTerm,

  filterCategory,
  setFilterCategory,

  sortOption,
  setSortOption,

  showForm,
  setShowForm,

  title,
  setTitle,

  amount,
  setAmount,

  category,
  setCategory,

  expenseDate,
  setExpenseDate,

  editingId,
  savingExpense,

  handleExportCSV,
  handleAddExpense,
  handleUpdateExpense,
  handleEditExpense,
  handleDeleteExpense
}) {
  return (
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

        <button
          onClick={() => setShowForm(true)}
        >
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
          <option value="All">
            All Categories
          </option>

          <option value="Food">Food</option>
          <option value="Travel">Travel</option>
          <option value="Shopping">
            Shopping
          </option>
          <option value="Bills">Bills</option>
          <option value="Other">Other</option>
        </select>

        <select
          value={sortOption}
          onChange={(event) =>
            setSortOption(event.target.value)
          }
        >
          <option value="newest">
            Newest First
          </option>

          <option value="oldest">
            Oldest First
          </option>

          <option value="highest">
            Highest Amount
          </option>

          <option value="lowest">
            Lowest Amount
          </option>
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
            onChange={(event) =>
              setTitle(event.target.value)
            }
          />

          <input
            type="number"
            min="0.01"
            step="0.01"
            placeholder="Amount"
            value={amount}
            onChange={(event) =>
              setAmount(event.target.value)
            }
          />

          <input
            type="date"
            value={expenseDate}
            onChange={(event) =>
              setExpenseDate(
                event.target.value
              )
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


      {!loading &&
        !error &&
        expenses.length === 0 && (
          <p>
            No expenses recorded for this month.
          </p>
        )}


      {!loading &&
        !error &&
        expenses.length > 0 &&
        filteredExpenses.length === 0 && (
          <p>
            No expenses match your search
            or filters.
          </p>
        )}


      {filteredExpenses.map((expense) => (
        <div
          className="transaction"
          key={expense.id}
        >

          <div>
            <strong>
              {expense.title}
            </strong>

            <p>{expense.category}</p>

            <small>
              {new Date(
                expense.expense_date
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
                handleDeleteExpense(
                  expense.id
                )
              }
            >
              Delete
            </button>

          </div>

        </div>
      ))}

    </div>
  )
}

export default TransactionsSection
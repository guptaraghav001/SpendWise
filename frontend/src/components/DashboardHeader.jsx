function DashboardHeader({
  user,
  selectedMonth,
  selectedYear,
  monthNames,
  onPreviousMonth,
  onNextMonth,
  onLogout
}) {
  return (
    <div className="dashboard-header">

      <div>
        <h1>SpendWise</h1>

        {user && (
          <p>Welcome, {user.name}</p>
        )}

        <p>Your monthly overview</p>

        <div className="month-selector">

          <button onClick={onPreviousMonth}>
            ←
          </button>

          <strong>
            {monthNames[selectedMonth - 1]} {selectedYear}
          </strong>

          <button onClick={onNextMonth}>
            →
          </button>

        </div>
      </div>

      <button onClick={onLogout}>
        Logout
      </button>

    </div>
  )
}

export default DashboardHeader





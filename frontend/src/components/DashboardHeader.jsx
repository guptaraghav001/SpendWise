function DashboardHeader({
  user,
  selectedMonth,
  selectedYear,
  monthNames,
  onPreviousMonth,
  onNextMonth,
  onLogout ,activeSection,
}) {


  const sectionInfo = {
  dashboard: {
    title: 'Dashboard',
    subtitle: 'Your monthly financial overview'
  },

  transactions: {
    title: 'Transactions',
    subtitle: 'Manage and review your monthly expenses'
  },

  analytics: {
    title: 'Analytics',
    subtitle: 'Understand your spending patterns'
  },

  savings: {
    title: 'Savings Goals',
    subtitle: 'Track progress towards your financial goals'
  },

  recurring: {
    title: 'Recurring Expenses',
    subtitle: 'Manage expenses that repeat automatically'
  },

  insights: {
    title: 'Insights',
    subtitle: 'Get actionable insights about your finances'
  }
}

const currentSection =
  sectionInfo[activeSection] ||
  sectionInfo.dashboard

const showMonthSelector =
  activeSection === 'dashboard' ||
  activeSection === 'transactions' ||
  activeSection === 'analytics'


  
  return (
    <div className="dashboard-header">

      <div>
       <h1>{currentSection.title}</h1>

<p>
  Welcome, {user?.name}
</p>

<p>
  {currentSection.subtitle}
</p>

       {showMonthSelector && (

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

)}
      </div>

     

    </div>
  )
}

export default DashboardHeader





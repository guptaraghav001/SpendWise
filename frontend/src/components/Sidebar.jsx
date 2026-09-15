function Sidebar({
  activeSection,
  onSectionChange,
  onLogout
}) {
  return (
    <aside className="sidebar">

      <div className="sidebar-brand">
        <h2>SpendWise</h2>
        <span>Personal Finance</span>
      </div>

      <nav className="sidebar-nav">

        <button
          className={
            activeSection === 'dashboard'
              ? 'active'
              : ''
          }
          onClick={() =>
            onSectionChange('dashboard')
          }
        >
          Dashboard
        </button>

        <button
          className={
            activeSection === 'transactions'
              ? 'active'
              : ''
          }
          onClick={() =>
            onSectionChange('transactions')
          }
        >
          Transactions
        </button>

        <button
          className={
            activeSection === 'analytics'
              ? 'active'
              : ''
          }
          onClick={() =>
            onSectionChange('analytics')
          }
        >
          Analytics
        </button>

        <button
          className={
            activeSection === 'savings'
              ? 'active'
              : ''
          }
          onClick={() =>
            onSectionChange('savings')
          }
        >
          Savings Goals
        </button>

        <button
          className={
            activeSection === 'recurring'
              ? 'active'
              : ''
          }
          onClick={() =>
            onSectionChange('recurring')
          }
        >
          Recurring
        </button>

      </nav>

      <button
        className="sidebar-logout"
        onClick={onLogout}
      >
        Logout
      </button>

    </aside>
  )
}

export default Sidebar
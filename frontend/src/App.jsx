import { useState } from 'react'
import './App.css'



import LandingPage from './pages/LandingPage.jsx'
import LoginPage from './pages/LoginPage.jsx'
import RegisterPage from './pages/RegisterPage.jsx'
import DashboardPage from './pages/DashboardPage.jsx'
function App() {
const [page, setPage] = useState(() => {
  const token = localStorage.getItem('token')

  return token ? 'dashboard' : 'landing'
})
  return (
    <div className="app">

      {page === 'landing' && (
        <LandingPage
          onGetStarted={() => setPage('login')}
        />
      )}

      {page === 'login' && (
        <LoginPage
          onRegister={() => setPage('register')}
          onLogin={() => setPage('dashboard')}
        />
      )}

      {page === 'register' && (
        <RegisterPage
          onLogin={() => setPage('login')}
        />
      )}

      {page === 'dashboard' && (
  <DashboardPage
    onLogout={() => setPage('login')}
  />
)}

    </div>
  )
}

export default App
import { useState } from 'react'

function LoginPage({ onRegister , onLogin}) {

  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')

  const handleLogin = () => {

  if (!email || !password) {
    alert('Please enter email and password')
    return
  }

  const loginData = {
    email,
    password
  }

  fetch('http://localhost:5001/api/auth/login', {
    method: 'POST',

    headers: {
      'Content-Type': 'application/json'
    },

    body: JSON.stringify(loginData)
  })
    .then(async (response) => {

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.message)
      }

      return data
    })
    .then((data) => {

      localStorage.setItem('token', data.token)

      localStorage.setItem(
        'user',
        JSON.stringify(data.user)
      )

      onLogin()
    })
    .catch((error) => {

      alert(error.message)

    })
}

  return (
    <div className="login-card">

      <h1>Welcome Back</h1>

      <p>Login to your SpendWise account</p>

      <input
        type="email"
        placeholder="Email"
        value={email}
        onChange={(event) => setEmail(event.target.value)}
      />

      <input
        type="password"
        placeholder="Password"
        value={password}
        onChange={(event) => setPassword(event.target.value)}
      />

      <button onClick={handleLogin}>
        Login
      </button>

      <p>
        Don't have an account?{' '}
        <button className="text-button" onClick={onRegister}>
          Register
        </button>
      </p>

    </div>
  )
}





export default LoginPage
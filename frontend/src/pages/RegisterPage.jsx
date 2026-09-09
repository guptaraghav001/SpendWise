import { useState } from 'react'

function RegisterPage({ onLogin }) {

  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')

  const handleRegister = () => {

  if (!name || !email || !password || !confirmPassword) {
    alert('Please fill in all fields')
    return
  }

  if (password !== confirmPassword) {
    alert('Passwords do not match')
    return
  }

  const userData = {
    name,
    email,
    password
  }

  fetch('http://localhost:5001/api/auth/register', {
    method: 'POST',

    headers: {
      'Content-Type': 'application/json'
    },

    body: JSON.stringify(userData)
  })
    .then(async (response) => {

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.message)
      }

      return data
    })
    .then((data) => {

      alert(data.message)

      onLogin()
    })
    .catch((error) => {

      alert(error.message)

    })
}

  return (
    <div className="login-card">

      <h1>Create Account</h1>

      <p>Start managing your money with SpendWise</p>

      <input
        type="text"
        placeholder="Full Name"
        value={name}
        onChange={(event) => setName(event.target.value)}
      />

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

      <input
        type="password"
        placeholder="Confirm Password"
        value={confirmPassword}
        onChange={(event) => setConfirmPassword(event.target.value)}
      />

      <button onClick={handleRegister}>
        Create Account
      </button>

      <p>
        Already have an account?{' '}
        <button className="text-button" onClick={onLogin}>
          Login
        </button>
      </p>

    </div>
  )
}

export default RegisterPage
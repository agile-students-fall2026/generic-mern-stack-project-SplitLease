import React, { useState } from 'react'
import './Login.css'
import { mockLogin } from './mockAuth'

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

const Login = props => {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [errors, setErrors] = useState({})
  const [authError, setAuthError] = useState('')
  const [loading, setLoading] = useState(false)

  const validate = () => {
    const newErrors = {}
    if (!email.trim()) {
      newErrors.email = 'Email is required'
    } else if (!EMAIL_PATTERN.test(email.trim())) {
      newErrors.email = 'Enter a valid email address'
    }
    if (!password) {
      newErrors.password = 'Password is required'
    }
    return newErrors
  }

  const handleSubmit = async e => {
    e.preventDefault()
    setAuthError('')
    const newErrors = validate()
    setErrors(newErrors)
    if (Object.keys(newErrors).length > 0) return

    setLoading(true)
    const user = await mockLogin(email, password)
    setLoading(false)

    if (!user) {
      setAuthError('Incorrect email or password. Please try again.')
      return
    }
    // redirect to the user's home page (handled by App.jsx once routing is set up)
    if (props.onLoginSuccess) props.onLoginSuccess(user)
  }

  return (
    <div className="loginContainer">
      <div className="loginLogo">SplitLease</div>

      <form className="loginCard" onSubmit={handleSubmit} noValidate>
        <h1 className="loginTitle">Welcome back</h1>
        <p className="loginSubtitle">Log in to see your households</p>

        {authError && (
          <div className="loginAlert" role="alert">
            {authError}
          </div>
        )}

        <label className="fieldLabel" htmlFor="loginEmail">
          Email
        </label>
        <input
          id="loginEmail"
          type="email"
          className={errors.email ? 'textInput inputError' : 'textInput'}
          placeholder="you@example.com"
          value={email}
          onChange={e => setEmail(e.target.value)}
          autoComplete="email"
        />
        {errors.email && <p className="fieldError">{errors.email}</p>}

        <label className="fieldLabel" htmlFor="loginPassword">
          Password
        </label>
        <input
          id="loginPassword"
          type="password"
          className={errors.password ? 'textInput inputError' : 'textInput'}
          placeholder="Enter your password"
          value={password}
          onChange={e => setPassword(e.target.value)}
          autoComplete="current-password"
        />
        {errors.password && <p className="fieldError">{errors.password}</p>}

        <button className="loginButton" type="submit" disabled={loading}>
          {loading ? 'Logging in...' : 'Log in'}
        </button>

        <p className="registerPrompt">
          Don&apos;t have an account?{' '}
          <button
            type="button"
            className="linkButton"
            onClick={() => props.onRegisterClick && props.onRegisterClick()}
          >
            Register
          </button>
        </p>
      </form>
    </div>
  )
}

export default Login

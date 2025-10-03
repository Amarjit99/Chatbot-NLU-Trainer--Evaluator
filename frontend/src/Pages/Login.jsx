import React, { useState, useEffect, useRef } from 'react'
import axios from 'axios'
import { FiMail, FiLock, FiEye, FiEyeOff } from 'react-icons/fi'
import './Login.css'

// Configure axios defaults
axios.defaults.withCredentials = true
axios.defaults.timeout = 10000

function Login({ goToSignup, onLoginSuccess }) {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const typedRef = useRef(null)

  useEffect(() => {
    // Simple static text instead of typed.js to avoid import issues
    if (typedRef.current) {
      typedRef.current.textContent = 'Welcome to MyChat!!'
    }
  }, [])

  const handleLogin = async (e) => {
    e.preventDefault()
    if (isSubmitting) return
    setIsSubmitting(true)
    try {
      console.log('Attempting login with:', { email })
      console.log('Sending request to:', 'http://localhost:3001/api/auth/login')
      const res = await axios.post('http://localhost:3001/api/auth/login', {
        email: email,
        password: password,
      }, {
        headers: {
          'Content-Type': 'application/json'
        },
        withCredentials: true,
        timeout: 10000
      })
      console.log('Login response:', res.data)
      if (res.status === 200) {
        alert('Login successful')
        const token = res?.data?.token
        if (token) localStorage.setItem('auth_token', token)
        if (typeof onLoginSuccess === 'function') onLoginSuccess()
      }
    } catch (err) {
      console.error('Login error:', err)
      const status = err?.response?.status
      const message = err?.response?.data?.message
      if (err.code === 'ECONNREFUSED' || err.code === 'ERR_NETWORK') {
        alert('Cannot connect to server. Please check if the backend is running on port 3001.')
      } else if (status === 401) {
        alert('Invalid credentials')
      } else if (message) {
        alert(message)
      } else {
        alert(`Login failed: ${err.message || 'Please try again later.'}`)
      }
    } finally {
      setIsSubmitting(false)
    }
  }

  const togglePasswordVisibility = () => {
    setShowPassword(!showPassword)
  }

  return (
    <div className="login-container">
      <div className="website-title">
        <span>Welcome to MyChat!!</span>
      </div>
      <h2>Login</h2>
      <form onSubmit={handleLogin}>
        <div className="input-container">
          <span className="input-icon"><FiMail /></span>
          <input 
            type="email" 
            placeholder="Email" 
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required 
          />
        </div>
        <div className="password-input-container">
          <span className="input-icon"><FiLock /></span>
          <input 
            type={showPassword ? "text" : "password"}
            placeholder="Password" 
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required 
          />
          <button 
            type="button" 
            className="password-toggle-btn"
            onClick={togglePasswordVisibility}
            aria-label={showPassword ? 'Hide password' : 'Show password'}
          >
            {showPassword ? <FiEyeOff /> : <FiEye />}
          </button>
        </div>
        <button type="submit" disabled={isSubmitting}>{isSubmitting ? 'Logging in...' : 'Login'}</button>
      </form>
      <p>
        Don't have an account? <span onClick={goToSignup}>Sign up</span>
      </p>
    </div>
  )
}

export default Login

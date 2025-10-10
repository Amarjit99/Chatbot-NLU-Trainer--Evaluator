import React, { useState, useEffect, useRef } from 'react'
import './Signup.css'
import axios from 'axios'
import { FiUser, FiMail, FiLock, FiEye, FiEyeOff } from 'react-icons/fi'

// Configure axios defaults
axios.defaults.withCredentials = true
axios.defaults.timeout = 10000

function Signup({ goToLogin, onSignupSuccess }) {
  const [username, setUsername] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)

  // Debug logging for state changes
  React.useEffect(() => {
    console.log('🔍 Signup state:', { username, email, passwordLength: password.length });
  }, [username, email, password]);
  const typedRef = useRef(null)

  useEffect(() => {
    // Try to load typed.js safely
    const initTyped = async () => {
      try {
        const { default: Typed } = await import('typed.js')
        if (typedRef.current) {
          const typed = new Typed(typedRef.current, {
            strings: ['Welcome to Chatbot NLU Trainer & Evaluator'],
            typeSpeed: 80,
            backSpeed: 40,
            loop: false,
            showCursor: false,
          })
          return () => typed.destroy()
        }
      } catch (error) {
        console.log('Typed.js not available, using static text')
        if (typedRef.current) {
          typedRef.current.textContent = 'Welcome to Chatbot NLU Trainer & Evaluator'
        }
      }
    }
    initTyped()
  }, [])

  const handleSignup = async (e) => {
    e.preventDefault();
    if (isSubmitting) return
    
    // Enhanced validation
    if (!username.trim() || !email.trim() || !password.trim()) {
      alert('Please fill in all fields')
      return
    }
    
    if (password.length < 6) {
      alert('Password must be at least 6 characters long')
      return
    }
    
    setIsSubmitting(true)
    try {
      console.log('🆕 Attempting signup with:', { username, email, passwordLength: password.length })
      console.log('📡 Sending request to:', 'http://localhost:3001/api/auth/register')
      
      const res = await axios.post('http://localhost:3001/api/auth/register', {
        username: username.trim(),
        email: email.trim().toLowerCase(),
        password: password,
      }, {
        headers: {
          'Content-Type': 'application/json'
        },
        withCredentials: true,
        timeout: 15000
      })
      
      console.log('✅ Signup response:', res.data)
      if (res.status === 201 && res.data.token) {
        localStorage.setItem('auth_token', res.data.token)
        alert(`Welcome ${res.data.user.username}! Account created successfully.`)
        console.log('🔑 Token stored successfully')
        if (typeof onSignupSuccess === 'function') {
          onSignupSuccess()
        } else if (typeof goToLogin === 'function') {
          goToLogin()
        }
      } else {
        throw new Error('No token received from server')
      }
    } catch (err) {
      console.error('Signup error:', err)
      const status = err?.response?.status
      const message = err?.response?.data?.message
      if (err.code === 'ECONNREFUSED' || err.code === 'ERR_NETWORK') {
        alert('Cannot connect to server. Please check if the backend is running on port 3001.')
      } else if (status === 409) {
        alert('Email already exists')
      } else if (message) {
        alert(message)
      } else {
        alert(`Signup failed: ${err.message || 'Please try again later.'}`)
      }
    } finally {
      setIsSubmitting(false)
    }
  }

  const togglePasswordVisibility = () => {
    setShowPassword(!showPassword)
  }

  return (
    <div className="signup-container">
      <div className="website-title">
        <span ref={typedRef}>Welcome to Chatbot NLU Trainer & Evaluator</span>
      </div>
      <h2>Create Your Account</h2>
      <form onSubmit={handleSignup} className="auth-form">
        <div className="input-container">
          <span className="input-icon"><FiUser /></span>
          <input 
            type="text" 
            placeholder="Username" 
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            onInput={(e) => setUsername(e.target.value)}
            disabled={isSubmitting}
            autoComplete="username"
            style={{ pointerEvents: 'auto', zIndex: 1 }}
            required 
          />
        </div>
        <div className="input-container">
          <span className="input-icon"><FiMail /></span>
          <input 
            type="email" 
            placeholder="Email" 
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            onInput={(e) => setEmail(e.target.value)}
            disabled={isSubmitting}
            autoComplete="email"
            style={{ pointerEvents: 'auto', zIndex: 1 }}
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
            onInput={(e) => setPassword(e.target.value)}
            disabled={isSubmitting}
            autoComplete="new-password"
            style={{ pointerEvents: 'auto', zIndex: 1 }}
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
        <button type="submit" disabled={isSubmitting}>{isSubmitting ? 'Signing up...' : 'Sign Up'}</button>
      </form>
      <p>
        Already have an account? <span onClick={goToLogin}>Login</span>
      </p>
    </div>
  )
}

export default Signup

import React, { useState, useEffect, useRef } from 'react'
import axios from 'axios'
import ReCAPTCHA from 'react-google-recaptcha'
import { FiMail, FiLock, FiEye, FiEyeOff } from 'react-icons/fi'
import { RECAPTCHA_SITE_KEY } from '../config/recaptcha'
import './Login.css'

axios.defaults.withCredentials = true
axios.defaults.timeout = 10000

function Login({ goToSignup, onLoginSuccess }) {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [recaptchaToken, setRecaptchaToken] = useState(null)
  const recaptchaRef = useRef(null)

  React.useEffect(() => {
    console.log('🔍 Login state:', { email, passwordLength: password.length });
  }, [email, password]);
  
  const typedRef = useRef(null)

  useEffect(() => {
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

  const handleLogin = async (e) => {
    e.preventDefault()
    if (isSubmitting) return
    
    if (!email.trim() || !password.trim()) {
      alert('Please fill in both email and password')
      return
    }

    if (!recaptchaToken) {
      alert('Please complete the reCAPTCHA verification')
      return
    }
    
    setIsSubmitting(true)
    try {
      console.log('🔐 Attempting login with:', { email, passwordLength: password.length })
      console.log('📡 Sending request to:', 'http://localhost:3001/api/auth/login')
      
      const res = await axios.post('http://localhost:3001/api/auth/login', {
        email: email.trim(),
        password: password,
        recaptchaToken: recaptchaToken,
      }, {
        headers: {
          'Content-Type': 'application/json'
        },
        withCredentials: true,
        timeout: 15000
      })
      
      console.log('✅ Login response:', res.data)
      if (res.status === 200 && res.data.token) {
        alert(`Welcome back, ${res.data.user.username}!`)
        try { const { setAuthToken } = await import('../utils/auth'); setAuthToken(res.data.token, true); } catch (e) { console.warn('Failed to persist token via helper', e); }
        if (typeof onLoginSuccess === 'function') {
          onLoginSuccess()
        }
      } else {
        throw new Error('No token received from server')
      }
    } catch (err) {
      if (recaptchaRef.current) {
        recaptchaRef.current.reset()
        setRecaptchaToken(null)
      }
      
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

  const handleRecaptchaChange = (token) => {
    setRecaptchaToken(token)
  }

  return (
    <div className="login-container">
      <div className="website-title">
        <span>Welcome to Chatbot NLU Trainer & Evaluator</span>
      </div>
      <h2>Sign In to Your Account</h2>
      <form onSubmit={handleLogin} className="auth-form">
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
            autoComplete="current-password"
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
        <div className="recaptcha-container">
          <ReCAPTCHA
            ref={recaptchaRef}
            sitekey={RECAPTCHA_SITE_KEY}
            onChange={handleRecaptchaChange}
            onExpired={() => setRecaptchaToken(null)}
            onErrored={() => setRecaptchaToken(null)}
          />
        </div>
        <button type="submit" disabled={isSubmitting || !recaptchaToken}>
          {isSubmitting ? 'Logging in...' : 'Login'}
        </button>
      </form>
      <p>
        Don't have an account? <span onClick={goToSignup}>Sign up</span>
      </p>
    </div>
  )
}

export default Login

import React, { useState } from 'react'
import './App.css'
import AnimatedBackground from './components/AnimatedBackground'
import BgToggle from './components/BgToggle'
import ThemeToggle from './components/ThemeToggle'
import { useEffect } from 'react'
import Login from './Pages/Login'
import Signup from './Pages/Signup'
import Workspace from './Pages/Workspace'

function App() {
  const [page, setPage] = useState('login') // Start with login page
  const [bgVisible, setBgVisible] = useState(true)
  const [darkMode, setDarkMode] = useState(false)

  useEffect(() => {
    const stored = localStorage.getItem('animatedBgVisible')
    if (stored !== null) setBgVisible(stored === '1')
    const th = localStorage.getItem('darkMode')
    if (th !== null) setDarkMode(th === '1')
  }, [])

  useEffect(() => {
    localStorage.setItem('animatedBgVisible', bgVisible ? '1' : '0')
  }, [bgVisible])

  useEffect(() => {
    localStorage.setItem('darkMode', darkMode ? '1' : '0')
  }, [darkMode])

  return (
    <div className={"app" + (bgVisible ? ' bg-animated-on' : ' bg-animated-off') + (darkMode ? ' theme-dark' : ' theme-light')}>
      <AnimatedBackground visible={bgVisible} />
      <BgToggle checked={bgVisible} onChange={v => setBgVisible(v)} />
      <ThemeToggle checked={darkMode} onChange={v => setDarkMode(v)} />
      {page === 'login' && (
        <Login goToSignup={() => setPage('signup')} onLoginSuccess={() => setPage('workspace')} />
      )}
      {page === 'signup' && (
        <Signup goToLogin={() => setPage('login')} onSignupSuccess={() => setPage('workspace')} />
      )}
      {page === 'workspace' && (
        <Workspace goToLogin={() => setPage('login')} darkMode={darkMode} setDarkMode={setDarkMode} />
      )}
    </div>
  )
}

export default App

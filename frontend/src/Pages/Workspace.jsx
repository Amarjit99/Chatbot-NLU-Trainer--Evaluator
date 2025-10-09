import React, { useEffect, useMemo, useState } from 'react'
import axios from 'axios'
import './workspace.css'
import { FiPlus, FiFolder, FiUpload, FiCpu, FiCheck, FiBarChart2, FiGitBranch, FiTag, FiTarget, FiSettings, FiChevronDown, FiUsers, FiGrid, FiUser, FiLogOut } from 'react-icons/fi'
import UserProfile from './UserProfile'

// Phase 2: Multi-Backend Training System Components
import EvaluationDashboard from './EvaluationDashboard'
import ModelVersioningDashboard from './ModelVersioningDashboard' 
import EntityAnnotation from './EntityAnnotation'
import MultiBackendTraining from './MultiBackendTraining' // PHASE 2 MAIN COMPONENT

// Phase 3: Active Learning Component
import ActiveLearningDashboard from './ActiveLearningDashboard' // PHASE 3 MAIN COMPONENT

// Phase 4: Admin Dashboard Component
import AdminDashboard from './AdminDashboard' // SAFE VERSION - FIXED FOR STABILITY

function parseCsv(text) {
  const lines = text.split(/\r?\n/).filter(Boolean)
  if (lines.length === 0) return []
  const headers = lines[0].split(',').map(h => h.trim())
  return lines.slice(1).map(line => {
    const parts = []
    let cur = '', inQ = false
    for (let i = 0; i < line.length; i++) {
      const ch = line[i]
      if (ch === '"') inQ = !inQ
      else if (ch === ',' && !inQ) { parts.push(cur); cur = '' } else cur += ch
    }
    parts.push(cur)
    const row = {}
    headers.forEach((h, i) => row[h] = (parts[i] || '').trim())
    return row
  })
}

function buildOverview(data) {
  const totalRecords = data.length
  const intentSet = new Set()
  const entitySet = new Set()
  for (const item of data) {
    const intent = item.intent || item.Intent || item.label
    if (intent) intentSet.add(String(intent))
    const entities = item.entities || item.entity || item.Entities
    if (Array.isArray(entities)) {
      for (const e of entities) entitySet.add(String(e.entity || e))
    } else if (typeof entities === 'string') {
      entitySet.add(entities)
    }
  }
  return { totalRecords, intents: intentSet.size, entities: entitySet.size, sample: data.slice(0, 3) }
}

function suggestIntents(text) {
  const t = (text || '').toLowerCase()
  const suggestions = new Set()
  if (/biryani|biriyani|restaurant|eat|dinner|lunch|food/.test(t)) suggestions.add('book_table')
  if (/flight|book\s+flight|ticket|plane/.test(t)) suggestions.add('book_flight')
  if (/hotel|stay|room/.test(t)) suggestions.add('book_hotel')
  if (/taxi|cab|ride/.test(t)) suggestions.add('book_taxi')
  if (/weather|forecast|temperature/.test(t)) suggestions.add('check_weather')
  return Array.from(suggestions)
}

export default function Workspace({ goToLogin }) {
  const [workspaces, setWorkspaces] = useState([])
  const [newWs, setNewWs] = useState('')
  const [selectedWorkspace, setSelectedWorkspace] = useState(null)

  const [file, setFile] = useState(null)
  const [data, setData] = useState([])
  const [isTraining, setIsTraining] = useState(false)
  const [trainingStatus, setTrainingStatus] = useState('')
  const [modelInfo, setModelInfo] = useState(null)
  const overview = useMemo(() => buildOverview(data), [data])

  // Samples from JSON and intent text box
  const [samples, setSamples] = useState([])
  const [utterance, setUtterance] = useState('')
  const [suggested, setSuggested] = useState([])
  const [predictionResult, setPredictionResult] = useState(null)
  const [isPredicting, setIsPredicting] = useState(false)

  // Dashboard tabs
  const [activeTab, setActiveTab] = useState('training')

  // User role management
  const [userRole, setUserRole] = useState(null)
  const [isLoadingUser, setIsLoadingUser] = useState(true)
  const [user, setUser] = useState(null)
  const [showProfile, setShowProfile] = useState(false)

  // Drag and drop states
  const [isDragOver, setIsDragOver] = useState(false)

  // Workspace selection states
  const [showWorkspaceSelection, setShowWorkspaceSelection] = useState(false)
  const [workspaceCreationMode, setWorkspaceCreationMode] = useState(null) // 'existing' or 'new'

  // Pre-defined workspace templates
  const existingWorkspaces = [
    {
      id: 'hr_bot_001',
      name: 'HR Bot',
      description: 'Human Resources chatbot for employee queries, leave management, and policy information',
      icon: '👥',
      category: 'Business & HR',
      color: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
      modelsCount: 3,
      datasetsCount: 2,
      lastAccessed: '2024-01-20',
      sampleIntents: ['leave_request', 'payroll_inquiry', 'benefits_info', 'policy_question'],
      sampleData: [
        { text: "How many vacation days do I have left?", intent: "leave_request" },
        { text: "When will I get my salary?", intent: "payroll_inquiry" },
        { text: "What are my health insurance benefits?", intent: "benefits_info" },
        { text: "What's the dress code policy?", intent: "policy_question" }
      ]
    },
    {
      id: 'travel_bot_001',
      name: 'Travel Bot',
      description: 'Travel booking and assistance chatbot for flights, hotels, and travel planning',
      icon: '✈️',
      category: 'Travel & Tourism',
      color: 'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)',
      modelsCount: 2,
      datasetsCount: 3,
      lastAccessed: '2024-01-18',
      sampleIntents: ['book_flight', 'hotel_reservation', 'travel_info', 'cancel_booking'],
      sampleData: [
        { text: "I want to book a flight to Paris", intent: "book_flight" },
        { text: "Find me a hotel near downtown", intent: "hotel_reservation" },
        { text: "What's the weather like in Tokyo?", intent: "travel_info" },
        { text: "I need to cancel my reservation", intent: "cancel_booking" }
      ]
    },
    {
      id: 'support_bot_001',
      name: 'Support Bot',
      description: 'Customer support chatbot for technical assistance and issue resolution',
      icon: '🛠️',
      category: 'Customer Support',
      color: 'linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)',
      modelsCount: 4,
      datasetsCount: 1,
      lastAccessed: '2024-01-22',
      sampleIntents: ['technical_issue', 'billing_inquiry', 'product_info', 'complaint'],
      sampleData: [
        { text: "I can't log into my account", intent: "technical_issue" },
        { text: "Why was I charged twice?", intent: "billing_inquiry" },
        { text: "How do I use this feature?", intent: "product_info" },
        { text: "I want to file a complaint", intent: "complaint" }
      ]
    }
  ]

  // Function to check if user is admin
  const isAdmin = () => {
    return userRole === 'admin'
  }

  const handleLogout = () => {
    // Clear tokens from both session and local storage
    sessionStorage.removeItem('authToken')
    localStorage.removeItem('authToken')
    localStorage.removeItem('token')
    setUser(null)
    setUserRole(null)
    goToLogin()
  }

  // Function to get user info from token
  const getUserInfo = async () => {
    try {
      // Try sessionStorage first (tab-specific), then localStorage
      const token = sessionStorage.getItem('authToken') || localStorage.getItem('authToken')
      if (!token) {
        setIsLoadingUser(false)
        return
      }

      const response = await axios.get('http://localhost:3001/api/auth/me', {
        headers: { 'Authorization': `Bearer ${token}` }
      })

      setUserRole(response.data.user.role)
      setUser(response.data.user)
      setIsLoadingUser(false)
    } catch (error) {
      console.error('Error getting user info:', error)
      setUserRole(null)
      setUser(null)
      setIsLoadingUser(false)
      // If token is invalid, redirect to login
      if (error.response?.status === 401 || error.response?.status === 403) {
        goToLogin()
      }
    }
  }

  // Handle admin tab access
  const handleAdminTabClick = () => {
    if (isLoadingUser) {
      return // Don't allow tab switch while loading
    }
    if (!isAdmin()) {
      alert('⚠️ Access Denied: Administrator privileges required')
      return
    }
    setActiveTab('admin')
  }

  // Handle workspace selection from existing workspaces
  const selectExistingWorkspace = (workspace) => {
    const newWorkspace = {
      id: workspace.id,
      name: workspace.name,
      createdAt: new Date().toISOString().split('T')[0],
      description: workspace.description,
      icon: workspace.icon,
      category: workspace.category
    }
    
    // Check if workspace already exists
    if (workspaces.some(w => w.id === workspace.id)) {
      alert('This workspace is already in your list!')
      return
    }
    
    setWorkspaces([newWorkspace, ...workspaces])
    setSelectedWorkspace(newWorkspace)
    setShowWorkspaceSelection(false)
    setData(workspace.sampleData || [])
    alert(`${workspace.name} workspace added successfully!`)
  }

  // Function to fetch user's workspaces from database
  const fetchUserWorkspaces = async () => {
    try {
      // Try sessionStorage first (tab-specific), then localStorage
      const token = sessionStorage.getItem('authToken') || localStorage.getItem('authToken')
      
      if (!token) {
        console.log('No auth token, loading predefined workspaces only')
        setWorkspaces(existingWorkspaces)
        return
      }

      const response = await fetch('http://localhost:3001/api/workspaces', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      })

      if (response.ok) {
        const data = await response.json()
        console.log('✅ Fetched user workspaces:', data.workspaces)
        
        // Combine user's database workspaces with predefined ones
        const userWorkspaces = data.workspaces.map(ws => ({
          id: ws.id,
          name: ws.name,
          description: ws.description || `Workspace created on ${new Date(ws.createdAt).toLocaleDateString()}`,
          icon: '📁',
          category: 'Custom Workspace', 
          color: 'linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)',
          modelsCount: ws.modelsCount || 0,
          datasetsCount: ws.datasetsCount || 0,
          owner: ws.owner,
          status: ws.status,
          createdAt: ws.createdAt,
          lastAccessed: new Date(ws.createdAt).toISOString().split('T')[0]
        }))
        
        // Show user workspaces first, then predefined ones
        setWorkspaces([...userWorkspaces, ...existingWorkspaces])
        
      } else {
        console.log('Failed to fetch workspaces, using predefined ones')
        setWorkspaces(existingWorkspaces)
      }
      
    } catch (error) {
      console.error('Error fetching workspaces:', error)
      setWorkspaces(existingWorkspaces)
    }
  }

  useEffect(() => {
    fetch('/data/utterances.json')
      .then(r => r.json())
      .then(list => {
        if (Array.isArray(list)) setSamples(list)
      })
      .catch(() => {})
    
    // Load user info and role
    getUserInfo()
    // Load user's workspaces
    fetchUserWorkspaces()
  }, [])

  useEffect(() => {
    setSuggested(suggestIntents(utterance))
  }, [utterance])

  const createWorkspace = async (e) => {
    e.preventDefault()
    const name = newWs.trim()
    if (!name) return
    
    // Check for duplicate workspace names locally first
    if (workspaces.some(w => w.name.toLowerCase() === name.toLowerCase())) {
      alert('⚠️ Workspace with this name already exists!')
      return
    }
    
    // Add loading state
    const createBtn = e.target.querySelector('.ws-create-btn')
    const createSection = document.querySelector('.ws-create-section')
    
    if (createBtn) {
      createBtn.classList.add('loading')
      createBtn.disabled = true
      createBtn.textContent = 'Creating...'
    }
    
    try {
      // Try sessionStorage first (tab-specific), then localStorage
      const token = sessionStorage.getItem('authToken') || localStorage.getItem('authToken')
      
      // Call backend API to create workspace
      const response = await fetch('http://localhost:3001/api/workspaces', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          name: name,
          description: `Custom workspace created on ${new Date().toLocaleDateString()}`
        })
      })

      const data = await response.json()

      if (response.ok) {
        // Create workspace object for frontend
        const newWorkspace = { 
          id: data.workspace.id, 
          name: data.workspace.name, 
          createdAt: data.workspace.createdAt,
          owner: data.workspace.owner,
          status: data.workspace.status,
          modelsCount: data.workspace.modelsCount || 0,
          datasetsCount: data.workspace.datasetsCount || 0,
          icon: '📁',
          category: 'Custom Workspace'
        }
        
        // Update local state
        setWorkspaces(prev => [newWorkspace, ...prev])
        setSelectedWorkspace(newWorkspace)
        setNewWs('')
        
        // Add success state
        if (createSection) {
          createSection.classList.add('success')
          setTimeout(() => {
            createSection.classList.remove('success')
          }, 2000)
        }
        
        // Success notification
        alert(`✅ Workspace "${name}" created successfully and saved to database!`)
        console.log('✅ Workspace created:', data.workspace)
        
      } else {
        // Handle API errors
        alert(`❌ Failed to create workspace: ${data.message}`)
        console.error('Workspace creation failed:', data)
      }

    } catch (error) {
      console.error('Error creating workspace:', error)
      alert(`❌ Error creating workspace: ${error.message}`)
    } finally {
      // Remove loading state
      if (createBtn) {
        createBtn.classList.remove('loading')
        createBtn.disabled = false
        createBtn.textContent = 'Create Workspace'
      }
    }
  }

  const deleteWorkspace = (id, name) => {
    const ok = confirm(`Delete workspace "${name}"? This cannot be undone.`)
    if (!ok) return
    setWorkspaces(prev => prev.filter(w => w.id !== id))
    if (selectedWorkspace?.id === id) {
      setSelectedWorkspace(null)
      setData([])
      setFile(null)
      setModelInfo(null)
      setPredictionResult(null)
      setTrainingStatus('')
    }
  }

  // Add new function to remove workspace (softer action than delete)
  const removeWorkspace = (id, name) => {
    const ok = confirm(`Remove workspace "${name}" from the list? You can add it back later from the workspace selection.`)
    if (!ok) return
    
    setWorkspaces(prev => prev.filter(w => w.id !== id))
    
    if (selectedWorkspace?.id === id) {
      // Clear all related data when removing the selected workspace
      setSelectedWorkspace(null)
      setData([])
      setFile(null)
      setModelInfo(null)
      setPredictionResult(null)
      setTrainingStatus('')
      setUtterance('')
      setSuggested([])
      setActiveTab('training')
    }
    
    alert(`✅ Workspace "${name}" removed successfully!`)
  }

  const onSelectFile = (e) => {
    const f = e.target.files?.[0]
    if (!f) {
      console.log('No file selected')
      return
    }
    
    console.log('File selected:', f.name, f.size, f.type)
    
    // Validate file type
    const fileName = f.name.toLowerCase()
    const supportedTypes = ['.json', '.csv', '.txt', '.tsv', '.jsonl']
    const isSupported = supportedTypes.some(type => fileName.endsWith(type))
    
    if (!isSupported) {
      alert(`Unsupported file type: ${f.name}\n\nPlease use one of these formats:\n${supportedTypes.join('\n')}`)
      // Clear the file input
      e.target.value = ''
      return
    }
    
    // Validate file size (max 10MB)
    const maxSize = 10 * 1024 * 1024 // 10MB
    if (f.size > maxSize) {
      alert(`File too large: ${(f.size / 1024 / 1024).toFixed(2)}MB\n\nMaximum file size is 10MB`)
      e.target.value = ''
      return
    }
    
    setFile(f)
    console.log('Processing file:', f.name)
    const reader = new FileReader()
    reader.onload = () => {
      try {
        const text = String(reader.result || '')
        let parsed = []
        
        if (fileName.endsWith('.json')) {
          const j = JSON.parse(text)
          parsed = Array.isArray(j) ? j : (j.data || j.examples || j.rasa_nlu_data?.common_examples || [])
        } else if (fileName.endsWith('.csv')) {
          parsed = parseCsv(text)
        } else if (fileName.endsWith('.tsv')) {
          // Tab-separated values
          const lines = text.split(/\r?\n/).filter(Boolean)
          if (lines.length === 0) {
            parsed = []
          } else {
            const headers = lines[0].split('\t').map(h => h.trim())
            parsed = lines.slice(1).map(line => {
              const parts = line.split('\t')
              const row = {}
              headers.forEach((h, i) => row[h] = (parts[i] || '').trim())
              return row
            })
          }
        } else if (fileName.endsWith('.jsonl')) {
          // JSON Lines format
          const lines = text.split(/\r?\n/).filter(line => line.trim())
          parsed = lines.map(line => JSON.parse(line))
        } else if (fileName.endsWith('.txt')) {
          // Simple text format - assume each line is an utterance
          const lines = text.split(/\r?\n/).filter(line => line.trim())
          parsed = lines.map((line, index) => ({
            text: line.trim(),
            intent: `intent_${index + 1}`,
            entities: []
          }))
        }
        
        if (!parsed || parsed.length === 0) {
          alert(`No valid data found in ${f.name}.\n\nPlease check:\n• File is not empty\n• Format matches expected structure\n• JSON files have proper syntax\n• CSV/TSV files have headers`)
          setFile(null)
          e.target.value = ''
          return
        }
        
        console.log('Parsed data:', parsed.length, 'records')
        setData(parsed)
        alert(`✅ Dataset uploaded successfully!\n\n📊 Loaded ${parsed.length} records from ${f.name}\n📁 File size: ${(f.size / 1024).toFixed(1)} KB`)
      } catch (e) {
        console.error('File parsing error:', e)
        alert(`❌ Failed to parse ${f.name}\n\nError: ${e.message}\n\nPlease check:\n• File format is correct\n• JSON syntax is valid\n• CSV/TSV has proper headers\n• File is not corrupted`)
        setFile(null)
        e.target.value = ''
      }
    }
    reader.readAsText(f)
  }

  const applySample = (s) => {
    setUtterance(s.text || '')
  }

  const trainModel = async () => {
    if (!selectedWorkspace) {
      alert('Please select a workspace first')
      return
    }
    if (!file) {
      alert('Please upload a training dataset first')
      return
    }

    setIsTraining(true)
    setTrainingStatus('Training model...')

    try {
      const formData = new FormData()
      formData.append('trainingData', file)
      formData.append('workspaceId', selectedWorkspace.id)

      // Try sessionStorage first (tab-specific), then localStorage
      const token = sessionStorage.getItem('authToken') || localStorage.getItem('authToken')
      const response = await axios.post('http://localhost:3001/api/training/upload-and-train', formData, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'multipart/form-data'
        }
      })

      setTrainingStatus('Model trained successfully!')
      setModelInfo(response.data)
      alert(`Model trained successfully! Supports ${response.data.intents.length} intents.`)
    } catch (error) {
      console.error('Training error:', error)
      setTrainingStatus('Training failed')
      alert(error.response?.data?.message || 'Training failed')
    } finally {
      setIsTraining(false)
    }
  }

  const predictIntent = async () => {
    if (!selectedWorkspace) {
      alert('Please select a workspace first')
      return
    }
    if (!utterance.trim()) {
      alert('Please enter some text to predict')
      return
    }
    if (!modelInfo) {
      alert('Please train a model first')
      return
    }

    setIsPredicting(true)
    setPredictionResult(null)

    try {
      // Try sessionStorage first (tab-specific), then localStorage
      const token = sessionStorage.getItem('authToken') || localStorage.getItem('authToken')
      const response = await axios.post('http://localhost:3001/api/training/predict', {
        text: utterance,
        workspaceId: selectedWorkspace.id
      }, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      })

      setPredictionResult(response.data)
    } catch (error) {
      console.error('Prediction error:', error)
      alert(error.response?.data?.message || 'Prediction failed')
    } finally {
      setIsPredicting(false)
    }
  }

  const selectWorkspace = (workspace) => {
    setSelectedWorkspace(workspace)
    setModelInfo(null)
    setPredictionResult(null)
    setTrainingStatus('')
  }

  // Drag and Drop handlers
  const handleDragOver = (e) => {
    e.preventDefault()
    setIsDragOver(true)
  }

  const handleDragLeave = (e) => {
    e.preventDefault()
    setIsDragOver(false)
  }

  const handleDrop = (e) => {
    e.preventDefault()
    setIsDragOver(false)
    
    const files = Array.from(e.dataTransfer.files)
    if (files.length === 0) {
      console.log('No files dropped')
      return
    }
    
    if (files.length > 1) {
      alert('Please drop only one file at a time')
      return
    }
    
    console.log('File dropped:', files[0].name)
    const mockEvent = { target: { files: [files[0]] } }
    onSelectFile(mockEvent)
  }

  // Show workspace selection screen if no workspaces exist or user clicks to choose
  if (workspaces.length === 0 || showWorkspaceSelection) {
    return (
      <div className="workspace-selection-screen">
        <div className="workspace-selection-header">
          <h1>🚀 Welcome to NLU Trainer</h1>
          <p>Choose how you'd like to get started with your chatbot training</p>
        </div>

        <div className="workspace-selection-options">
          <button 
            className={`selection-option ${workspaceCreationMode === 'existing' ? 'active' : ''}`}
            onClick={() => setWorkspaceCreationMode('existing')}
          >
            <FiGrid size={24} />
            <h3>Choose Existing Workspace</h3>
            <p>Select from pre-built templates like HR Bot, Travel Bot, or Support Bot</p>
          </button>

          <button 
            className={`selection-option ${workspaceCreationMode === 'new' ? 'active' : ''}`}
            onClick={() => setWorkspaceCreationMode('new')}
          >
            <FiPlus size={24} />
            <h3>Create New Workspace</h3>
            <p>Start from scratch with a custom workspace for your specific needs</p>
          </button>
        </div>

        {workspaceCreationMode === 'existing' && (
          <div className="existing-workspaces-grid">
            <h2>📋 Available Workspace Templates</h2>
            <div className="workspace-cards-grid">
              {existingWorkspaces.map((workspace) => (
                <div key={workspace.id} className="workspace-template-card">
                  <div className="card-header" style={{ background: workspace.color }}>
                    <div className="workspace-icon">{workspace.icon}</div>
                    <div className="workspace-info">
                      <h3>{workspace.name}</h3>
                      <span className="category">{workspace.category}</span>
                    </div>
                  </div>
                  <div className="card-body">
                    <p className="description">{workspace.description}</p>
                    <div className="workspace-stats">
                      <div className="stat">
                        <span className="label">Models:</span>
                        <span className="value">{workspace.modelsCount}</span>
                      </div>
                      <div className="stat">
                        <span className="label">Datasets:</span>
                        <span className="value">{workspace.datasetsCount}</span>
                      </div>
                      <div className="stat">
                        <span className="label">Intents:</span>
                        <span className="value">{workspace.sampleIntents.length}</span>
                      </div>
                    </div>
                    <div className="sample-intents">
                      <strong>Sample Intents:</strong>
                      <div className="intent-tags">
                        {workspace.sampleIntents.slice(0, 3).map((intent, idx) => (
                          <span key={idx} className="intent-tag">{intent}</span>
                        ))}
                        {workspace.sampleIntents.length > 3 && (
                          <span className="intent-tag more">+{workspace.sampleIntents.length - 3} more</span>
                        )}
                      </div>
                    </div>
                  </div>
                  <div className="card-footer">
                    <button 
                      className="select-template-btn"
                      onClick={() => selectExistingWorkspace(workspace)}
                    >
                      Use {workspace.name} Template
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {workspaceCreationMode === 'new' && (
          <div className="new-workspace-form">
            <h2>✨ Create New Workspace</h2>
            <form onSubmit={createWorkspace} className="workspace-form">
              <div className="form-group">
                <label>Workspace Name</label>
                <input
                  type="text"
                  value={newWs}
                  onChange={(e) => setNewWs(e.target.value)}
                  placeholder="e.g., My Custom Chatbot"
                  required
                />
              </div>
              <button type="submit" className="create-btn">
                <FiPlus size={16} />
                Create Workspace
              </button>
            </form>
          </div>
        )}

        {!workspaceCreationMode && (
          <div className="welcome-message">
            <p>Click on one of the options above to get started!</p>
          </div>
        )}

        {workspaces.length > 0 && (
          <div className="back-to-workspaces">
            <button 
              onClick={() => setShowWorkspaceSelection(false)}
              className="back-btn"
            >
              ← Back to Workspaces
            </button>
          </div>
        )}
      </div>
    )
  }

  return (
    <div className="ws-root">
      <div className="ws-top">
        <div className="ws-brand">Project Workspace</div>
        <div className="ws-spacer" />
        <button 
          className="choose-workspace-btn" 
          onClick={() => setShowWorkspaceSelection(true)}
        >
          <FiGrid size={16} />
          Choose Workspace
        </button>
        <div className="user-header-section">
          {user && (
            <div className="user-info" onClick={() => setShowProfile(true)}>
              {user.avatar ? (
                <div className="user-avatar">
                  <img src={user.avatar} alt="User Avatar" />
                </div>
              ) : (
                <span className="user-name">{user.name || user.username}</span>
              )}
              {isAdmin() && <span className="admin-badge">Admin</span>}
            </div>
          )}
          <button className="ws-logout" onClick={handleLogout}>
            <FiLogOut size={16} />
            Log out
          </button>
        </div>
      </div>

      <div className="ws-columns">
        <div className="ws-left">
          <div className="ws-section-title"><FiFolder /> Workspaces</div>
          <ul className="ws-list">
            {workspaces.map(w => (
              <li key={w.id} className={`ws-item ${selectedWorkspace?.id === w.id ? 'selected' : ''}`}>
                <div className="ws-item-meta" onClick={() => selectWorkspace(w)}>
                  <span className="ws-icon">{w.icon || '📁'}</span>
                  <div className="ws-details">
                    <span className="ws-name">{w.name}</span>
                    <span className="ws-date">Created: {w.createdAt}</span>
                    {w.category && <span className="ws-category">{w.category}</span>}
                  </div>
                </div>
                <button 
                  className="ws-remove" 
                  onClick={() => removeWorkspace(w.id, w.name)}
                  title="Remove workspace from list"
                >
                  Remove
                </button>
              </li>
            ))}
          </ul>

          {/* Add New Workspace Creation Section */}
          <div className="ws-create-section">
            <div className="ws-create-header">
              <FiPlus size={16} />
              <span>Create New Workspace</span>
            </div>
            <form onSubmit={createWorkspace} className="ws-create-form">
              <div className="ws-input-group">
                <input
                  type="text"
                  value={newWs}
                  onChange={(e) => setNewWs(e.target.value)}
                  placeholder="Enter workspace name..."
                  className="ws-create-input"
                  required
                />
                <button type="submit" className="ws-create-btn" disabled={!newWs.trim()}>
                  <FiPlus size={14} />
                  Create
                </button>
              </div>
            </form>
          </div>

          {samples.length > 0 && (
            <div className="ws-samples">
              <div className="ws-samples-title">Sample Utterances (from JSON)</div>
              <ul className="ws-sample-list">
                {samples.map((s, i) => (
                  <li key={i} className="ws-sample-item" onClick={() => applySample(s)}>{s.text}</li>
                ))}
              </ul>
            </div>
          )}
        </div>

        <div className="ws-right">
          {/* Tab Navigation */}
          <div className="ws-tabs">
            <button 
              className={`ws-tab ${activeTab === 'training' ? 'active' : ''}`}
              onClick={() => setActiveTab('training')}
            >
              <FiUpload /> Training
            </button>
            <button 
              className={`ws-tab ${activeTab === 'annotation' ? 'active' : ''}`}
              onClick={() => setActiveTab('annotation')}
            >
              <FiTag /> Entity Annotation
            </button>
            <button 
              className={`ws-tab ${activeTab === 'evaluation' ? 'active' : ''}`}
              onClick={() => setActiveTab('evaluation')}
            >
              <FiBarChart2 /> Evaluation
            </button>
            <button 
              className={`ws-tab ${activeTab === 'versioning' ? 'active' : ''}`}
              onClick={() => setActiveTab('versioning')}
            >
              <FiGitBranch /> Versioning
            </button>
            <button 
              className={`ws-tab ${activeTab === 'activeLearning' ? 'active' : ''}`}
              onClick={() => setActiveTab('activeLearning')}
            >
              <FiTarget /> Active Learning
            </button>
            {/* Admin tab - show for all users but with conditional access */}
            {isLoadingUser ? (
              <button className="ws-tab disabled-tab">
                <FiSettings /> Loading...
              </button>
            ) : (
              <button 
                className={`ws-tab ${activeTab === 'admin' ? 'active' : ''} ${!isAdmin() ? 'disabled-tab' : ''}`}
                onClick={handleAdminTabClick}
                title={isAdmin() ? 'Admin Dashboard' : 'Administrator privileges required'}
              >
                <FiSettings /> Admin {!isAdmin() && '🔒'}
              </button>
            )}
          </div>

          {/* Tab Content */}
          {activeTab === 'training' && (
            <>
              <div className="ws-section-title"><FiUpload /> Dataset Upload</div>
              <div 
                className={`ws-upload ${isDragOver ? 'drag-over' : ''}`}
                onDragOver={handleDragOver}
                onDragLeave={handleDragLeave}
                onDrop={handleDrop}
              >
                <div className="upload-area">
                  <FiUpload size={32} className="upload-icon" />
                  <h3>Choose a file or drag it here</h3>
                  <p>Drop your training data file here or click to browse</p>
                  <input 
                    type="file" 
                    accept=".json,.csv,.txt,.tsv,.jsonl" 
                    onChange={onSelectFile}
                    className="file-input"
                    id="file-input"
                  />
                  <label htmlFor="file-input" className="upload-button">
                    <FiUpload size={16} />
                    Browse Files
                  </label>
                </div>
                
                <div className="upload-info">
                  <p><strong>Supported formats:</strong> JSON, CSV, TSV, TXT, JSONL</p>
                  <p><small>• JSON: Array of objects or Rasa NLU format</small></p>
                  <p><small>• CSV/TSV: First row as headers (text, intent, entities)</small></p>
                  <p><small>• TXT: One utterance per line</small></p>
                  <p><small>• JSONL: One JSON object per line</small></p>
                </div>
                
                {file && (
                  <div className="ws-file">
                    <FiCheck size={16} style={{ marginRight: '0.5rem' }} />
                    <strong>Selected:</strong> {file.name} ({(file.size / 1024).toFixed(1)} KB)
                  </div>
                )}
              </div>
              
              <div className="ws-overview">
                <div className="ov-title">Dataset Overview</div>
                <div className="ov-grid">
                  <div className="ov-card"><div className="ov-label">Records</div><div className="ov-value">{overview.totalRecords}</div></div>
                  <div className="ov-card"><div className="ov-label">Intents</div><div className="ov-value">{overview.intents}</div></div>
                  <div className="ov-card"><div className="ov-label">Entities</div><div className="ov-value">{overview.entities}</div></div>
                </div>
                {overview.sample.length > 0 && (
                  <div className="ov-sample">
                    <div className="ov-sample-title">Sample</div>
                    <pre className="ov-pre">{JSON.stringify(overview.sample, null, 2)}</pre>
                  </div>
                )}
              </div>

          {/* Phase 2: Multi-Backend Training System */}
          {data && data.length > 0 && selectedWorkspace && selectedWorkspace.id && (
            <MultiBackendTraining
              trainingData={data}
              workspaceId={selectedWorkspace.id}
              onTrainingComplete={(result) => {
                if (result) {
                  setModelInfo(result);
                  setTrainingStatus('Multi-backend training completed successfully!');
                }
              }}
            />
          )}

          {/* Fallback Basic Training for when no data */}
          {(!data || data.length === 0) && (
            <div className="ws-training">
              <div className="ov-title">Model Training</div>
              <button 
                className="ws-button" 
                onClick={trainModel} 
                disabled={isTraining || !file || !selectedWorkspace}
                style={{ width: '100%', marginBottom: '1rem' }}
              >
                {isTraining ? 'Training...' : <><FiCpu /> Train Model</>}
              </button>
              {trainingStatus && (
                <div className="training-status" style={{ 
                  padding: '1rem', 
                  background: trainingStatus.includes('failed') ? '#fee2e2' : '#d1fae5',
                  borderRadius: '8px',
                  color: trainingStatus.includes('failed') ? '#dc2626' : '#065f46',
                  marginBottom: '1rem'
                }}>
                  {trainingStatus}
                </div>
              )}
            </div>
          )}

              {/* Legacy Single Prediction (for backward compatibility) */}
              {modelInfo && (
                <div className="ws-intents">
                  <div className="ov-title">Legacy Intent Prediction</div>
                  <textarea
                    className="ws-textarea"
                    rows={4}
                    placeholder="Type something like: I want to eat biriyani"
                    value={utterance}
                    onChange={(e) => setUtterance(e.target.value)}
                  />
                  <button 
                    className="ws-button" 
                    onClick={predictIntent} 
                    disabled={isPredicting || !utterance.trim() || !modelInfo}
                    style={{ marginTop: '0.5rem', width: '100%' }}
                  >
                    {isPredicting ? 'Predicting...' : <><FiCheck /> Predict Intent (Legacy)</>}
                  </button>
                  
                  {predictionResult && (
                    <div className="prediction-result" style={{ marginTop: '1rem', padding: '1rem', background: '#f0f8ff', borderRadius: '8px', border: '1px solid #e2e8f0' }}>
                      <div style={{ fontWeight: 'bold', marginBottom: '0.5rem' }}>Prediction Result:</div>
                      <div><strong>Intent:</strong> {predictionResult.predictedIntent}</div>
                      <div><strong>Confidence:</strong> {(predictionResult.confidence * 100).toFixed(1)}%</div>
                      {predictionResult.alternatives && predictionResult.alternatives.length > 0 && (
                        <div style={{ marginTop: '0.5rem' }}>
                          <strong>Alternatives:</strong>
                          <div className="intent-suggest-list" style={{ marginTop: '0.3rem' }}>
                            {predictionResult.alternatives.map((alt, i) => (
                              <span key={i} className="chip">{alt.intent} ({(alt.confidence * 100).toFixed(1)}%)</span>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  )}

                  <div className="intent-suggest-list" style={{ marginTop: '1rem' }}>
                    <div style={{ fontWeight: 'bold', marginBottom: '0.5rem' }}>Rule-based Suggestions:</div>
                    {suggested.length === 0 ? (
                      <div className="empty">No suggestions yet.</div>
                    ) : (
                      suggested.map(s => (
                        <span key={s} className="chip">{s}</span>
                      ))
                    )}
                  </div>
                </div>
              )}
            </>
          )}

          {activeTab === 'annotation' && (
            <EntityAnnotation 
              selectedWorkspace={selectedWorkspace}
              data={data}
              onSave={(annotations) => {
                console.log('Entity annotations saved:', annotations);
                setData(annotations);
                alert('Entity annotations saved successfully!');
              }}
            />
          )}

          {activeTab === 'evaluation' && (
            <EvaluationDashboard 
              selectedWorkspace={selectedWorkspace}
              modelInfo={modelInfo}
              trainingData={data}
            />
          )}

          {activeTab === 'versioning' && (
            <ModelVersioningDashboard 
              selectedWorkspace={selectedWorkspace}
              modelInfo={modelInfo}
              onVersionSaved={(version) => {
                console.log('Model version saved:', version);
                alert(`Model version ${version.version} saved successfully!`);
              }}
            />
          )}

          {activeTab === 'activeLearning' && (
            <ActiveLearningDashboard 
              selectedWorkspace={selectedWorkspace}
              modelInfo={modelInfo}
              trainingData={data}
            />
          )}

          {activeTab === 'admin' && isAdmin() && (
            <AdminDashboard 
              workspaceId={selectedWorkspace?.id}
            />
          )}

          {/* Show unauthorized message for non-admin users trying to access admin */}
          {activeTab === 'admin' && !isAdmin() && (
            <div style={{ 
              padding: '40px', 
              textAlign: 'center', 
              background: 'linear-gradient(135deg, #ff6b6b, #ee5a24)',
              borderRadius: '15px',
              color: 'white',
              margin: '20px 0'
            }}>
              <h2>⚠️ Access Denied</h2>
              <p>You need administrator privileges to access this section.</p>
              <p>Please contact your system administrator if you believe this is an error.</p>
            </div>
          )}
        </div>
      </div>
      
      {/* User Profile Modal */}
      {showProfile && (
        <UserProfile
          onClose={() => setShowProfile(false)}
        />
      )}
    </div>
  )
}

import React, { useEffect, useMemo, useState } from 'react'
import axios from 'axios'
import './workspace.css'
import { FiPlus, FiFolder, FiUpload, FiCpu, FiCheck, FiBarChart2, FiGitBranch, FiTag, FiTarget, FiSettings } from 'react-icons/fi'

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

  // Drag and drop states
  const [isDragOver, setIsDragOver] = useState(false)

  useEffect(() => {
    fetch('/data/utterances.json')
      .then(r => r.json())
      .then(list => {
        if (Array.isArray(list)) setSamples(list)
      })
      .catch(() => {})
  }, [])

  useEffect(() => {
    setSuggested(suggestIntents(utterance))
  }, [utterance])

  const createWorkspace = (e) => {
    e.preventDefault()
    const name = newWs.trim()
    if (!name) return
    if (workspaces.some(w => w.name.toLowerCase() === name.toLowerCase())) {
      alert('Workspace already exists')
      return
    }
    const d = new Date()
    const createdAt = `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`
    const workspaceId = String(Date.now())
    const newWorkspace = { id: workspaceId, name, createdAt }
    setWorkspaces([newWorkspace, ...workspaces])
    setSelectedWorkspace(newWorkspace)
    setNewWs('')
    alert('Workspace created')
  }

  const deleteWorkspace = (id, name) => {
    const ok = confirm(`Delete workspace "${name}"? This cannot be undone.`)
    if (!ok) return
    setWorkspaces(prev => prev.filter(w => w.id !== id))
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

      const token = localStorage.getItem('auth_token')
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
      const token = localStorage.getItem('auth_token')
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

  return (
    <div className="ws-root">
      <div className="ws-top">
        <div className="ws-brand">Project Workspace</div>
        <div className="ws-spacer" />
        <button className="ws-logout" onClick={goToLogin}>Log out</button>
      </div>

      <div className="ws-columns">
        <div className="ws-left">
          <div className="ws-section-title"><FiFolder /> Workspaces</div>
          <ul className="ws-list">
            {workspaces.map(w => (
              <li key={w.id} className={`ws-item ${selectedWorkspace?.id === w.id ? 'selected' : ''}`}>
                <div className="ws-item-meta" onClick={() => selectWorkspace(w)}>
                  <span className="ws-name">{w.name}</span>
                  <span className="ws-date">Created: {w.createdAt}</span>
                </div>
                <button className="ws-delete" onClick={() => deleteWorkspace(w.id, w.name)}>Delete</button>
              </li>
            ))}
            {workspaces.length === 0 && (
              <li className="ws-item empty">No workspaces yet. Create your first one below.</li>
            )}
          </ul>
          <form className="ws-create" onSubmit={createWorkspace}>
            <div className="ws-input-row">
              <span className="ws-plus"><FiPlus /></span>
              <input className="ws-input" placeholder="Create New Workspace" value={newWs} onChange={(e)=>setNewWs(e.target.value)} />
            </div>
            <button className="ws-button" type="submit">Create</button>
          </form>

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
              className={`ws-tab ${activeTab === 'active-learning' ? 'active' : ''}`}
              onClick={() => setActiveTab('active-learning')}
            >
              <FiTarget /> Active Learning
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
              className={`ws-tab ${activeTab === 'admin' ? 'active' : ''}`}
              onClick={() => setActiveTab('admin')}
            >
              <FiSettings /> Admin
            </button>
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
          )}              {/* Legacy Single Prediction (for backward compatibility) */}
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

          {activeTab === 'active-learning' && (
            <ActiveLearningDashboard 
              selectedWorkspace={selectedWorkspace}
              modelInfo={modelInfo}
              trainingData={data}
            />
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

          {activeTab === 'admin' && (
            <AdminDashboard 
              workspaceId={selectedWorkspace?.id}
            />
          )}


        </div>
      </div>
    </div>
  )
}

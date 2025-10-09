import React, { useState } from 'react'

// Simple test component to verify input functionality
function InputTest() {
  const [testInput, setTestInput] = useState('')
  
  return (
    <div style={{ padding: '20px', maxWidth: '400px', margin: '0 auto' }}>
      <h2>Input Functionality Test</h2>
      
      {/* Basic input test */}
      <div style={{ marginBottom: '20px' }}>
        <label>Basic Input Test:</label>
        <input 
          type="text"
          value={testInput}
          onChange={(e) => setTestInput(e.target.value)}
          placeholder="Type here to test..."
          style={{
            width: '100%',
            padding: '10px',
            border: '2px solid #ccc',
            borderRadius: '8px',
            fontSize: '16px',
            marginTop: '5px'
          }}
        />
        <p>Current value: "{testInput}"</p>
      </div>

      {/* Styled input test matching the auth forms */}
      <div style={{ marginBottom: '20px' }}>
        <label>Styled Input Test:</label>
        <div style={{
          display: 'flex',
          alignItems: 'center',
          padding: '0.9rem 1rem',
          border: '2px solid rgba(203, 213, 225, 0.8)',
          borderRadius: '12px',
          background: 'linear-gradient(135deg, #ffffff 0%, #f8fafc 100%)',
          marginTop: '5px',
          cursor: 'text',
          pointerEvents: 'auto'
        }}>
          <input 
            type="text"
            value={testInput}
            onChange={(e) => setTestInput(e.target.value)}
            placeholder="Styled input test..."
            style={{
              flex: 1,
              border: 'none',
              outline: 'none',
              background: 'transparent',
              fontSize: '1rem',
              color: '#334155',
              padding: 0,
              margin: 0,
              pointerEvents: 'auto',
              zIndex: 10,
              position: 'relative',
              cursor: 'text'
            }}
          />
        </div>
        <p>Current value: "{testInput}"</p>
      </div>

      {/* Clear button */}
      <button 
        onClick={() => setTestInput('')}
        style={{
          padding: '10px 20px',
          backgroundColor: '#667eea',
          color: 'white',
          border: 'none',
          borderRadius: '8px',
          cursor: 'pointer'
        }}
      >
        Clear Input
      </button>
    </div>
  )
}

export default InputTest
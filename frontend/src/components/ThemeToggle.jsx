import React from 'react'
import './BgToggle.css'

// ThemeToggle reuses the BgToggle styles (small switch) and can be placed globally or in headers.
export default function ThemeToggle({ checked, onChange, style }) {
  return (
    <div className="bg-toggle" style={{ right: '12px', ...style }} title="Toggle dark / light theme">
      <label className="switch">
        <input type="checkbox" checked={checked} onChange={e => onChange(e.target.checked)} />
        <span className="slider" />
      </label>
    </div>
  )
}

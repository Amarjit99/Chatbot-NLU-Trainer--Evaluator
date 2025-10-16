import React from 'react'
import './BgToggle.css'

export default function BgToggle({ onChange, checked }) {
  return (
    <div className="bg-toggle" title="Toggle animated background">
      <label className="switch">
        <input type="checkbox" checked={checked} onChange={e => onChange(e.target.checked)} />
        <span className="slider" />
      </label>
    </div>
  )
}

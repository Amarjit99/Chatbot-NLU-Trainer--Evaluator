import React from 'react'
import './AnimatedBackground.css'

// AnimatedBackground fills the app body and uses CSS variables for easy color customization.
// Props (all optional): colors: { bg1, bg2, accent }
export default function AnimatedBackground({ colors = {}, visible = true }) {
  const style = {}
  if (colors.bg1) style['--bg-1'] = colors.bg1
  if (colors.bg2) style['--bg-2'] = colors.bg2
  if (colors.accent) style['--accent'] = colors.accent

  return (
    <div className={"animated-bg" + (visible ? '' : ' hidden')} style={style} aria-hidden>
      {/* moving gradient layer */}
      <div className="gradient-layer" />

      {/* floating nodes created with SVG for crisp rendering and small size */}
      <svg className="nodes" viewBox="0 0 800 600" preserveAspectRatio="xMidYMid slice">
        <defs>
          <linearGradient id="g" x1="0" x2="1">
            <stop offset="0%" stopColor="var(--accent)" stopOpacity="0.35" />
            <stop offset="100%" stopColor="var(--bg-2)" stopOpacity="0.15" />
          </linearGradient>
        </defs>

        {/* soft glowing blobs */}
        <circle className="node n1" cx="120" cy="80" r="60" fill="url(#g)" />
        <circle className="node n2" cx="680" cy="140" r="80" fill="url(#g)" />
        <circle className="node n3" cx="420" cy="460" r="100" fill="url(#g)" />

        {/* connecting lines - subtle, animated stroke-dashoffset */}
        <g stroke="rgba(255,255,255,0.06)" strokeWidth="1" fill="none" className="lines">
          <path d="M180 120 C260 200, 380 220, 460 180" />
          <path d="M520 200 C580 260, 640 340, 720 300" />
          <path d="M300 360 C360 300, 460 320, 520 380" />
        </g>
      </svg>

      {/* subtle grid/particles for tech feel */}
      <div className="particles">
        <span />
        <span />
        <span />
        <span />
        <span />
      </div>
    </div>
  )
}

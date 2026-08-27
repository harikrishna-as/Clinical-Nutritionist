import React, { useEffect, useRef, useState } from 'react'

// Community file IDs — hero now uses the user-provided community file
const FILE_IDS = {
  hero: '9538ce23-ebb6-4bbe-ab28-c34c7be403eb',
  finale: 'fe773050-28ff-478f-a162-5006b36ecec0',
  departments: '7ffaf321-83b9-473b-a02a-674c1417ff31',
}

// Try prod first (if you have published), then community viewer
const SPLINE_SCENES = {
  hero: `https://prod.spline.design/${FILE_IDS.hero}/scene.splinecode`,
  finale: `https://prod.spline.design/${FILE_IDS.finale}/scene.splinecode`,
  departments: `https://prod.spline.design/${FILE_IDS.departments}/scene.splinecode`,
}

// Community iframe — always works for public files (no publish needed)
const COMMUNITY_IFRAME = {
  hero: `https://app.spline.design/file/${FILE_IDS.hero}`,
  finale: `https://app.spline.design/file/${FILE_IDS.finale}`,
  departments: `https://app.spline.design/file/${FILE_IDS.departments}`,
}

// For community files that are not published, prod.spline returns 403 — use iframe directly
const PREFER_IFRAME = {
  hero: true,
  finale: false,
  departments: false,
}

function IframeEmbed({ scene, style, className }) {
  const src = COMMUNITY_IFRAME[scene]
  return (
    <div
      className={className}
      style={{
        position: 'relative',
        overflow: 'hidden',
        background: '#000000',
        width: '100%',
        height: '100%',
        display: 'block',
        ...style,
      }}
    >
      <iframe
        src={src}
        title={`spline-${scene}`}
        frameBorder="0"
        width="100%"
        height="100%"
        style={{
          width: '100%',
          height: '100%',
          border: 0,
          display: 'block',
          background: 'transparent',
        }}
        allow="autoplay; fullscreen; xr-spatial-tracking"
        loading="eager"
      />
      {/* subtle vignette to keep hero text readable without blocking interaction */}
      <div
        style={{
          position: 'absolute',
          inset: 0,
          background:
            'radial-gradient(ellipse at 30% 50%, rgba(15,23,42,0.10) 0%, rgba(15,23,42,0.22) 55%, rgba(15,23,42,0.45) 100%)',
          pointerEvents: 'none',
        }}
      />
    </div>
  )
}

function SplineViewer({ scene, style, className }) {
  const mountRef = useRef(null)
  const [failed, setFailed] = useState(false)
  const [useIframe, setUseIframe] = useState(!!PREFER_IFRAME[scene])
  const url = SPLINE_SCENES[scene]

  // If this scene prefers iframe (community hero), render iframe immediately
  if (useIframe) {
    return <IframeEmbed scene={scene} style={style} className={className} />
  }

  useEffect(() => {
    let cancelled = false
    let viewer = null
    let timeout = null

    const loadViewerScript = () => {
      if (customElements.get('spline-viewer')) return Promise.resolve(true)
      return new Promise((resolve) => {
        const s = document.createElement('script')
        s.type = 'module'
        s.src = 'https://unpkg.com/@splinetool/viewer@1.9.82/build/spline-viewer.js'
        s.onload = () => resolve(true)
        s.onerror = () => resolve(false)
        document.head.appendChild(s)
      })
    }

    const init = async () => {
      const ok = await loadViewerScript()
      if (cancelled || !ok || !mountRef.current) {
        if (!cancelled) setFailed(true)
        return
      }
      try {
        viewer = document.createElement('spline-viewer')
        viewer.url = url
        viewer.style.width = '100%'
        viewer.style.height = '100%'
        viewer.style.display = 'block'
        viewer.style.background = 'transparent'
        viewer.setAttribute('loading-anim-type', 'spinner-small-dark')
        viewer.addEventListener('load', () => !cancelled && setFailed(false))
        viewer.addEventListener('error', () => {
          if (!cancelled) {
            // viewer failed (likely 403 for unpublished community file) -> fallback to iframe
            setUseIframe(true)
          }
        })
        timeout = setTimeout(() => {
          if (!cancelled && mountRef.current && !mountRef.current.querySelector('canvas')) {
            setUseIframe(true)
          }
        }, 4500)
        mountRef.current.innerHTML = ''
        mountRef.current.appendChild(viewer)
      } catch {
        if (!cancelled) setUseIframe(true)
      }
    }

    init()
    return () => {
      cancelled = true
      clearTimeout(timeout)
      if (viewer?.parentNode) viewer.parentNode.removeChild(viewer)
    }
  }, [url])

  // If viewer explicitly failed before iframe fallback, show iframe
  if (failed && !useIframe) {
    return <IframeEmbed scene={scene} style={style} className={className} />
  }

  // Final graceful fallback when both viewer and iframe are not desired — elegant placeholder
  if (failed && useIframe) {
    return (
      <div className={className} style={{ position: 'relative', overflow: 'hidden', background: '#000000', ...style }}>
        <div
          style={{
            position: 'absolute',
            inset: 0,
            background: `
              radial-gradient(700px 500px at 50% 35%, rgba(107,124,255,0.18), transparent 60%),
              radial-gradient(500px 400px at 70% 70%, rgba(167,139,250,0.12), transparent 60%),
              radial-gradient(400px 300px at 20% 80%, rgba(52,211,153,0.08), transparent 60%),
              #000000
            `,
          }}
        />
        <div
          style={{
            position: 'absolute',
            top: '50%',
            left: '50%',
            transform: 'translate(-50%, -50%)',
            width: 180,
            height: 180,
            borderRadius: '50%',
            background: 'radial-gradient(circle at 30% 30%, rgba(167,139,250,0.9), rgba(107,124,255,0.6) 40%, rgba(0,0,0,0) 70%)',
            filter: 'blur(0.5px)',
            boxShadow: '0 0 80px rgba(107,124,255,0.4), 0 0 120px rgba(167,139,250,0.25), inset 0 0 40px rgba(255,255,255,0.15)',
            animation: 'float 6s ease-in-out infinite',
          }}
        />
        <div
          style={{
            position: 'absolute',
            top: '50%',
            left: '50%',
            transform: 'translate(-50%, -50%)',
            width: 220,
            height: 220,
            borderRadius: '50%',
            border: '1px solid rgba(167,139,250,0.12)',
            animation: 'pulse-ring 3s ease-in-out infinite',
          }}
        />
        <div style={{ position: 'absolute', bottom: 16, left: '50%', transform: 'translateX(-50%)', fontSize: 10, letterSpacing: 1.2, color: 'rgba(255,255,255,0.28)', textAlign: 'center', lineHeight: 1.5 }}>
          3D scene — publish your Spline file to see it here<br />
          <span style={{ fontSize: 9, opacity: 0.6 }}>{FILE_IDS[scene]}</span>
        </div>
      </div>
    )
  }

  return (
    <div
      ref={mountRef}
      className={className}
      style={{
        width: '100%',
        height: '100%',
        display: 'block',
        position: 'relative',
        overflow: 'hidden',
        background: 'transparent',
        ...style,
      }}
    />
  )
}

export default SplineViewer

export function SplineSection({ scene, kicker, title, quote, children, height = 560, overlay = true }) {
  return (
    <div style={{ position: 'relative', height, overflow: 'hidden', borderRadius: 24, border: '1px solid rgba(255,255,255,0.08)', background: '#000000' }}>
      <SplineViewer scene={scene} style={{ position: 'absolute', inset: 0 }} />
      {overlay && (
        <div
          style={{
            position: 'absolute',
            inset: 0,
            background: 'linear-gradient(180deg, rgba(0,0,0,0.06) 0%, rgba(0,0,0,0.48) 58%, rgba(0,0,0,0.92) 100%)',
            pointerEvents: 'none',
          }}
        />
      )}
      {(kicker || title || quote || children) && (
        <div style={{ position: 'relative', zIndex: 1, height: '100%', display: 'flex', flexDirection: 'column', justifyContent: 'flex-end', padding: '32px 28px' }}>
          {kicker && <span style={{ fontSize: 11, letterSpacing: 2.4, textTransform: 'uppercase', color: 'rgba(255,255,255,0.62)', fontWeight: 600 }}>{kicker}</span>}
          {title && <h3 style={{ margin: '10px 0 0', fontSize: 'clamp(22px, 3vw, 34px)', lineHeight: 1.15, color: '#fff', fontWeight: 700, fontFamily: 'Sora, sans-serif', letterSpacing: '-0.025em' }}>{title}</h3>}
          {quote && (
            <blockquote style={{ margin: '16px 0 0', maxWidth: 640, fontSize: 'clamp(15px, 1.6vw, 18px)', lineHeight: 1.6, color: 'rgba(255,255,255,0.88)', fontStyle: 'italic', borderLeft: '2px solid rgba(255,255,255,0.22)', paddingLeft: 16, fontFamily: 'Instrument Sans, Inter, sans-serif' }}>
              “{quote}”
            </blockquote>
          )}
          {children}
        </div>
      )}
    </div>
  )
}

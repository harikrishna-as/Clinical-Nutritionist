import React, { useEffect, useRef, useState } from 'react'

// Primary hero is the new published prod URL provided by user — verified public (200)
const FILE_IDS = {
  hero: 'FNrG0mwH9paHq-RG',
  finale: 'fe773050-28ff-478f-a162-5006b36ecec0',
  departments: '7ffaf321-83b9-473b-a02a-674c1417ff31',
}

const SPLINE_SCENES = {
  hero: 'https://prod.spline.design/FNrG0mwH9paHq-RG/scene.splinecode',
  finale: `https://prod.spline.design/${FILE_IDS.finale}/scene.splinecode`,
  departments: `https://prod.spline.design/${FILE_IDS.departments}/scene.splinecode`,
}

// Fallback if hero ever fails — keep docs example as safety
const FALLBACK_SCENE = 'https://prod.spline.design/6Wq1Q7YGyM-iab9i/scene.splinecode'

function MinimalFallback({ style, className }) {
  return (
    <div
      className={className}
      style={{
        position: 'relative',
        overflow: 'hidden',
        background: 'linear-gradient(180deg, #050508 0%, #070A14 100%)',
        width: '100%',
        height: '100%',
        display: 'block',
        ...style,
      }}
    >
      <div
        style={{
          position: 'absolute',
          inset: 0,
          background: `
            radial-gradient(700px 500px at 50% 30%, rgba(107,124,255,0.10), transparent 65%),
            radial-gradient(500px 400px at 80% 70%, rgba(167,139,250,0.07), transparent 65%)
          `,
        }}
      />
    </div>
  )
}

function SplineViewer({ scene, style, className }) {
  const mountRef = useRef(null)
  const [status, setStatus] = useState('loading') // loading | fallback | ready
  const [triedFallback, setTriedFallback] = useState(false)

  const primaryUrl = SPLINE_SCENES[scene]

  useEffect(() => {
    let cancelled = false
    let viewer = null
    let timeout = null
    let contextLostHandler = null

    // Detect WebGL support early — if no WebGL or --no-sandbox with GPU disabled, fallback immediately to dark (not white)
    const hasWebGL = (() => {
      try {
        const c = document.createElement('canvas')
        return !!(c.getContext('webgl') || c.getContext('webgl2'))
      } catch { return false }
    })()
    if (!hasWebGL) {
      setStatus('fallback')
      return
    }

    // If WebGPU OOM, fallback to dark gradient — never show white
    const onWindowError = (e) => {
      const msg = (e.message || '') + (e.error?.message || '') + (e.reason?.message || '')
      if (msg.includes('WebGPU') || msg.includes('GPUOutOfMemory') || msg.includes('CreateTexture') || msg.includes('Context lost') || msg.includes('OutOfMemory') || msg.includes('WebGL')) {
        if (!cancelled) {
          setStatus('fallback')
          try { viewer?.remove() } catch {}
        }
      }
    }
    window.addEventListener('error', onWindowError)
    window.addEventListener('unhandledrejection', onWindowError)
    const onContextLost = (e) => {
      e.preventDefault()
      if (!cancelled) {
        setStatus('fallback')
        try { viewer?.remove() } catch {}
      }
    }
    window.addEventListener('webglcontextlost', onContextLost)
    window.addEventListener('webglcontextlost', onContextLost, true)

    // Use stable 1.10.57 without Hana (2.0.10 has Hana wasm bug + WebGPU OOM)
    const loadViewerScript = () => {
      if (customElements.get('spline-viewer')) return Promise.resolve(true)
      return new Promise((resolve) => {
        const s = document.createElement('script')
        s.type = 'module'
        s.src = 'https://unpkg.com/@splinetool/viewer@1.10.57/build/spline-viewer.js'
        s.onload = () => resolve(true)
        s.onerror = () => resolve(false)
        document.head.appendChild(s)
      })
    }

    const attachViewer = (url, isFallback = false) => {
      if (cancelled || !mountRef.current) return
      // Force WebGL to avoid WebGPU OOM on low-end / --no-sandbox
      try { if (navigator.gpu) navigator.gpu = undefined } catch {}
      viewer = document.createElement('spline-viewer')
      viewer.url = url
      viewer.style.width = '100%'
      viewer.style.height = '100%'
      viewer.style.display = 'block'
      viewer.style.background = 'transparent'
      viewer.setAttribute('loading-anim-type', 'spinner-small-dark')
      // Try to force low-power / webgl if viewer supports it + reduce DPR to prevent OOM
      try { viewer.setAttribute('events-target', 'global') } catch {}
      try { viewer.setAttribute('render-mode', 'webgl') } catch {}
      try { viewer.setAttribute('pixel-ratio', '1') } catch {}
      try { viewer.setAttribute('render-scale', '0.85') } catch {}

      const onLoad = () => {
        if (cancelled) return
        clearTimeout(timeout)
        // check canvas exists
        const canvas = viewer.shadowRoot?.querySelector('canvas') || mountRef.current?.querySelector('canvas')
        if (canvas) {
          viewer.style.opacity = '1'
          setStatus('ready')
        } else if (!isFallback) {
          // primary loaded but no canvas -> try fallback
          tryFallback()
        }
      }

      const onError = () => {
        if (cancelled) return
        clearTimeout(timeout)
        if (!isFallback && !triedFallback) {
          tryFallback()
        } else {
          setStatus('fallback')
        }
      }

      viewer.addEventListener('load', onLoad)
      viewer.addEventListener('error', onError)

      viewer.style.opacity = '0'
      viewer.style.transition = 'opacity 0.6s ease'
      mountRef.current.innerHTML = ''
      mountRef.current.appendChild(viewer)

      // Attach webglcontextlost listener to canvas when it appears
      const attachContextLost = () => {
        const cvs = viewer.shadowRoot?.querySelector('canvas') || mountRef.current?.querySelector('canvas')
        if (cvs && !cvs._hasListener) {
          cvs._hasListener = true
          cvs.addEventListener('webglcontextlost', (e) => {
            e.preventDefault()
            if (!cancelled) {
              setStatus('fallback')
              try { viewer.remove() } catch {}
            }
          })
        }
      }
      // Poll for canvas for a short time to attach listener
      let canvasPoll = setInterval(attachContextLost, 500)
      setTimeout(() => clearInterval(canvasPoll), 5000)

      // If no canvas after 4s, treat as failure
      timeout = setTimeout(() => {
        if (cancelled) return
        const canvas = viewer.shadowRoot?.querySelector('canvas') || mountRef.current?.querySelector('canvas')
        if (!canvas) {
          if (!isFallback && !triedFallback) {
            tryFallback()
          } else {
            setStatus('fallback')
            try { viewer.remove() } catch {}
          }
        } else {
          viewer.style.opacity = '1'
          setStatus('ready')
        }
      }, 4000)
    }

    const tryFallback = () => {
      if (triedFallback) {
        setStatus('fallback')
        return
      }
      setTriedFallback(true)
      // clear previous viewer
      try { viewer?.remove() } catch {}
      if (mountRef.current) mountRef.current.innerHTML = ''
      // try verified public fallback
      attachViewer(FALLBACK_SCENE, true)
    }

    const init = async () => {
      const ok = await loadViewerScript()
      if (cancelled || !ok || !mountRef.current) {
        if (!cancelled) tryFallback()
        return
      }
      attachViewer(primaryUrl, false)
    }

    init()
    return () => {
      cancelled = true
      clearTimeout(timeout)
      window.removeEventListener('error', onWindowError)
      window.removeEventListener('unhandledrejection', onWindowError)
      window.removeEventListener('webglcontextlost', onContextLost)
      window.removeEventListener('webglcontextlost', onContextLost, true)
      if (contextLostHandler && viewer) {
        try { viewer.removeEventListener('webglcontextlost', contextLostHandler) } catch {}
      }
      if (viewer?.parentNode) viewer.parentNode.removeChild(viewer)
    }
  }, [primaryUrl, triedFallback])

  if (status === 'fallback') {
    return <MinimalFallback style={style} className={className} />
  }

  // While loading, show minimal fallback underneath to avoid black flash
  return (
    <div
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
    >
      <div style={{ position: 'absolute', inset: 0, opacity: status === 'loading' ? 1 : 0, transition: 'opacity 0.4s ease' }}>
        <MinimalFallback style={{ width: '100%', height: '100%' }} />
      </div>
      <div
        ref={mountRef}
        style={{
          position: 'absolute',
          inset: 0,
          opacity: status === 'ready' ? 1 : 0,
          transition: 'opacity 0.6s ease',
          background: 'transparent',
        }}
      />
    </div>
  )
}

export default SplineViewer

export function SplineSection({ scene, kicker, title, quote, children, height = 560, overlay = true }) {
  return (
    <div style={{ position: 'relative', height, overflow: 'hidden', borderRadius: 24, border: '1px solid rgba(255,255,255,0.08)', background: '#050508' }}>
      <SplineViewer scene={scene} style={{ position: 'absolute', inset: 0 }} />
      {overlay && (
        <div
          style={{
            position: 'absolute',
            inset: 0,
            background: 'linear-gradient(180deg, rgba(0,0,0,0.04) 0%, rgba(0,0,0,0.36) 58%, rgba(0,0,0,0.88) 100%)',
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

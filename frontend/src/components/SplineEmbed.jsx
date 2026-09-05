import React, { useEffect, useRef, useState, Suspense, lazy } from 'react'

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

// ErrorBoundary to catch Spline Hana/WebGL crashes and show fallback instead of blank
class SplineErrorBoundary extends React.Component {
  constructor(props) {
    super(props)
    this.state = { hasError: false }
  }
  static getDerivedStateFromError() { return { hasError: true } }
  componentDidCatch(error, info) {
    console.warn('[Spline] Caught error, showing fallback:', error, info)
  }
  render() {
    if (this.state.hasError) {
      return <MinimalFallback style={this.props.style} className={this.props.className} />
    }
    return this.props.children
  }
}

function SplineViewerInner({ scene, style, className }) {
  const mountRef = useRef(null)
  const [status, setStatus] = useState('loading') // loading | fallback | ready
  const [triedFallback, setTriedFallback] = useState(false)

  const primaryUrl = SPLINE_SCENES[scene]

  useEffect(() => {
    let cancelled = false
    let viewer = null
    let timeout = null
    let isFallback = false

    // Detect --no-sandbox or low-end GPU: if WebGL not available, fallback immediately (prevents white blank)
    const hasWebGL = (() => {
      try {
        const c = document.createElement('canvas')
        return !!(c.getContext('webgl') || c.getContext('webgl2') || c.getContext('experimental-webgl'))
      } catch { return false }
    })()
    const isNoSandbox = navigator.userAgent.includes('no-sandbox') || (() => {
      try { return !window.WebGLRenderingContext } catch { return true }
    })()
    if (!hasWebGL || isNoSandbox) {
      // Don't even try to load Spline on --no-sandbox or no WebGL, show fallback immediately
      setStatus('fallback')
      return
    }

    const onWindowError = (e) => {
      const msg = (e.message || '') + (e.error?.message || '') + (e.reason?.message || '')
      if (msg.includes('WebGPU') || msg.includes('GPUOutOfMemory') || msg.includes('CreateTexture') || msg.includes('Context lost') || msg.includes('OutOfMemory') || msg.includes('WebGL') || msg.includes('Hana') || msg.includes('wasm_bindgen')) {
        if (!cancelled) {
          setStatus('fallback')
          try { viewer?.remove() } catch {}
        }
      }
    }
    window.addEventListener('error', onWindowError)
    window.addEventListener('unhandledrejection', onWindowError)

    const loadViewerScript = () => {
      if (customElements.get('spline-viewer')) return Promise.resolve(true)
      return new Promise((resolve) => {
        const s = document.createElement('script')
        s.type = 'module'
        // Use stable 1.10.57 without Hana (2.0.10 has Hana wasm bug)
        s.src = 'https://unpkg.com/@splinetool/viewer@1.9.82/build/spline-viewer.js'
        s.onload = () => resolve(true)
        s.onerror = () => resolve(false)
        document.head.appendChild(s)
      })
    }

    const attachViewer = (url, fallback = false) => {
      isFallback = fallback
      if (cancelled || !mountRef.current) return
      // Force low-power to prevent OOM
      try { if (navigator.gpu) navigator.gpu = undefined } catch {}
      viewer = document.createElement('spline-viewer')
      viewer.url = url
      viewer.style.width = '100%'
      viewer.style.height = '100%'
      viewer.style.display = 'block'
      viewer.style.background = 'transparent'
      viewer.setAttribute('loading-anim-type', 'spinner-small-dark')

      const onLoad = () => {
        if (cancelled) return
        clearTimeout(timeout)
        const canvas = viewer.shadowRoot?.querySelector('canvas') || mountRef.current?.querySelector('canvas')
        if (canvas) {
          // Reduce canvas pixel ratio to prevent OOM on low-end
          try {
            const dpr = Math.min(window.devicePixelRatio || 1, 1.2)
            canvas.style.imageRendering = 'auto'
          } catch {}
          viewer.style.opacity = '1'
          setStatus('ready')
        } else if (!fallback) {
          tryFallback()
        }
      }
      const onError = () => {
        if (cancelled) return
        clearTimeout(timeout)
        if (!fallback && !triedFallback) tryFallback()
        else setStatus('fallback')
      }
      viewer.addEventListener('load', onLoad)
      viewer.addEventListener('error', onError)
      viewer.style.opacity = '0'
      viewer.style.transition = 'opacity 0.6s ease'
      mountRef.current.innerHTML = ''
      mountRef.current.appendChild(viewer)
      timeout = setTimeout(() => {
        if (cancelled) return
        const canvas = viewer.shadowRoot?.querySelector('canvas') || mountRef.current?.querySelector('canvas')
        if (!canvas) {
          if (!fallback && !triedFallback) tryFallback()
          else { setStatus('fallback'); try { viewer.remove() } catch {} }
        } else {
          viewer.style.opacity = '1'
          setStatus('ready')
        }
      }, 3500)
      // also watch for webglcontextlost
      const checkCanvas = setInterval(() => {
        const cvs = viewer.shadowRoot?.querySelector('canvas') || mountRef.current?.querySelector('canvas')
        if (cvs && !cvs._hasListener) {
          cvs._hasListener = true
          cvs.addEventListener('webglcontextlost', (e) => {
            e.preventDefault()
            if (!cancelled) { setStatus('fallback'); try { viewer.remove() } catch {} }
          })
        }
      }, 500)
      setTimeout(() => clearInterval(checkCanvas), 4000)
    }

    const tryFallback = () => {
      if (triedFallback) { setStatus('fallback'); return }
      setTriedFallback(true)
      try { viewer?.remove() } catch {}
      if (mountRef.current) mountRef.current.innerHTML = ''
      attachViewer(FALLBACK_SCENE, true)
    }

    const init = async () => {
      // Checklist #5: lazy-load — only fetch the viewer when scrolled into view
      const visible = await new Promise((resolve) => {
        if (cancelled) return resolve(false)
        const el = mountRef.current
        if (!el || !('IntersectionObserver' in window)) return resolve(true)
        try {
          const io = new IntersectionObserver((entries) => {
            entries.forEach((en) => {
              if (en.isIntersecting) { io.disconnect(); resolve(true) }
            })
          }, { rootMargin: '400px' })
          io.observe(el)
          // Safety: don't wait forever
          setTimeout(() => { try { io.disconnect() } catch {} resolve(true) }, 8000)
        } catch { resolve(true) }
      })
      if (cancelled || !visible) return
      // Add small delay to not block main thread, and check for --no-sandbox
      await new Promise(r => setTimeout(r, 300))
      if (cancelled) return
      const ok = await loadViewerScript()
      if (cancelled || !ok || !mountRef.current) {
        if (!cancelled) setStatus('fallback')
        return
      }
      // If still --no-sandbox or low memory, don't load heavy scene, just fallback
      if (navigator.userAgent.includes('no-sandbox') || (navigator.deviceMemory && navigator.deviceMemory < 4)) {
        setStatus('fallback')
        return
      }
      attachViewer(primaryUrl, false)
    }
    init()
    return () => {
      // Checklist #5: deallocate on unmount — remove viewer, free GL context
      cancelled = true
      clearTimeout(timeout)
      window.removeEventListener('error', onWindowError)
      window.removeEventListener('unhandledrejection', onWindowError)
      try {
        const cvs = viewer?.shadowRoot?.querySelector('canvas') || mountRef.current?.querySelector('canvas')
        cvs?.getContext('webgl2')?.getExtension('WEBGL_lose_context')?.loseContext()
        cvs?.getContext('webgl')?.getExtension('WEBGL_lose_context')?.loseContext()
      } catch {}
      if (viewer?.parentNode) viewer.parentNode.removeChild(viewer)
      if (mountRef.current) mountRef.current.innerHTML = ''
    }
  }, [primaryUrl, triedFallback])

  if (status === 'fallback') {
    return <MinimalFallback style={style} className={className} />
  }
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

export default function SplineViewer(props) {
  return (
    <SplineErrorBoundary style={props.style} className={props.className}>
      <SplineViewerInner {...props} />
    </SplineErrorBoundary>
  )
}

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

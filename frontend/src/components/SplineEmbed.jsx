import React, { useEffect, useRef, useState } from 'react'

// User's new community file — may be private/deleted (prod → 403), so we have a verified public fallback
const FILE_IDS = {
  hero: 'f0b55004-c297-4fa0-b2dc-81899f3b6ac1',
  finale: 'fe773050-28ff-478f-a162-5006b36ecec0',
  departments: '7ffaf321-83b9-473b-a02a-674c1417ff31',
}

const SPLINE_SCENES = {
  hero: `https://prod.spline.design/${FILE_IDS.hero}/scene.splinecode`,
  finale: `https://prod.spline.design/${FILE_IDS.finale}/scene.splinecode`,
  departments: `https://prod.spline.design/${FILE_IDS.departments}/scene.splinecode`,
}

// Verified public Spline scene — always returns 200 (docs example)
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

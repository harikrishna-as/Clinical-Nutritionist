import React, { useEffect, useRef, useState } from 'react'

// New community file — replaces old 9538... and the plain CSS ball fallback
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

const COMMUNITY_IFRAME = {
  hero: `https://app.spline.design/file/${FILE_IDS.hero}`,
  finale: `https://app.spline.design/file/${FILE_IDS.finale}`,
  departments: `https://app.spline.design/file/${FILE_IDS.departments}`,
}

// Hero is community file not yet published (prod → 403) → use iframe directly
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
        background: '#050508',
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
      {/* very light vignette for text readability */}
      <div
        style={{
          position: 'absolute',
          inset: 0,
          background: 'radial-gradient(ellipse at 30% 50%, rgba(15,23,42,0.08) 0%, rgba(5,5,12,0.32) 100%)',
          pointerEvents: 'none',
        }}
      />
    </div>
  )
}

// Minimal fallback — no 3D ball, just subtle gradient (never blacks out)
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
            radial-gradient(700px 500px at 50% 30%, rgba(107,124,255,0.12), transparent 65%),
            radial-gradient(500px 400px at 80% 70%, rgba(167,139,250,0.08), transparent 65%)
          `,
        }}
      />
    </div>
  )
}

function SplineViewer({ scene, style, className }) {
  const mountRef = useRef(null)
  const [useIframe, setUseIframe] = useState(!!PREFER_IFRAME[scene])
  const url = SPLINE_SCENES[scene]

  if (useIframe) {
    return <IframeEmbed scene={scene} style={style} className={className} />
  }

  // For finale/departments: try spline-viewer, fallback to minimal gradient (no ball)
  const [failed, setFailed] = useState(false)

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
        viewer.addEventListener('error', () => !cancelled && setFailed(true))
        timeout = setTimeout(() => {
          if (!cancelled && mountRef.current && !mountRef.current.querySelector('canvas')) {
            setFailed(true)
          }
        }, 4500)
        mountRef.current.innerHTML = ''
        mountRef.current.appendChild(viewer)
      } catch {
        if (!cancelled) setFailed(true)
      }
    }

    init()
    return () => {
      cancelled = true
      clearTimeout(timeout)
      if (viewer?.parentNode) viewer.parentNode.removeChild(viewer)
    }
  }, [url])

  if (failed) {
    return <MinimalFallback style={style} className={className} />
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

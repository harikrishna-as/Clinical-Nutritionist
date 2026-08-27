import React, { useRef, useState, useEffect } from 'react'
import { Camera, Upload, ScanLine, RefreshCw, AlertTriangle, CheckCircle2 } from 'lucide-react'
import { api } from '../api'
import PhoneDrop from './PhoneDrop'

const CLASS_COLORS = {
  vitamin_a: '#ef4444',
  vitamin_b_complex: '#f97316',
  vitamin_b12: '#eab308',
  vitamin_b2: '#22c55e',
  vitamin_b3: '#06b6d4',
  vitamin_b9: '#A78BFA',
  vitamin_c: '#ec4899',
  vitamin_d: '#f5b041',
}

export default function CameraLab() {
  const videoRef = useRef(null)
  const streamRef = useRef(null)
  const canvasRef = useRef(null)
  const fileInputRef = useRef(null)
  const [cameraOn, setCameraOn] = useState(false)
  const [captured, setCaptured] = useState(null)
  const [analyzing, setAnalyzing] = useState(false)
  const [result, setResult] = useState(null)
  const [error, setError] = useState(null)
  const [modelInfo, setModelInfo] = useState(null)
  const [devices, setDevices] = useState([])
  const [deviceId, setDeviceId] = useState('')
  const [showPicker, setShowPicker] = useState(false)

  const loadDevices = async () => {
    try {
      const list = await navigator.mediaDevices?.enumerateDevices?.()
      const vids = (list || []).filter((d) => d.kind === 'videoinput')
      setDevices(vids)
      return vids
    } catch {
      return []
    }
  }

  useEffect(() => {
    loadDevices()
    api.classifierStatus().then(setModelInfo).catch(() => setModelInfo(null))
    return () => stopCamera()
  }, [])

  const startCamera = async (id) => {
    const useId = id ?? deviceId
    setError(null)
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: useId ? { deviceId: { exact: useId } } : { facingMode: 'environment' },
        audio: false,
      })
      streamRef.current = stream
      if (videoRef.current) {
        videoRef.current.srcObject = stream
        await videoRef.current.play()
      }
      setCameraOn(true)
      setCaptured(null)
      setResult(null)
      loadDevices()
    } catch (e) {
      setError('Camera access denied. Use the upload option or grant camera permission.')
    }
  }

  const requestCamera = async () => {
    const list = await loadDevices()
    if (list.length <= 1 && list.length > 0) {
      startCamera(list[0].deviceId)
    } else {
      setShowPicker(true)
    }
  }

  const chooseAndStart = (id) => {
    setShowPicker(false)
    setDeviceId(id)
    if (cameraOn) stopCamera()
    setCaptured(null)
    setResult(null)
    setTimeout(() => startCamera(id), 60)
  }

  const stopCamera = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((t) => t.stop())
      streamRef.current = null
    }
    setCameraOn(false)
  }

  const capture = () => {
    const video = videoRef.current
    const canvas = canvasRef.current
    if (!video || !canvas) return
    canvas.width = video.videoWidth
    canvas.height = video.videoHeight
    canvas.getContext('2d').drawImage(video, 0, 0)
    const b64 = canvas.toDataURL('image/jpeg', 0.85).split(',')[1]
    setCaptured(b64)
    analyze(b64)
  }

  const handleFile = (e) => {
    const file = e.target.files?.[0]
    if (!file) return
    const reader = new FileReader()
    reader.onload = () => {
      const b64 = reader.result.split(',')[1]
      setCaptured(b64)
      analyze(b64)
    }
    reader.readAsDataURL(file)
  }

  const handlePhoneImage = (b64) => {
    setCaptured(b64)
    analyze(b64)
  }

  const analyze = async (b64) => {
    setAnalyzing(true)
    setResult(null)
    setError(null)
    try {
      const res = await api.analyzeImage(b64)
      setResult(res)
    } catch (err) {
      setError(err.message || 'Analysis failed')
    } finally {
      setAnalyzing(false)
    }
  }

  const confidenceColor = (p) => (p > 0.6 ? '#22c55e' : p > 0.3 ? '#f5b041' : '#ef4444')

  return (
    <div>
      <div className="section-kicker">Live Computer Vision Demo</div>
      <h2 className="section-title">Vitamin Deficiency <span className="gradient-text">Camera Lab</span></h2>
      <p className="section-sub" style={{ marginBottom: 40 }}>
        Point your camera at a skin region, capture it, and let the trained vision model (RandomForest on HSV/RGB
        features, trained on 3,200 real clinical images) identify the most likely micronutrient deficiency;
        with explainable color rationale.
      </p>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 32, alignItems: 'stretch' }}>
        {/* Camera / Upload panel */}
        <div className="card" style={{ padding: 24 }}>
          <div
            style={{
              position: 'relative',
              borderRadius: 14,
              overflow: 'hidden',
              background: '#0a101f',
              minHeight: 320,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              border: '1px solid rgba(148,163,184,0.35)',
            }}
          >
            <video
              ref={videoRef}
              style={{ width: '100%', height: '100%', objectFit: 'cover', display: cameraOn ? 'block' : 'none' }}
              muted
              playsInline
            />
            {captured && (
              <img
                src={`data:image/jpeg;base64,${captured}`}
                alt="captured"
                style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'cover' }}
              />
            )}
            {!cameraOn && !captured && (
              <div style={{ textAlign: 'center', color: '#94A3B8', padding: 40 }}>
                <ScanLine size={56} strokeWidth={1} style={{ marginBottom: 12, opacity: 0.5 }} />
                <p>Camera preview will appear here</p>
                <p style={{ fontSize: 13, opacity: 0.6 }}>Capture an image or upload a clinical photo</p>
              </div>
            )}
            {analyzing && (
              <div
                style={{
                  position: 'absolute',
                  inset: 0,
                  background: 'rgba(15,23,42,0.7)',
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  justifyContent: 'center',
                  zIndex: 3,
                }}
              >
                <div
                  style={{
                    width: 44,
                    height: 44,
                    border: '3px solid rgba(96,165,250,0.3)',
                    borderTopColor: '#60A5FA',
                    borderRadius: '50%',
                    animation: 'spin 0.8s linear infinite',
                  }}
                />
                <p style={{ marginTop: 14, color: '#A78BFA' }}>Analyzing features...</p>
              </div>
            )}
            <canvas ref={canvasRef} style={{ display: 'none' }} />
          </div>

          <div style={{ display: 'flex', gap: 12, marginTop: 18, flexWrap: 'wrap' }}>
            {!cameraOn ? (
              <button className="btn btn-primary" onClick={requestCamera}>
                <Camera size={18} /> Enable Camera
              </button>
            ) : (
              <>
                <button className="btn btn-primary" onClick={capture}>
                  <Camera size={18} /> Capture & Analyze
                </button>
                <button className="btn btn-ghost" onClick={() => { stopCamera(); setCaptured(null); setResult(null) }}>
                  <RefreshCw size={16} /> Reset
                </button>
              </>
            )}
            {devices.length > 1 && (
              <button className="btn btn-ghost" onClick={requestCamera}>
                <RefreshCw size={16} /> Change camera
              </button>
            )}
            <button className="btn btn-ghost" onClick={() => fileInputRef.current?.click()}>
              <Upload size={16} /> Upload Image
            </button>
            <PhoneDrop onImage={handlePhoneImage} label="a skin close-up for the deficiency check" />
            <input ref={fileInputRef} type="file" accept="image/*" style={{ display: 'none' }} onChange={handleFile} />
          </div>

          {modelInfo && !modelInfo.trained && (
            <p style={{ marginTop: 14, fontSize: 13, color: '#f5b041', display: 'flex', gap: 6, alignItems: 'center' }}>
              <AlertTriangle size={14} /> Vision model not trained; run train_classifier.py first.
            </p>
          )}

          {error && (
            <p style={{ marginTop: 14, fontSize: 13, color: '#ef4444', display: 'flex', gap: 6, alignItems: 'center' }}>
              <AlertTriangle size={14} /> {error}
            </p>
          )}
        </div>

        {/* Results panel */}
        <div className="card" style={{ padding: 24 }}>
          {!result ? (
            <div style={{ textAlign: 'center', color: '#94A3B8', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <div>
                <ScanLine size={48} strokeWidth={1} style={{ opacity: 0.4, marginBottom: 12 }} />
                <p>Capture or upload an image to see</p>
                <p style={{ fontSize: 13, opacity: 0.6 }}>the explainable deficiency analysis</p>
              </div>
            </div>
          ) : (
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 16 }}>
                <CheckCircle2 size={26} color={confidenceColor(result.confidence)} />
                <div>
                  <h3 style={{ fontSize: 22 }}>{result.label}</h3>
                  <span style={{ color: '#94A3B8', fontSize: 13 }}>
                    {Math.round(result.confidence * 100)}% confidence
                  </span>
                </div>
              </div>

              <div style={{ marginBottom: 18 }}>
                {result.top_predictions?.map((p, i) => (
                  <div key={p.class} style={{ marginBottom: 10 }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13, marginBottom: 4 }}>
                      <span style={{ color: '#F3F4F6' }}>{i + 1}. {p.label}</span>
                      <span style={{ color: '#94A3B8' }}>{Math.round(p.probability * 100)}%</span>
                    </div>
                    <div style={{ background: 'rgba(96,165,250,0.12)', borderRadius: 8, height: 8, overflow: 'hidden' }}>
                      <div
                        style={{
                          width: `${p.probability * 100}%`,
                          height: '100%',
                          background: i === 0 ? (CLASS_COLORS[p.class] || '#60A5FA') : 'rgba(96,165,250,0.5)',
                          borderRadius: 8,
                          transition: 'width 0.8s ease',
                        }}
                      />
                    </div>
                  </div>
                ))}
              </div>

              <h4 style={{ color: '#A78BFA', fontSize: 14, marginBottom: 10 }}>Explainable Rationale</h4>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                {result.rationale?.map((r, i) => (
                  <div key={i} style={{ background: 'rgba(96,165,250,0.08)', borderRadius: 8, padding: '10px 14px', fontSize: 13, color: '#F3F4F6', borderLeft: '3px solid #60A5FA' }}>
                    {r}
                  </div>
                ))}
              </div>

              <div style={{ marginTop: 18, background: 'rgba(34,197,94,0.08)', borderRadius: 12, padding: 16 }}>
                <h4 style={{ color: '#22c55e', fontSize: 14, marginBottom: 8 }}>Dietary Guidance</h4>
                <p style={{ fontSize: 13, marginBottom: 6 }}><strong style={{ color: '#F3F4F6' }}>Rich sources:</strong> {result.recommendations?.sources}</p>
                <p style={{ fontSize: 13 }}><strong style={{ color: '#F3F4F6' }}>Watch for:</strong> {result.recommendations?.symptoms}</p>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Camera chooser dialog */}
      {showPicker && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            zIndex: 200,
            background: 'rgba(15,23,42,0.88)',
            backdropFilter: 'blur(8px)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: 20,
          }}
          onClick={() => setShowPicker(false)}
        >
          <div
            className="card"
            style={{ width: '100%', maxWidth: 440, padding: 26, background: '#151d30' }}
            onClick={(e) => e.stopPropagation()}
          >
            <h3 style={{ marginBottom: 6, fontSize: 20 }}>Which camera do you want to use?</h3>
            <p style={{ fontSize: 13, color: '#94A3B8', marginBottom: 18 }}>
              Select the video device to access. Camera names appear after permission is granted once.
            </p>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              <button
                onClick={() => chooseAndStart('')}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 12,
                  textAlign: 'left',
                  padding: '12px 14px',
                  borderRadius: 12,
                  border: deviceId === '' ? '1.5px solid #60A5FA' : '1px solid rgba(96,165,250,0.3)',
                  background: deviceId === '' ? 'rgba(96,165,250,0.15)' : 'rgba(96,165,250,0.06)',
                  color: '#F3F4F6',
                  fontFamily: 'var(--font)',
                  fontSize: 14,
                  fontWeight: 600,
                  cursor: 'pointer',
                }}
              >
                <Camera size={18} color="#60A5FA" /> Default camera (auto)
              </button>
              {devices.map((d, i) => (
                <button
                  key={d.deviceId}
                  onClick={() => chooseAndStart(d.deviceId)}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 12,
                    textAlign: 'left',
                    padding: '12px 14px',
                    borderRadius: 12,
                    border: deviceId === d.deviceId ? '1.5px solid #60A5FA' : '1px solid rgba(96,165,250,0.3)',
                    background: deviceId === d.deviceId ? 'rgba(96,165,250,0.15)' : 'rgba(96,165,250,0.06)',
                    color: '#F3F4F6',
                    fontFamily: 'var(--font)',
                    fontSize: 14,
                    fontWeight: 600,
                    cursor: 'pointer',
                  }}
                >
                  <Camera size={18} color="#A78BFA" />
                  <span>
                    <strong style={{ display: 'block', fontWeight: 600 }}>{d.label || `Camera ${i + 1}`}</strong>
                    <em style={{ fontSize: 12, color: '#94A3B8', fontStyle: 'normal' }}>
                      {d.label ? (d.label.toLowerCase().includes('usb') || d.label.toLowerCase().includes('cam') ? 'USB / external video device' : 'Built-in video device') : 'Video input device'}
                    </em>
                  </span>
                </button>
              ))}
            </div>
            <div style={{ display: 'flex', gap: 10, marginTop: 18 }}>
              <button
                onClick={loadDevices}
                style={{
                  flex: 1,
                  padding: '10px',
                  borderRadius: 10,
                  border: '1px solid rgba(96,165,250,0.35)',
                  background: 'rgba(96,165,250,0.1)',
                  color: '#A78BFA',
                  fontFamily: 'var(--font)',
                  fontSize: 13,
                  fontWeight: 600,
                  cursor: 'pointer',
                }}
              >
                Refresh camera list
              </button>
              <button
                onClick={() => setShowPicker(false)}
                style={{
                  flex: 1,
                  padding: '10px',
                  borderRadius: 10,
                  border: '1px solid rgba(96,165,250,0.35)',
                  background: 'transparent',
                  color: '#94A3B8',
                  fontFamily: 'var(--font)',
                  fontSize: 13,
                  cursor: 'pointer',
                }}
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

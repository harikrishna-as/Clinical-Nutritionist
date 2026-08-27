import React, { useRef, useState, useEffect } from 'react'
import { Smartphone, QrCode, Bluetooth, Wifi, Link2, X, CheckCircle2, Loader2, Usb, RefreshCw } from 'lucide-react'

const API_BASE = import.meta.env.VITE_API_BASE || ''

const newRoom = () =>
  Array.from({ length: 4 }, () => 'ABCDEFGHJKMNPQRSTUVWXYZ23456789'[Math.floor(Math.random() * 32)]).join('')

const tipStyle = {
  fontSize: 12.5,
  color: '#D1D5DB',
  background: 'rgba(96,165,250,0.08)',
  borderRadius: 10,
  padding: '10px 12px',
  lineHeight: 1.5,
  marginBottom: 8,
}

export default function PhoneDrop({ onImage, label = 'a photo', accent = '#60A5FA' }) {
  const [open, setOpen] = useState(false)
  const [room] = useState(newRoom)
  const [status, setStatus] = useState('waiting')
  const [message, setMessage] = useState('')
  const [scanning, setScanning] = useState(false)
  const [btDevices, setBtDevices] = useState([])
  const [btUnsupported, setBtUnsupported] = useState(false)
  const onImageRef = useRef(onImage)
  onImageRef.current = onImage

  useEffect(() => {
    if (!open) return
    let alive = true
    const tick = async () => {
      try {
        const res = await fetch(`${API_BASE}/api/phone/poll?room=${room}`)
        const data = await res.json()
        if (!alive) return
        if (data.image) {
          setStatus('received')
          setMessage('Photo received from your phone — analyzing now.')
          onImageRef.current(data.image)
          setTimeout(() => alive && setOpen(false), 1400)
        }
      } catch {
        if (alive) setStatus('err')
      }
    }
    tick()
    const iv = setInterval(tick, 1500)
    return () => { alive = false; clearInterval(iv) }
  }, [open, room])

  useEffect(() => {
    if (!open) return
    setStatus('waiting')
    setMessage(`Scan the QR code with your phone camera and take a photo of ${label}.`)
    setBtDevices([])
    setBtUnsupported(false)
  }, [open, label])

  const bluetoothScan = async () => {
    setScanning(true)
    setMessage('Bluetooth scan started — approve the device chooser in your browser…')
    try {
      if (!navigator.bluetooth || !navigator.bluetooth.requestDevice) {
        setBtUnsupported(true)
        setMessage('Web Bluetooth is not available in this browser (iOS Safari does not support it). Use the QR code — photos transfer over Wi-Fi which is faster than Bluetooth anyway.')
        return
      }
      const device = await navigator.bluetooth.requestDevice({ acceptAllDevices: true })
      setBtDevices((d) => [...d, device.name || 'Unknown device'])
      setMessage(`Found "${device.name || 'device'}" nearby. You can now connect via Bluetooth or simply keep the phone close — the QR/room link above still transfers photos the fastest (Wi-Fi).`)
    } catch (err) {
      if (String(err?.message || '').toLowerCase().includes('cancel')) {
        setMessage('Bluetooth chooser was cancelled. Use the QR code instead.')
      } else {
        setMessage('Bluetooth scan failed: ' + (err?.message || 'unknown error'))
      }
    } finally {
      setScanning(false)
    }
  }

  return (
    <>
      <button type="button" className="btn btn-ghost" onClick={() => setOpen(true)} style={{ gap: 8 }}>
        <Smartphone size={16} /> Connect Phone
      </button>

      {open && (
        <div
          style={{
            position: 'fixed', inset: 0, zIndex: 300, background: 'rgba(15,23,42,0.9)',
            backdropFilter: 'blur(10px)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20,
          }}
          onClick={() => setOpen(false)}
        >
          <div
            className="card"
            style={{ width: '100%', maxWidth: 460, padding: 26, background: '#141b2e' }}
            onClick={(e) => e.stopPropagation()}
          >
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 4 }}>
              <h3 style={{ fontSize: 19, display: 'flex', alignItems: 'center', gap: 8 }}>
                <QrCode size={20} color={accent} /> Connect your phone
              </h3>
              <button onClick={() => setOpen(false)} style={{ background: 'none', border: 'none', color: '#94A3B8', cursor: 'pointer' }}>
                <X size={20} />
              </button>
            </div>
            <p style={{ fontSize: 13, color: '#94A3B8', marginBottom: 16 }}>
              No cable, no app install. Point your phone camera at the QR code — it opens a capture page and every
              photo you take is sent back to this lab instantly over your network (Wi-Fi, USB tethering or Bluetooth PAN).
            </p>

            <div style={{ display: 'flex', gap: 18, alignItems: 'center', marginBottom: 14 }}>
              <div
                style={{
                  width: 168, height: 168, borderRadius: 14, padding: 8,
                  background: '#fff', flexShrink: 0, position: 'relative',
                }}
              >
                <img
                  src={`${API_BASE}/api/phone/qr?room=${room}`}
                  alt="Pairing QR"
                  style={{ width: '100%', height: '100%', objectFit: 'contain' }}
                />
              </div>
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: 11.5, color: '#94A3B8', marginBottom: 4 }}>Pairing room code</div>
                <div style={{ fontSize: 30, fontWeight: 800, letterSpacing: 5, color: '#F3F4F6', fontFamily: 'monospace', marginBottom: 10 }}>
                  {room}
                </div>
                <div style={{ fontSize: 12.5, color: '#94A3B8', lineHeight: 1.5 }}>
                  QR works from any phone camera app (iOS camera / Google Lens). The phone page auto-targets this
                  session — no typing needed.
                </div>
              </div>
            </div>

            {status === 'received' ? (
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, color: '#22c55e', fontSize: 13.5, fontWeight: 700, marginBottom: 12 }}>
                <CheckCircle2 size={18} /> {message}
              </div>
            ) : (
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, color: status === 'err' ? '#ef4444' : accent, fontSize: 13, marginBottom: 12, minHeight: 20 }}>
                {status === 'waiting' ? <Loader2 size={15} className="spin-ico" /> : <Wifi size={15} />}
                {message}
              </div>
            )}

            <div className="row" style={{ marginTop: 4 }}>
              <button type="button" className="btn btn-ghost btn-sm" onClick={bluetoothScan} disabled={scanning} style={{ flex: 1, justifyContent: 'center', gap: 7 }}>
                {scanning ? <Loader2 size={14} className="spin-ico" /> : <Bluetooth size={14} />}
                {scanning ? 'Scanning…' : 'Scan Bluetooth nearby'}
              </button>
              <button type="button" className="btn btn-ghost btn-sm" onClick={() => setOpen(false)} style={{ flex: 1, justifyContent: 'center' }}>
                <Link2 size={14} /> Done
              </button>
            </div>

            {scanning && !btUnsupported && (
              <p style={{ fontSize: 12, color: '#94A3B8', textAlign: 'center', marginTop: 8 }}>
                A Bluetooth chooser will pop up — pick your phone or any nearby device.
              </p>
            )}
            {btDevices.length > 0 && (
              <p style={{ fontSize: 12.5, color: '#22c55e', marginTop: 8 }}>
                <Bluetooth size={13} style={{ verticalAlign: -2, marginRight: 4 }} />
                Found nearby: {btDevices.join(', ')}
              </p>
            )}
            {btUnsupported && (
              <p style={{ fontSize: 12.5, color: '#94A3B8', marginTop: 8 }}>
                This browser cannot run Web Bluetooth yet (iOS Safari limitation). QR/room link still works —it's faster than Bluetooth anyway.
              </p>
            )}

            <div style={{ marginTop: 14 }}>
              <details>
                <summary style={{ fontSize: 12.5, color: accent, cursor: 'pointer', marginBottom: 8 }}>
                  How each connect option works
                </summary>
                <div style={tipStyle}>
                  <strong style={{ color: '#F3F4F6' }}>Wire / USB cable:</strong> plug the phone into this PC with its charging cable — your network shares securely and photos transfer up to 10× faster than Wi-Fi. No setup needed here.
                </div>
                <div style={tipStyle}>
                  <strong style={{ color: '#F3F4F6' }}>Bluetooth live camera:</strong> keep the phone close by. Scan with the button above to see nearby devices. For a live video feed, enable <strong>DroidCam or IP Webcam</strong> on the phone (Bluetooth mode) and the phone appears as a USB camera in Camera Lab's <em>Change camera</em> picker — press <RefreshCw size={11} style={{ verticalAlign: -1 }} /> Refresh there.
                </div>
                <div style={tipStyle}>
                  <strong style={{ color: '#F3F4F6' }}>Wi-Fi (no wire at all):</strong> the QR code above is the fastest option — same network, instant delivery, works with any phone.
                </div>
              </details>
            </div>
          </div>
        </div>
      )}
    </>
  )
}
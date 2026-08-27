import { useEffect, useState, useRef, useCallback } from 'react'

export default function SplashScreen({ onComplete }) {
  const [phase, setPhase] = useState(0)
  const [progress, setProgress] = useState(0)
  const [serverUrl, setServerUrl] = useState('http://localhost:8787')
  const [codeDigits, setCodeDigits] = useState(['', '', '', '', '', ''])
  const [pairState, setPairState] = useState('idle')
  const inputRefs = useRef([])

  useEffect(() => {
    const timers = []
    timers.push(setTimeout(() => setPhase(1), 300))
    timers.push(setTimeout(() => setPhase(2), 700))
    timers.push(setTimeout(() => setPhase(3), 1000))

    const start = Date.now()
    const duration = 2000
    const interval = setInterval(() => {
      const pct = Math.min(100, ((Date.now() - start) / duration) * 100)
      setProgress(pct)
      if (pct >= 100) clearInterval(interval)
    }, 16)
    timers.push(interval)

    timers.push(setTimeout(() => setPhase(4), 3200))
    timers.push(setTimeout(() => setPhase(5), 3800))

    return () => timers.forEach(t => { clearInterval(t); clearTimeout(t) })
  }, [])

  const handleDigitChange = useCallback((index, value) => {
    if (value.length > 1) value = value.slice(-1)
    if (value && !/^[A-Z0-9]$/i.test(value)) return

    const next = [...codeDigits]
    next[index] = value.toUpperCase()
    setCodeDigits(next)

    if (value && index < 5) {
      inputRefs.current[index + 1]?.focus()
    }
  }, [codeDigits])

  const handleDigitKeyDown = useCallback((index, e) => {
    if (e.key === 'Backspace' && !codeDigits[index] && index > 0) {
      inputRefs.current[index - 1]?.focus()
      const next = [...codeDigits]
      next[index - 1] = ''
      setCodeDigits(next)
    }
  }, [codeDigits])

  const handleDigitPaste = useCallback((e) => {
    e.preventDefault()
    const text = (e.clipboardData.getData('text') || '').replace(/[^A-Za-z0-9]/g, '').toUpperCase().slice(0, 6)
    const next = ['', '', '', '', '', '']
    for (let i = 0; i < text.length; i++) next[i] = text[i]
    setCodeDigits(next)
    const focusIdx = Math.min(text.length, 5)
    inputRefs.current[focusIdx]?.focus()
  }, [])

  const code = codeDigits.join('')
  const handlePairClick = () => {
    setPairState('loading')
    setTimeout(() => setPairState('form'), 1500)
  }
  const handleSubmit = () => onComplete(serverUrl, code)

  return (
    <div className="screen splash-root">
      {phase >= 4 && (
        <div className="splash-split-left">
          <div className="splash-left-content">
            <DeviceMockup />
          </div>
        </div>
      )}

      {phase >= 5 && (
        <div className="splash-split-right">
          <div className="splash-pair-right-inner">
            <div className="splash-pair-header">
              <div className="splash-pair-logo">SF</div>
              <h3 className="splash-pair-title">StockFlow</h3>
              <p className="splash-pair-desc">Agente de Monitoreo</p>
            </div>

            <div className="splash-pair-card">
              {pairState === 'idle' && (
                <div className="splash-pair-idle">
                  <button className="splash-pair-btn" onClick={handlePairClick}>
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ marginRight: 8 }}>
                      <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" />
                      <circle cx="9" cy="7" r="4" />
                      <path d="M22 21v-2a4 4 0 0 0-3-3.87" />
                      <path d="M16 3.13a4 4 0 0 1 0 7.75" />
                    </svg>
                    Emparejar
                  </button>
                </div>
              )}

              {pairState === 'loading' && (
                <div className="splash-pair-loading">
                  <div className="splash-spinner" />
                  <span>Conectando...</span>
                </div>
              )}

              {pairState === 'form' && (
                <div className="splash-pair-form">
                  <div className="splash-pair-field">
                    <label>Servidor</label>
                    <input className="input-field" value={serverUrl} onChange={e => setServerUrl(e.target.value)} placeholder="http://localhost:8787" />
                  </div>
                  <div className="splash-pair-field">
                    <label>Codigo de Emparejamiento</label>
                    <div className="splash-otp-row" onPaste={handleDigitPaste}>
                      {codeDigits.map((d, i) => (
                        <input
                          key={i}
                          ref={el => { inputRefs.current[i] = el }}
                          className="splash-otp-input"
                          type="text"
                          inputMode="text"
                          maxLength={1}
                          value={d}
                          onChange={e => handleDigitChange(i, e.target.value)}
                          onKeyDown={e => handleDigitKeyDown(i, e)}
                        />
                      ))}
                    </div>
                  </div>
                  <button className="splash-pair-btn" onClick={handleSubmit} disabled={code.length < 6}>
                    Conectar
                  </button>
                  <button className="splash-back-btn" onClick={() => setPairState('idle')}>
                    Volver
                  </button>
                </div>
              )}

              <div className="splash-pair-social">
                <a href="https://github.com" target="_blank" rel="noreferrer" className="social-icon">
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor"><path d="M12 0C5.37 0 0 5.37 0 12c0 5.31 3.435 9.795 8.205 11.385.6.105.825-.255.825-.57 0-.285-.015-1.23-.015-2.235-3.015.555-3.795-.735-4.035-1.41-.135-.345-.72-1.41-1.23-1.695-.42-.225-1.02-.78-.015-.795.945-.015 1.62.87 1.845 1.23 1.08 1.815 2.805 1.305 3.495.99.105-.78.42-1.305.765-1.605-2.67-.3-5.46-1.335-5.46-5.925 0-1.305.465-2.385 1.23-3.225-.12-.3-.54-1.53.12-3.18 0 0 1.005-.315 3.3 1.23.96-.27 1.98-.405 3-.405s2.04.135 3 .405c2.295-1.56 3.3-1.23 3.3-1.23.66 1.65.24 2.88.12 3.18.765.84 1.23 1.905 1.23 3.225 0 4.605-2.805 5.625-5.475 5.925.435.375.81 1.095.81 2.22 0 1.605-.015 2.895-.015 3.3 0 .315.225.69.825.57A12.02 12.02 0 0024 12c0-6.63-5.37-12-12-12z"/></svg>
                </a>
                <a href="https://instagram.com" target="_blank" rel="noreferrer" className="social-icon">
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor"><path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zM12 0C8.741 0 8.333.014 7.053.072 2.695.272.273 2.69.073 7.052.014 8.333 0 8.741 0 12c0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98C8.333 23.986 8.741 24 12 24c3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98C15.668.014 15.259 0 12 0zm0 5.838a6.162 6.162 0 100 12.324 6.162 6.162 0 000-12.324zM12 16a4 4 0 110-8 4 4 0 010 8zm6.406-11.845a1.44 1.44 0 100 2.881 1.44 1.44 0 000-2.881z"/></svg>
                </a>
                <a href="https://x.com" target="_blank" rel="noreferrer" className="social-icon">
                  <svg width="12" height="12" viewBox="0 0 24 24" fill="currentColor"><path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/></svg>
                </a>
                <a href="https://youtube.com" target="_blank" rel="noreferrer" className="social-icon">
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor"><path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z"/></svg>
                </a>
              </div>
            </div>
          </div>
        </div>
      )}

      {phase < 4 && (
        <div className="splash-loading" style={{ opacity: phase >= 1 ? 1 : 0 }}>
          <div className="splash-loading-top">
            <div className="splash-pair-logo" style={{ opacity: phase >= 2 ? 1 : 0 }}>SF</div>
            <div style={{ opacity: phase >= 2 ? 1 : 0, transition: 'opacity 0.6s ease' }}>
              <h1 className="splash-loading-title">StockFlow</h1>
              <p className="splash-loading-sub">Agente de Monitoreo</p>
            </div>
          </div>

          <div className="splash-loading-mockup">
            <DeviceMockup />
          </div>

          <div className="splash-loading-bottom" style={{ opacity: phase >= 3 ? 1 : 0 }}>
            <div className="splash-progress-bar">
              <div className="splash-progress-fill" style={{ width: `${progress}%` }} />
            </div>
            <span className="splash-progress-text">{Math.round(progress)}%</span>
          </div>
        </div>
      )}
    </div>
  )
}

function DeviceMockup() {
  const bars = [35, 55, 40, 70, 52, 88, 64]
  const phoneBars = [45, 70, 38, 85, 60]

  return (
    <div style={{ position: 'relative', width: '100%', maxWidth: 480, margin: '0 auto' }}>
      <div style={{
        position: 'absolute', left: '50%', top: '50%',
        width: 380, height: 380,
        transform: 'translate(-50%, -50%)',
        borderRadius: '50%',
        background: 'rgba(37, 99, 235, 0.15)',
        filter: 'blur(100px)',
        pointerEvents: 'none',
      }} />

      <div style={{ position: 'relative', paddingRight: 56, paddingBottom: 56, paddingTop: 12 }}>
        <div style={{
          background: 'rgba(17, 24, 39, 0.85)',
          backdropFilter: 'blur(12px)',
          border: '1px solid rgba(37, 99, 235, 0.25)',
          borderRadius: 12,
          overflow: 'hidden',
          boxShadow: '0 25px 60px rgba(0,0,0,0.5)',
        }}>
          <div style={{
            display: 'flex', alignItems: 'center', gap: 7,
            borderBottom: '1px solid rgba(255,255,255,0.05)',
            background: 'rgba(30, 41, 59, 0.9)',
            padding: '8px 14px',
          }}>
            <span style={{ width: 9, height: 9, borderRadius: '50%', background: 'rgba(239,68,68,0.7)' }} />
            <span style={{ width: 9, height: 9, borderRadius: '50%', background: 'rgba(245,158,11,0.7)' }} />
            <span style={{ width: 9, height: 9, borderRadius: '50%', background: 'rgba(16,185,129,0.7)' }} />
            <span style={{
              marginLeft: 10, height: 20, flex: 1,
              borderRadius: 6, background: 'rgba(30,41,59,1)',
              display: 'flex', alignItems: 'center',
              padding: '0 10px', fontSize: 10, color: '#64748B',
            }}>stockflow.app/pos</span>
          </div>

          <div style={{ display: 'flex' }}>
            <div style={{
              width: 90, flexShrink: 0, padding: 14,
              borderRight: '1px solid rgba(255,255,255,0.05)',
              background: 'rgba(15, 23, 42, 0.9)',
              display: 'flex', flexDirection: 'column', gap: 10,
            }}>
              <span style={{
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                width: 30, height: 30, borderRadius: 8,
                background: '#2563EB', fontSize: 13, fontWeight: 900, color: 'white',
              }}>S</span>
              {[0,1,2,3].map(i => (
                <div key={i} style={{
                  height: 9, borderRadius: 4,
                  width: i === 0 ? '100%' : '80%',
                  background: i === 0 ? 'rgba(59,130,246,0.6)' : 'rgba(255,255,255,0.1)',
                }} />
              ))}
            </div>

            <div style={{ flex: 1, padding: 16, display: 'flex', flexDirection: 'column', gap: 12 }}>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 8 }}>
                {['S/ 1,240', '+86', 'S/ 58'].map((v, i) => (
                  <div key={i} style={{
                    borderRadius: 8, padding: '8px 10px',
                    background: 'rgba(30,41,59,0.8)',
                    border: '1px solid rgba(255,255,255,0.05)',
                  }}>
                    <div style={{ height: 5, width: '75%', borderRadius: 3, background: 'rgba(255,255,255,0.1)', marginBottom: 5 }} />
                    <p style={{ fontSize: 10, fontWeight: 700, color: i === 0 ? '#60A5FA' : '#CBD5E1', margin: 0 }}>{v}</p>
                  </div>
                ))}
              </div>

              <div style={{
                display: 'flex', alignItems: 'flex-end', gap: 6,
                height: 80, borderRadius: 8, padding: 10,
                background: 'rgba(30,41,59,0.8)',
                border: '1px solid rgba(255,255,255,0.05)',
              }}>
                {bars.map((h, i) => (
                  <div key={i} style={{
                    flex: 1, height: `${h}%`, borderRadius: 3,
                    background: i === 5 ? 'linear-gradient(to top, #2563EB, #22D3EE)' : 'rgba(37,99,235,0.4)',
                  }} />
                ))}
              </div>

              {[0,1,2].map(i => (
                <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 9 }}>
                  <span style={{
                    width: 22, height: 22, borderRadius: 6, flexShrink: 0,
                    background: 'rgba(37,99,235,0.2)',
                    border: '1px solid rgba(37,99,235,0.3)',
                  }} />
                  <span style={{ height: 7, flex: 1, borderRadius: 4, background: 'rgba(255,255,255,0.1)' }} />
                  <span style={{ height: 7, width: 38, borderRadius: 4, background: 'rgba(52,211,153,0.4)' }} />
                </div>
              ))}
            </div>
          </div>
        </div>

        <div style={{
          position: 'relative', margin: '0 -24px', height: 11,
          borderRadius: '0 0 14px 14px',
          background: 'linear-gradient(to bottom, rgba(100,116,139,0.6), rgba(30,41,59,1))',
          boxShadow: '0 8px 20px rgba(0,0,0,0.3)',
        }}>
          <div style={{
            position: 'absolute', left: '50%', top: 0,
            width: 56, height: 5,
            transform: 'translateX(-50%)',
            borderRadius: '0 0 6px 6px',
            background: 'rgba(15,23,42,1)',
          }} />
        </div>

        <div style={{
          position: 'absolute', bottom: 0, right: 0,
          width: 150, transform: 'rotate(3deg)',
          borderRadius: 28,
          border: '5px solid #1E293B',
          background: 'rgba(15,23,42,1)',
          boxShadow: '0 20px 50px rgba(0,0,0,0.6)',
          overflow: 'hidden',
        }}>
          <div style={{ position: 'relative', overflow: 'hidden', borderRadius: 20 }}>
            <div style={{ margin: '6px auto 0', width: 42, height: 7, borderRadius: 4, background: '#475569' }} />
            <div style={{ padding: 10, display: 'flex', flexDirection: 'column', gap: 8 }}>
              <div style={{ borderRadius: 12, padding: '8px 10px', background: 'linear-gradient(135deg, #2563EB, #1E40AF)' }}>
                <p style={{ fontSize: 8, fontWeight: 500, textTransform: 'uppercase', letterSpacing: 1, color: '#93C5FD', margin: 0 }}>Ventas hoy</p>
                <p style={{ fontSize: 14, fontWeight: 900, color: 'white', margin: 0 }}>S/ 1,240</p>
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 6 }}>
                <div style={{ borderRadius: 8, padding: 7, background: 'rgba(30,41,59,0.8)', border: '1px solid rgba(255,255,255,0.05)' }}>
                  <div style={{ height: 4, width: '75%', borderRadius: 2, background: 'rgba(255,255,255,0.1)', marginBottom: 4 }} />
                  <p style={{ fontSize: 9, fontWeight: 700, color: '#34D399', margin: 0 }}>+86</p>
                </div>
                <div style={{ borderRadius: 8, padding: 7, background: 'rgba(30,41,59,0.8)', border: '1px solid rgba(255,255,255,0.05)' }}>
                  <div style={{ height: 4, width: '75%', borderRadius: 2, background: 'rgba(255,255,255,0.1)', marginBottom: 4 }} />
                  <p style={{ fontSize: 9, fontWeight: 700, color: '#60A5FA', margin: 0 }}>S/ 58</p>
                </div>
              </div>
              <div style={{
                display: 'flex', alignItems: 'flex-end', gap: 5,
                height: 48, borderRadius: 8, padding: 6,
                background: 'rgba(30,41,59,0.8)',
                border: '1px solid rgba(255,255,255,0.05)',
              }}>
                {phoneBars.map((h, i) => (
                  <div key={i} style={{
                    flex: 1, height: `${h}%`, borderRadius: 2,
                    background: i === 3 ? '#22D3EE' : 'rgba(37,99,235,0.5)',
                  }} />
                ))}
              </div>
              <div style={{
                display: 'flex', alignItems: 'center', justifyContent: 'space-around',
                borderRadius: 8, padding: '6px 0',
                background: 'rgba(30,41,59,0.8)',
                border: '1px solid rgba(255,255,255,0.05)',
              }}>
                <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="#60A5FA" strokeWidth="2"><circle cx="9" cy="21" r="1"/><circle cx="20" cy="21" r="1"/><path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6"/></svg>
                <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="#475569" strokeWidth="2"><path d="M18 20V10"/><path d="M12 20V4"/><path d="M6 20v-6"/></svg>
                <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="#475569" strokeWidth="2"><rect x="5" y="2" width="14" height="20" rx="2" ry="2"/><line x1="12" y1="18" x2="12.01" y2="18"/></svg>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div style={{
        position: 'absolute', left: -8, top: 36,
        display: 'flex', alignItems: 'center', gap: 6,
        borderRadius: 999, padding: '5px 12px',
        border: '1px solid rgba(255,255,255,0.1)',
        background: 'rgba(30,41,59,0.9)',
        backdropFilter: 'blur(8px)',
        fontSize: 11, fontWeight: 600, color: '#CBD5E1',
        boxShadow: '0 8px 16px rgba(0,0,0,0.3)',
      }}>
        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#60A5FA" strokeWidth="2"><rect x="2" y="3" width="20" height="14" rx="2" ry="2"/><line x1="8" y1="21" x2="16" y2="21"/><line x1="12" y1="17" x2="12" y2="21"/></svg>
        Web &middot; POS
      </div>
      <div style={{
        position: 'absolute', right: 8, top: 8,
        display: 'flex', alignItems: 'center', gap: 6,
        borderRadius: 999, padding: '5px 12px',
        border: '1px solid rgba(255,255,255,0.1)',
        background: 'rgba(30,41,59,0.9)',
        backdropFilter: 'blur(8px)',
        fontSize: 11, fontWeight: 600, color: '#CBD5E1',
        boxShadow: '0 8px 16px rgba(0,0,0,0.3)',
      }}>
        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#22D3EE" strokeWidth="2"><rect x="5" y="2" width="14" height="20" rx="2" ry="2"/><line x1="12" y1="18" x2="12.01" y2="18"/></svg>
        Movil &middot; Ventas
      </div>
    </div>
  )
}

import { useState } from 'react'
import { DEFAULT_SERVER_URL, SERVER_CONNECTED_TEXT } from '../config'

export default function PairScreen({ pairingCode, setPairingCode, onConnect, onBack }) {
  const [code, setCode] = useState(pairingCode)

  const handlePair = () => {
    setServerUrl(DEFAULT_SERVER_URL)
    setPairingCode(code)
    onConnect()
  }

  return (
    <div className="screen">
      <div style={{
        flex: 1,
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '40px 48px',
        animation: 'fadeIn 0.6s ease',
      }}>
        <h1 style={{
          fontSize: 28,
          fontWeight: 700,
          color: '#F1F5F9',
          marginBottom: 8,
          letterSpacing: -0.5,
        }}>
          Emparejar PC
        </h1>
        <p style={{
          fontSize: 14,
          color: '#94A3B8',
          marginBottom: 36,
        }}>
          Ingresa los datos del servidor para conectar
        </p>

        <div style={{ width: '100%', maxWidth: 340, marginBottom: 24 }}>
          <label style={{
            display: 'block',
            fontSize: 13,
            color: '#94A3B8',
            marginBottom: 8,
            fontWeight: 500,
          }}>
            Servidor
          </label>
          <input
            type="text"
            className="input-field"
            value={SERVER_CONNECTED_TEXT}
            readOnly
            style={{ color: '#60A5FA', fontWeight: 600 }}
          />
        </div>

        <div style={{ width: '100%', maxWidth: 340, marginBottom: 40 }}>
          <label style={{
            display: 'block',
            fontSize: 13,
            color: '#94A3B8',
            marginBottom: 8,
            fontWeight: 500,
          }}>
            Codigo de Emparejamiento
          </label>
          <input
            type="text"
            className="input-field"
            value={code}
            onChange={(e) => {
              let val = e.target.value.toUpperCase().replace(/[^A-Z0-9]/g, '')
              if (val.length > 4) val = val.slice(0, 4) + '-' + val.slice(4, 8)
              setCode(val)
            }}
            placeholder="XXXX-XXXX"
            style={{
              textAlign: 'center',
              fontSize: 24,
              fontFamily: 'ui-monospace, Consolas, monospace',
              fontWeight: 700,
              letterSpacing: 4,
              color: '#3B82F6',
            }}
            maxLength={9}
          />
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 12, width: '100%', maxWidth: 340 }}>
          <button className="btn-primary" onClick={handlePair} style={{ width: '100%' }}>
            Emparejar
          </button>
          <button className="btn-ghost" onClick={onBack} style={{ width: '100%' }}>
            Volver
          </button>
        </div>
      </div>

      <div style={{
        position: 'absolute',
        bottom: 32,
        left: 0,
        right: 0,
        display: 'flex',
        justifyContent: 'center',
      }}>
        <div className="social-icons">
          <a href="https://github.com" target="_blank" rel="noreferrer" className="social-icon">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
              <path d="M12 0C5.37 0 0 5.37 0 12c0 5.31 3.435 9.795 8.205 11.385.6.105.825-.255.825-.57 0-.285-.015-1.23-.015-2.235-3.015.555-3.795-.735-4.035-1.41-.135-.345-.72-1.41-1.23-1.695-.42-.225-1.02-.78-.015-.795.945-.015 1.62.87 1.845 1.23 1.08 1.815 2.805 1.305 3.495.99.105-.78.42-1.305.765-1.605-2.67-.3-5.46-1.335-5.46-5.925 0-1.305.465-2.385 1.23-3.225-.12-.3-.54-1.53.12-3.18 0 0 1.005-.315 3.3 1.23.96-.27 1.98-.405 3-.405s2.04.135 3 .405c2.295-1.56 3.3-1.23 3.3-1.23.66 1.65.24 2.88.12 3.18.765.84 1.23 1.905 1.23 3.225 0 4.605-2.805 5.625-5.475 5.925.435.375.81 1.095.81 2.22 0 1.605-.015 2.895-.015 3.3 0 .315.225.69.825.57A12.02 12.02 0 0024 12c0-6.63-5.37-12-12-12z"/>
            </svg>
          </a>
          <a href="https://instagram.com" target="_blank" rel="noreferrer" className="social-icon">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
              <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zM12 0C8.741 0 8.333.014 7.053.072 2.695.272.273 2.69.073 7.052.014 8.333 0 8.741 0 12c0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98C8.333 23.986 8.741 24 12 24c3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98C15.668.014 15.259 0 12 0zm0 5.838a6.162 6.162 0 100 12.324 6.162 6.162 0 000-12.324zM12 16a4 4 0 110-8 4 4 0 010 8zm6.406-11.845a1.44 1.44 0 100 2.881 1.44 1.44 0 000-2.881z"/>
            </svg>
          </a>
          <a href="https://x.com" target="_blank" rel="noreferrer" className="social-icon">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor">
              <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/>
            </svg>
          </a>
          <a href="https://youtube.com" target="_blank" rel="noreferrer" className="social-icon">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
              <path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z"/>
            </svg>
          </a>
        </div>
      </div>
    </div>
  )
}

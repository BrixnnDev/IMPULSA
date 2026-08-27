import { useState } from 'react'

function Toggle({ value, onChange }) {
  return (
    <div
      onClick={() => onChange(!value)}
      style={{
        width: 44,
        height: 24,
        borderRadius: 12,
        background: value ? '#2563EB' : 'rgba(255,255,255,0.1)',
        cursor: 'pointer',
        position: 'relative',
        transition: 'background 0.3s ease',
        flexShrink: 0,
      }}
    >
      <div style={{
        width: 18,
        height: 18,
        borderRadius: '50%',
        background: 'white',
        position: 'absolute',
        top: 3,
        left: value ? 23 : 3,
        transition: 'left 0.3s ease',
        boxShadow: '0 1px 4px rgba(0,0,0,0.2)',
      }} />
    </div>
  )
}

export default function ConfigScreen({ serverUrl, pcInfo, onDisconnect }) {
  const [url, setUrl] = useState(serverUrl)
  const [pcName, setPcName] = useState(pcInfo?.pcName || '')
  const [autoStart, setAutoStart] = useState(true)
  const [notifications, setNotifications] = useState(true)
  const [saved, setSaved] = useState(false)

  const handleSave = () => {
    setSaved(true)
    setTimeout(() => setSaved(false), 2000)
  }

  const handleClear = () => {
    setUrl('http://localhost:8787')
    setPcName('')
    setAutoStart(true)
    setNotifications(true)
  }

  return (
    <div style={{
      height: '100%',
      overflow: 'auto',
      padding: 24,
      animation: 'fadeIn 0.4s ease',
    }}>
      <h3 style={{ fontSize: 16, fontWeight: 600, color: '#F1F5F9', marginBottom: 20 }}>
        Configuracion
      </h3>

      <div style={{
        borderRadius: 16,
        background: 'rgba(17, 24, 39, 0.4)',
        border: '1px solid rgba(255,255,255,0.06)',
        padding: 20,
        marginBottom: 16,
      }}>
        <div style={{ marginBottom: 16 }}>
          <label style={{
            display: 'block',
            fontSize: 13,
            color: '#94A3B8',
            marginBottom: 8,
            fontWeight: 500,
          }}>
            URL del Servidor
          </label>
          <input
            type="text"
            className="input-field"
            value={url}
            onChange={(e) => setUrl(e.target.value)}
          />
        </div>

        <div style={{ marginBottom: 0 }}>
          <label style={{
            display: 'block',
            fontSize: 13,
            color: '#94A3B8',
            marginBottom: 8,
            fontWeight: 500,
          }}>
            Nombre de la PC
          </label>
          <input
            type="text"
            className="input-field"
            value={pcName}
            onChange={(e) => setPcName(e.target.value)}
          />
        </div>
      </div>

      <div style={{
        borderRadius: 16,
        background: 'rgba(17, 24, 39, 0.4)',
        border: '1px solid rgba(255,255,255,0.06)',
        padding: 20,
        marginBottom: 16,
      }}>
        <div style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          marginBottom: 16,
        }}>
          <div>
            <div style={{ fontSize: 14, fontWeight: 500, color: '#F1F5F9' }}>
              Inicio automatico
            </div>
            <div style={{ fontSize: 12, color: '#64748B', marginTop: 2 }}>
              Iniciar monitoreo al abrir la app
            </div>
          </div>
          <Toggle value={autoStart} onChange={setAutoStart} />
        </div>

        <div style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
        }}>
          <div>
            <div style={{ fontSize: 14, fontWeight: 500, color: '#F1F5F9' }}>
              Notificaciones
            </div>
            <div style={{ fontSize: 12, color: '#64748B', marginTop: 2 }}>
              Mostrar alertas de eventos
            </div>
          </div>
          <Toggle value={notifications} onChange={setNotifications} />
        </div>
      </div>

      <div style={{
        borderRadius: 16,
        background: 'rgba(17, 24, 39, 0.4)',
        border: '1px solid rgba(255,255,255,0.06)',
        padding: 20,
        marginBottom: 24,
      }}>
        <div style={{ fontSize: 13, color: '#94A3B8', marginBottom: 12, fontWeight: 500 }}>
          Estado de conexion
        </div>
        <div style={{ display: 'flex', gap: 16, flexWrap: 'wrap' }}>
          {[
            { label: 'Servidor', value: serverUrl, color: '#10B981' },
            { label: 'PC', value: pcInfo?.pcName || pcName, color: '#3B82F6' },
            { label: 'IP', value: pcInfo?.ip || '---', color: '#F1F5F9' },
          ].map(item => (
            <div key={item.label} style={{
              flex: '1 1 0',
              minWidth: 100,
              padding: '10px 12px',
              borderRadius: 10,
              background: 'rgba(255,255,255,0.03)',
              border: '1px solid rgba(255,255,255,0.05)',
            }}>
              <div style={{ fontSize: 11, color: '#64748B', marginBottom: 4 }}>
                {item.label}
              </div>
              <div style={{
                fontSize: 13,
                fontWeight: 500,
                color: item.color,
                whiteSpace: 'nowrap',
                overflow: 'hidden',
                textOverflow: 'ellipsis',
              }}>
                {item.value}
              </div>
            </div>
          ))}
        </div>
      </div>

      <div style={{ display: 'flex', gap: 12, marginBottom: 20 }}>
        <button
          className="btn-primary"
          onClick={handleSave}
          style={{ flex: 1 }}
        >
          {saved ? 'Guardado!' : 'Guardar'}
        </button>
        <button
          className="btn-ghost"
          onClick={handleClear}
          style={{ flex: 1 }}
        >
          Limpiar
        </button>
      </div>

      <button
        className="btn-danger"
        onClick={onDisconnect}
        style={{ width: '100%' }}
      >
        Desconectar
      </button>
    </div>
  )
}

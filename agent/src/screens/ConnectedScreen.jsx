import { useState, useEffect, useRef, useCallback } from 'react'
import { io } from 'socket.io-client'
import { invoke } from '@tauri-apps/api/core'

export default function ConnectedScreen({ pcInfo, serverUrl, onDisconnect }) {
  const [heartbeatActive, setHeartbeatActive] = useState(true)
  const [userInfo, setUserInfo] = useState(pcInfo?.userInfo || null)
  const [lastHeartbeat, setLastHeartbeat] = useState(null)
  const socketRef = useRef(null)
  const intervalRef = useRef(null)

  useEffect(() => {
    const fetchUserInfo = async () => {
      if (userInfo) return
      try {
        const resp = await fetch(`${serverUrl}/api/pc/user-info?code=${pcInfo?.pairingCode}`)
        if (resp.ok) {
          const data = await resp.json()
          if (data?.user) setUserInfo(data.user)
        }
      } catch {}
    }
    fetchUserInfo()
  }, [serverUrl, pcInfo, userInfo])

  useEffect(() => {
    const sendHeartbeat = async () => {
      try {
        const resp = await fetch(`${serverUrl}/api/pc/heartbeat`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            pc_name: pcInfo?.pcName || 'Unknown',
            ip: pcInfo?.ip,
            mac: pcInfo?.mac,
            pairing_code: pcInfo?.pairingCode,
          }),
        })
        if (resp.ok) {
          const data = await resp.json().catch(() => null)
          if (data?.user) setUserInfo(data.user)
          setLastHeartbeat(new Date())
        }
        setHeartbeatActive(true)
      } catch {
        setHeartbeatActive(false)
      }
    }

    sendHeartbeat()
    intervalRef.current = setInterval(sendHeartbeat, 30000)

    try {
      const socket = io(serverUrl, {
        transports: ['websocket', 'polling'],
        reconnection: true,
      })

      socket.on('connect', () => {
        socket.emit('pc:register', {
          pcName: pcInfo?.pcName,
          ip: pcInfo?.ip,
          mac: pcInfo?.mac,
        })
      })

      socket.on('heartbeat:ack', () => {
        setLastHeartbeat(new Date())
      })

      socketRef.current = socket
    } catch {}

    return () => {
      clearInterval(intervalRef.current)
      socketRef.current?.disconnect()
    }
  }, [pcInfo, serverUrl])

  const handleMinimize = useCallback(async () => {
    try {
      await invoke('hide_to_tray')
    } catch {
      try {
        const { getCurrentWindow } = await import('@tauri-apps/api/window')
        const win = getCurrentWindow()
        await win.hide()
      } catch {}
    }
  }, [])

  const handleDisconnect = useCallback(() => {
    socketRef.current?.disconnect()
    onDisconnect()
  }, [onDisconnect])

  const initials = (userInfo?.name || pcInfo?.pcName || 'U')
    .split(' ')
    .map(w => w[0])
    .join('')
    .toUpperCase()
    .slice(0, 2)

  return (
    <div className="screen connected-root">
      <div className="connected-header">
        <div className="connected-header-left">
          <div className="connected-sf-logo">SF</div>
          <div>
            <div className="connected-pc-name">{pcInfo?.pcName || 'PC'}</div>
            <div className="connected-status">Conectada</div>
          </div>
        </div>

        <div className="connected-header-right">
          <div className="connected-heartbeat">
            <div className={`connected-hb-dot ${heartbeatActive ? 'active' : 'inactive'}`} />
            <span>{heartbeatActive ? 'En linea' : 'Sin conexion'}</span>
          </div>
          <button className="connected-close-btn" onClick={handleMinimize} title="Enviar a segundo plano">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <line x1="5" y1="12" x2="19" y2="12" />
            </svg>
          </button>
        </div>
      </div>

      <div className="connected-body">
        <div className="connected-profile-card">
          <div className="connected-avatar">
            {userInfo?.avatar_url ? (
              <img src={userInfo.avatar_url} alt="" style={{ width: '100%', height: '100%', borderRadius: '50%', objectFit: 'cover' }} />
            ) : (
              <span>{initials}</span>
            )}
          </div>

          <h2 className="connected-user-name">{userInfo?.name || 'Usuario'}</h2>
          <p className="connected-user-email">{userInfo?.email || 'Sin email registrado'}</p>

          <div className="connected-divider" />

          <div className="connected-info-grid">
            <div className="connected-info-item">
              <span className="connected-info-label">Rol</span>
              <span className="connected-info-value">{userInfo?.role || 'digitador'}</span>
            </div>
            <div className="connected-info-item">
              <span className="connected-info-label">PC</span>
              <span className="connected-info-value">{pcInfo?.pcName}</span>
            </div>
            <div className="connected-info-item">
              <span className="connected-info-label">IP</span>
              <span className="connected-info-value">{pcInfo?.ip}</span>
            </div>
            <div className="connected-info-item">
              <span className="connected-info-label">Sistema</span>
              <span className="connected-info-value">{pcInfo?.so}</span>
            </div>
            <div className="connected-info-item">
              <span className="connected-info-label">MAC</span>
              <span className="connected-info-value">{pcInfo?.mac}</span>
            </div>
            <div className="connected-info-item">
              <span className="connected-info-label">Codigo</span>
              <span className="connected-info-value connected-code">{pcInfo?.pairingCode}</span>
            </div>
          </div>

          {lastHeartbeat && (
            <div className="connected-hb-time">
              Ultimo heartbeat: {lastHeartbeat.toLocaleTimeString('es-PE')}
            </div>
          )}
        </div>

        <div className="connected-actions">
          <button className="connected-minimize-btn" onClick={handleMinimize}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <rect x="2" y="2" width="20" height="20" rx="5" ry="5" />
              <line x1="12" y1="8" x2="12" y2="16" />
              <line x1="8" y1="12" x2="16" y2="12" />
            </svg>
            Minimizar a bandeja
          </button>
          <button className="connected-disconnect-btn" onClick={handleDisconnect}>
            Desconectar PC
          </button>
        </div>
      </div>
    </div>
  )
}

import { useState, useEffect, useRef, useMemo } from 'react'
import { io } from 'socket.io-client'

export default function MonitorScreen({ serverUrl, pcInfo }) {
  const [events, setEvents] = useState([])
  const [toasts, setToasts] = useState([])
  const socketRef = useRef(null)
  const eventsEndRef = useRef(null)

  const mockEvents = useMemo(() => [
    { id: 'm1', type: 'print', documentName: 'Factura_2024_001.pdf', time: new Date('2026-08-26T20:30:00'), status: 'completado' },
    { id: 'm2', type: 'scan', documentName: 'Documento_ID_frontal.jpg', time: new Date('2026-08-26T20:25:00'), status: 'completado' },
    { id: 'm3', type: 'print', documentName: 'Reporte_Mensual_Q4.xlsx', time: new Date('2026-08-26T20:20:00'), status: 'completado' },
  ], [])

  useEffect(() => {
    const socket = io(serverUrl, {
      transports: ['websocket', 'polling'],
      reconnection: true,
    })

    socket.on('connect', () => {
      socket.emit('monitor:subscribe', { pcName: pcInfo?.pcName })
    })

    socket.on('print:event', (data) => {
      const event = { ...data, id: Date.now(), type: 'print', time: new Date() }
      setEvents(prev => [event, ...prev].slice(0, 50))
      setToasts(prev => [...prev, { ...event, toastId: Date.now() }].slice(-3))
    })

    socket.on('scan:event', (data) => {
      const event = { ...data, id: Date.now(), type: 'scan', time: new Date() }
      setEvents(prev => [event, ...prev].slice(0, 50))
      setToasts(prev => [...prev, { ...event, toastId: Date.now() }].slice(-3))
    })

    socketRef.current = socket
    return () => socket.disconnect()
  }, [serverUrl, pcInfo])

  useEffect(() => {
    if (toasts.length === 0) return
    const timer = setTimeout(() => {
      setToasts(prev => prev.slice(1))
    }, 4000)
    return () => clearTimeout(timer)
  }, [toasts])

  const displayEvents = events.length > 0 ? events : mockEvents.map(e => ({ ...e, pcName: pcInfo?.pcName || 'PC' }))

  return (
    <div style={{
      height: '100%',
      display: 'flex',
      flexDirection: 'column',
      position: 'relative',
      animation: 'fadeIn 0.4s ease',
    }}>
      <div style={{
        padding: '20px 24px 12px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
      }}>
        <h3 style={{ fontSize: 16, fontWeight: 600, color: '#F1F5F9' }}>
          Eventos en tiempo real
        </h3>
        <span style={{
          fontSize: 12,
          color: '#64748B',
          padding: '4px 10px',
          borderRadius: 6,
          background: 'rgba(16, 185, 129, 0.1)',
          border: '1px solid rgba(16, 185, 129, 0.2)',
        }}>
          {displayEvents.length} eventos
        </span>
      </div>

      <div style={{
        flex: 1,
        overflow: 'auto',
        padding: '0 24px 24px',
      }}>
        {displayEvents.map((event, i) => (
          <div
            key={event.id || i}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 14,
              padding: '14px 16px',
              borderRadius: 12,
              background: 'rgba(17, 24, 39, 0.4)',
              border: '1px solid rgba(255,255,255,0.05)',
              marginBottom: 8,
              animation: `slideInRight 0.3s ease ${i * 0.05}s both`,
            }}
          >
            <div style={{
              width: 40,
              height: 40,
              borderRadius: 10,
              background: event.type === 'print' ? 'rgba(37, 99, 235, 0.15)' : 'rgba(16, 185, 129, 0.15)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              flexShrink: 0,
            }}>
              {event.type === 'print' ? (
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#3B82F6" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <polyline points="6 9 6 2 18 2 18 9" />
                  <path d="M6 18H4a2 2 0 0 1-2-2v-5a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v5a2 2 0 0 1-2 2h-2" />
                  <rect x="6" y="14" width="12" height="8" />
                </svg>
              ) : (
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#10B981" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <rect x="2" y="3" width="20" height="14" rx="2" />
                  <line x1="8" y1="21" x2="16" y2="21" />
                  <line x1="12" y1="17" x2="12" y2="21" />
                </svg>
              )}
            </div>

            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{
                fontSize: 14,
                fontWeight: 500,
                color: '#F1F5F9',
                whiteSpace: 'nowrap',
                overflow: 'hidden',
                textOverflow: 'ellipsis',
              }}>
                {event.documentName || 'Documento sin nombre'}
              </div>
              <div style={{ fontSize: 12, color: '#64748B', marginTop: 2 }}>
                {event.pcName || pcInfo?.pcName} · {formatTime(event.time)}
              </div>
            </div>

            <div style={{
              padding: '3px 10px',
              borderRadius: 6,
              fontSize: 11,
              fontWeight: 600,
              textTransform: 'uppercase',
              background: event.type === 'print' ? 'rgba(37, 99, 235, 0.15)' : 'rgba(16, 185, 129, 0.15)',
              color: event.type === 'print' ? '#3B82F6' : '#10B981',
              flexShrink: 0,
            }}>
              {event.type === 'print' ? 'Impresion' : 'Escaneo'}
            </div>
          </div>
        ))}
        <div ref={eventsEndRef} />
      </div>

      {toasts.map((toast, i) => (
        <div
          key={toast.toastId}
          style={{
            position: 'absolute',
            bottom: 24 + i * 60,
            right: 24,
            display: 'flex',
            alignItems: 'center',
            gap: 12,
            padding: '12px 18px',
            borderRadius: 12,
            background: 'rgba(17, 24, 39, 0.9)',
            backdropFilter: 'blur(20px)',
            border: `1px solid ${toast.type === 'print' ? 'rgba(37,99,235,0.3)' : 'rgba(16,185,129,0.3)'}`,
            boxShadow: '0 8px 32px rgba(0,0,0,0.3)',
            animation: 'fadeInUp 0.3s ease',
            zIndex: 10,
            maxWidth: 320,
          }}
        >
          <div style={{
            width: 8,
            height: 8,
            borderRadius: '50%',
            background: toast.type === 'print' ? '#3B82F6' : '#10B981',
            animation: 'pulse 1s ease-in-out infinite',
            flexShrink: 0,
          }} />
          <div>
            <div style={{ fontSize: 13, fontWeight: 500, color: '#F1F5F9' }}>
              {toast.type === 'print' ? 'Nueva impresion' : 'Nuevo escaneo'}
            </div>
            <div style={{ fontSize: 11, color: '#64748B', marginTop: 1 }}>
              {toast.documentName}
            </div>
          </div>
        </div>
      ))}
    </div>
  )
}

function formatTime(date) {
  if (!date) return ''
  const d = new Date(date)
  const now = new Date()
  const diff = Math.floor((now - d) / 1000)
  if (diff < 60) return 'hace un momento'
  if (diff < 3600) return `hace ${Math.floor(diff / 60)} min`
  return d.toLocaleTimeString('es', { hour: '2-digit', minute: '2-digit' })
}

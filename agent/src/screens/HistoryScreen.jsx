import { useState } from 'react'

const MOCK_HISTORY = [
  { id: 1, type: 'print', documentName: 'Factura_2024_001.pdf', pcName: 'PC-A1B2', time: new Date(Date.now() - 120000), status: 'completado' },
  { id: 2, type: 'scan', documentName: 'Documento_ID_frontal.jpg', pcName: 'PC-A1B2', time: new Date(Date.now() - 300000), status: 'completado' },
  { id: 3, type: 'print', documentName: 'Reporte_Mensual_Q4.xlsx', pcName: 'PC-C3D4', time: new Date(Date.now() - 600000), status: 'completado' },
  { id: 4, type: 'print', documentName: 'Contrato_Servicio.docx', pcName: 'PC-A1B2', time: new Date(Date.now() - 900000), status: 'fallido' },
  { id: 5, type: 'scan', documentName: 'Recibo_Pago_1234.pdf', pcName: 'PC-E5F6', time: new Date(Date.now() - 1200000), status: 'completado' },
  { id: 6, type: 'print', documentName: 'Guia_Embarque_7890.pdf', pcName: 'PC-A1B2', time: new Date(Date.now() - 1800000), status: 'completado' },
  { id: 7, type: 'scan', documentName: 'Certificado_Graduacion.pdf', pcName: 'PC-C3D4', time: new Date(Date.now() - 2400000), status: 'completado' },
  { id: 8, type: 'print', documentName: 'Inventario_Diciembre.csv', pcName: 'PC-A1B2', time: new Date(Date.now() - 3600000), status: 'completado' },
]

export default function HistoryScreen() {
  const [activeTab, setActiveTab] = useState('print')
  const [search, setSearch] = useState('')

  const filtered = MOCK_HISTORY.filter(e => {
    const matchType = activeTab === 'print' ? e.type === 'print' : e.type === 'scan'
    const matchSearch = e.documentName.toLowerCase().includes(search.toLowerCase()) ||
      e.pcName.toLowerCase().includes(search.toLowerCase())
    return matchType && matchSearch
  })

  const printCount = MOCK_HISTORY.filter(e => e.type === 'print').length
  const scanCount = MOCK_HISTORY.filter(e => e.type === 'scan').length

  return (
    <div style={{
      height: '100%',
      display: 'flex',
      flexDirection: 'column',
      animation: 'fadeIn 0.4s ease',
    }}>
      <div style={{
        padding: '20px 24px 12px',
        display: 'flex',
        gap: 16,
        alignItems: 'center',
      }}>
        <div style={{
          display: 'flex',
          gap: 8,
          flexShrink: 0,
        }}>
          <button
            onClick={() => setActiveTab('print')}
            style={{
              padding: '8px 16px',
              borderRadius: 10,
              fontSize: 13,
              fontWeight: 600,
              background: activeTab === 'print' ? 'rgba(37, 99, 235, 0.15)' : 'rgba(255,255,255,0.05)',
              color: activeTab === 'print' ? '#3B82F6' : '#64748B',
              border: activeTab === 'print' ? '1px solid rgba(37,99,235,0.3)' : '1px solid rgba(255,255,255,0.06)',
              cursor: 'pointer',
              transition: 'all 0.2s ease',
              fontFamily: 'inherit',
            }}
          >
            Impresiones ({printCount})
          </button>
          <button
            onClick={() => setActiveTab('scan')}
            style={{
              padding: '8px 16px',
              borderRadius: 10,
              fontSize: 13,
              fontWeight: 600,
              background: activeTab === 'scan' ? 'rgba(16, 185, 129, 0.15)' : 'rgba(255,255,255,0.05)',
              color: activeTab === 'scan' ? '#10B981' : '#64748B',
              border: activeTab === 'scan' ? '1px solid rgba(16,185,129,0.3)' : '1px solid rgba(255,255,255,0.06)',
              cursor: 'pointer',
              transition: 'all 0.2s ease',
              fontFamily: 'inherit',
            }}
          >
            Escaneos ({scanCount})
          </button>
        </div>

        <input
          type="text"
          className="input-field"
          placeholder="Buscar documento..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          style={{
            flex: 1,
            padding: '8px 14px',
            fontSize: 13,
          }}
        />
      </div>

      <div style={{
        padding: '0 24px 12px',
        display: 'flex',
        gap: 12,
      }}>
        {[
          { label: 'Total', value: filtered.length, color: '#F1F5F9' },
          { label: 'Completados', value: filtered.filter(e => e.status === 'completado').length, color: '#10B981' },
          { label: 'Fallidos', value: filtered.filter(e => e.status === 'fallido').length, color: '#EF4444' },
        ].map(stat => (
          <div key={stat.label} style={{
            padding: '10px 14px',
            borderRadius: 10,
            background: 'rgba(17, 24, 39, 0.4)',
            border: '1px solid rgba(255,255,255,0.05)',
            flex: 1,
          }}>
            <div style={{ fontSize: 20, fontWeight: 700, color: stat.color }}>
              {stat.value}
            </div>
            <div style={{ fontSize: 11, color: '#64748B', marginTop: 2 }}>
              {stat.label}
            </div>
          </div>
        ))}
      </div>

      <div style={{
        flex: 1,
        overflow: 'auto',
        padding: '0 24px 24px',
      }}>
        {filtered.length === 0 ? (
          <div style={{
            textAlign: 'center',
            padding: '40px 0',
            color: '#64748B',
            fontSize: 14,
          }}>
            No se encontraron resultados
          </div>
        ) : (
          filtered.map((event, i) => (
            <div
              key={event.id}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 14,
                padding: '12px 14px',
                borderRadius: 12,
                background: 'rgba(17, 24, 39, 0.4)',
                border: '1px solid rgba(255,255,255,0.05)',
                marginBottom: 6,
                animation: `fadeInUp 0.3s ease ${i * 0.03}s both`,
              }}
            >
              <div style={{
                width: 36,
                height: 36,
                borderRadius: 8,
                background: event.type === 'print' ? 'rgba(37, 99, 235, 0.15)' : 'rgba(16, 185, 129, 0.15)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                flexShrink: 0,
                fontSize: 14,
              }}>
                {event.type === 'print' ? '🖨' : '📷'}
              </div>

              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{
                  fontSize: 13,
                  fontWeight: 500,
                  color: '#F1F5F9',
                  whiteSpace: 'nowrap',
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                }}>
                  {event.documentName}
                </div>
                <div style={{ fontSize: 11, color: '#64748B', marginTop: 2 }}>
                  {event.pcName} · {formatTime(event.time)}
                </div>
              </div>

              <div style={{
                padding: '3px 10px',
                borderRadius: 6,
                fontSize: 11,
                fontWeight: 600,
                background: event.status === 'completado' ? 'rgba(16,185,129,0.15)' : 'rgba(239,68,68,0.15)',
                color: event.status === 'completado' ? '#10B981' : '#EF4444',
                flexShrink: 0,
              }}>
                {event.status === 'completado' ? 'OK' : 'Error'}
              </div>

              <button
                style={{
                  width: 32,
                  height: 32,
                  borderRadius: 8,
                  background: 'rgba(255,255,255,0.05)',
                  border: '1px solid rgba(255,255,255,0.08)',
                  color: '#94A3B8',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  transition: 'all 0.2s ease',
                  flexShrink: 0,
                  fontSize: 14,
                }}
                title="Descargar"
              >
                ↓
              </button>
            </div>
          ))
        )}
      </div>
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
  if (diff < 86400) return `hace ${Math.floor(diff / 3600)}h`
  return d.toLocaleDateString('es', { day: '2-digit', month: 'short' })
}

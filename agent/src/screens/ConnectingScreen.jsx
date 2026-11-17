import { useEffect, useState, useRef } from 'react'
import { invoke } from '@tauri-apps/api/core'
import { apiBase, normalizeCode } from '../config'

export default function ConnectingScreen({ serverUrl, pairingCode, onPaired, onError }) {
  const [status, setStatus] = useState('Conectando al servidor...')
  const [phase, setPhase] = useState(0)
  const [errorMsg, setErrorMsg] = useState(null)
  const mountedRef = useRef(true)
  const base = apiBase(serverUrl)

  useEffect(() => {
    mountedRef.current = true

    const connect = async () => {
      try {
        setErrorMsg(null)
        setPhase(1)
        await new Promise(r => setTimeout(r, 800))
        if (!mountedRef.current) return
        setStatus('Validando codigo de emparejamiento...')

        await new Promise(r => setTimeout(r, 600))
        if (!mountedRef.current) return
        setPhase(2)
        setStatus('Obteniendo info del sistema...')

        // Normalizar código: quitar guiones para el servidor
        const cleanCode = normalizeCode(pairingCode)

        let sysInfo
        try {
          sysInfo = await invoke('get_system_info')
        } catch {
          sysInfo = null
        }
        if (!sysInfo) {
          setStatus('No se pudo obtener la informacion del sistema')
          setErrorMsg('No se pudo leer la informacion del sistema. Cierra y vuelve a abrir el agente.')
          return
        }

        if (!mountedRef.current) return
        setStatus('Registrando PC y obteniendo perfil...')

        let result = null
        let userInfo = null
        try {
          const resp = await fetch(`${base}/api/pc/report-system`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              code: cleanCode,
              pc_name: sysInfo.computer_name,
              ip: sysInfo.local_ip,
              mac: sysInfo.mac_address,
              sistema: sysInfo.os_version,
            }),
          })
          if (resp.ok) {
            result = await resp.json()
            userInfo = result?.user || null
          } else {
            throw new Error('codigo_invalido')
          }
        } catch {
          // report-system fallo (codigo invalido o red caida): no emparejar
        }

        if (!mountedRef.current) return

        if (!result) {
          setStatus('Codigo de emparejamiento invalido')
          setErrorMsg('El codigo de emparejamiento no es valido o el servidor no responde.')
          return
        }

        setPhase(3)
        setStatus('Emparejamiento exitoso!')
        await new Promise(r => setTimeout(r, 800))
        if (!mountedRef.current) return

        try {
          await invoke('save_state', {
            serverUrl: base,
            pairingCode,
            pcName: sysInfo.computer_name,
          })
        } catch {}

        try {
          await invoke('install_startup_script', {
            serverUrl: base,
            pairingCode,
            pcName: sysInfo.computer_name,
          }).catch(() => {})
        } catch {}

        onPaired({
          pcName: sysInfo.computer_name,
          ip: sysInfo.local_ip,
          mac: sysInfo.mac_address,
          so: sysInfo.os_version,
          pairingCode,
          serverUrl: base,
          status: 'Conectada',
          userInfo,
        })
      } catch {
        if (!mountedRef.current) return
        setErrorMsg('Ocurrio un error inesperado durante el emparejamiento.')
      }
    }

    connect()

    return () => {
      mountedRef.current = false
    }
  }, [base, pairingCode, onPaired, onError])

  return (
    <div className="screen">
      <div style={{
        flex: 1,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
      }}>
        <div style={{
          position: 'relative',
          width: 160,
          height: 160,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
        }}>
          {[0, 1, 2].map(i => (
            <div key={i} style={{
              position: 'absolute',
              width: 160,
              height: 160,
              borderRadius: '50%',
              border: `2px solid rgba(37, 99, 235, ${0.3 - i * 0.08})`,
              animation: `ripple 2s ease-out infinite ${i * 0.6}s`,
            }} />
          ))}
          <div style={{
            width: 80,
            height: 80,
            borderRadius: '50%',
            background: 'linear-gradient(135deg, #2563EB, #3B82F6)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: 20,
            fontWeight: 800,
            color: 'white',
            zIndex: 2,
            boxShadow: '0 0 30px rgba(37, 99, 235, 0.5)',
          }}>
            PC
          </div>
        </div>
      </div>

      <div style={{
        flex: 1,
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'flex-start',
        justifyContent: 'center',
        padding: '40px 48px',
      }}>
        <h2 style={{
          fontSize: 28,
          fontWeight: 700,
          color: '#F1F5F9',
          marginBottom: 12,
          letterSpacing: -0.5,
          animation: 'fadeIn 0.6s ease',
        }}>
          {errorMsg ? 'Emparejamiento fallido' : 'Emparejando...'}
        </h2>

        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: 8,
          marginBottom: 24,
          animation: 'fadeIn 0.6s ease 0.2s both',
        }}>
          <span style={{ color: errorMsg ? '#F87171' : '#94A3B8', fontSize: 15 }}>{errorMsg || status}</span>
          {!errorMsg && phase < 3 && (
            <div className="loading-dots" style={{ display: 'inline-flex', marginLeft: 4 }}>
              <span />
              <span />
              <span />
            </div>
          )}
        </div>

        {errorMsg ? (
          <button className="splash-pair-btn" onClick={onError} style={{ maxWidth: 220 }}>
            Volver
          </button>
        ) : (
        <div style={{
          display: 'flex',
          flexDirection: 'column',
          gap: 12,
          animation: 'fadeIn 0.6s ease 0.4s both',
        }}>
          {['Conectando al servidor', 'Validando codigo', 'Obteniendo perfil'].map((label, i) => (
            <div key={i} style={{
              display: 'flex',
              alignItems: 'center',
              gap: 12,
            }}>
              <div style={{
                width: 24,
                height: 24,
                borderRadius: '50%',
                background: phase > i ? '#10B981' : phase === i ? '#2563EB' : 'rgba(255,255,255,0.05)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: 12,
                color: 'white',
                transition: 'all 0.3s ease',
                border: phase <= i ? '1px solid rgba(255,255,255,0.1)' : 'none',
              }}>
                {phase > i ? '✓' : i + 1}
              </div>
              <span style={{
                fontSize: 14,
                color: phase > i ? '#10B981' : phase === i ? '#F1F5F9' : '#64748B',
                transition: 'color 0.3s ease',
              }}>
                {label}
              </span>
            </div>
          ))}
        </div>
        )}
      </div>
    </div>
  )
}

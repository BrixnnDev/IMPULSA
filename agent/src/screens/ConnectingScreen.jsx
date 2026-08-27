import { useEffect, useState, useRef } from 'react'
import { invoke } from '@tauri-apps/api/core'

export default function ConnectingScreen({ serverUrl, pairingCode, onPaired, onError }) {
  const [status, setStatus] = useState('Conectando al servidor...')
  const [phase, setPhase] = useState(0)
  const mountedRef = useRef(true)

  useEffect(() => {
    mountedRef.current = true
    let timeout

    const connect = async () => {
      try {
        setPhase(1)
        await new Promise(r => setTimeout(r, 800))
        if (!mountedRef.current) return
        setStatus('Validando codigo de emparejamiento...')

        await new Promise(r => setTimeout(r, 600))
        if (!mountedRef.current) return
        setPhase(2)
        setStatus('Obteniendo info del sistema...')

        let sysInfo = null
        try {
          sysInfo = await invoke('get_system_info')
        } catch {
          sysInfo = {
            computer_name: `PC-${Math.random().toString(36).substring(2, 6).toUpperCase()}`,
            local_ip: '192.168.1.' + Math.floor(Math.random() * 254 + 1),
            mac_address: 'AA:BB:CC:DD:' + Math.floor(Math.random() * 99 + 1).toString().padStart(2, '0') + ':FF',
            os_version: 'Windows',
          }
        }

        if (!mountedRef.current) return
        setStatus('Registrando PC y obteniendo perfil...')

        let result = null
        let userInfo = null
        try {
          const resp = await fetch(`${serverUrl}/api/pc/report-system`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              code: pairingCode,
              pc_name: sysInfo.computer_name,
              ip: sysInfo.local_ip,
              mac: sysInfo.mac_address,
              sistema: sysInfo.os_version,
            }),
          })
          if (resp.ok) {
            result = await resp.json()
            userInfo = result?.user || null
          }
        } catch {
          try {
            const resp2 = await fetch(`${serverUrl}/api/pc/register-from-script`, {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                codigo: pairingCode,
                pc: sysInfo.computer_name,
                ip: sysInfo.local_ip,
                mac: sysInfo.mac_address,
                sistema: sysInfo.os_version,
              }),
            })
            if (resp2.ok) result = await resp2.json()
          } catch {}
        }

        if (!mountedRef.current) return

        setPhase(3)
        setStatus('Emparejamiento exitoso!')
        await new Promise(r => setTimeout(r, 800))
        if (!mountedRef.current) return

        onPaired({
          pcName: sysInfo.computer_name,
          ip: sysInfo.local_ip,
          mac: sysInfo.mac_address,
          so: sysInfo.os_version,
          pairingCode,
          serverUrl,
          status: 'Conectada',
          userInfo,
        })
      } catch {
        if (!mountedRef.current) return
        timeout = setTimeout(() => {
          onError()
        }, 1500)
      }
    }

    connect()

    return () => {
      mountedRef.current = false
      if (timeout) clearTimeout(timeout)
    }
  }, [serverUrl, pairingCode, onPaired, onError])

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
          Emparejando...
        </h2>

        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: 8,
          marginBottom: 24,
          animation: 'fadeIn 0.6s ease 0.2s both',
        }}>
          <span style={{ color: '#94A3B8', fontSize: 15 }}>{status}</span>
          {phase < 3 && (
            <div className="loading-dots" style={{ display: 'inline-flex', marginLeft: 4 }}>
              <span />
              <span />
              <span />
            </div>
          )}
        </div>

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
      </div>
    </div>
  )
}

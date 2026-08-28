import { useState, useEffect, useCallback } from 'react'
import './App.css'
import SplashScreen from './screens/SplashScreen'
import ConnectingScreen from './screens/ConnectingScreen'
import ConnectedScreen from './screens/ConnectedScreen'
import TitleBar from './components/TitleBar'
import { invoke } from '@tauri-apps/api/core'

function App() {
  const [currentScreen, setCurrentScreen] = useState('splash')
  const [serverUrl, setServerUrl] = useState('http://localhost:8787')
  const [pairingCode, setPairingCode] = useState('')
  const [pcInfo, setPcInfo] = useState(null)
  const [autoState, setAutoState] = useState('idle')

  useEffect(() => {
    let cancelled = false
    async function checkSavedSession() {
      try {
        const saved = await invoke('load_state')
        if (!saved || cancelled) {
          setAutoState('none')
          return
        }
        setServerUrl(saved.server_url || 'http://localhost:8787')
        setPairingCode(saved.pairing_code)
        setAutoState('checking')
        const resp = await fetch(`${saved.server_url || 'http://localhost:8787'}/api/pc/detail?code=${encodeURIComponent(saved.pairing_code)}`)
        if (!resp.ok) {
          await invoke('clear_state').catch(() => {})
          if (!cancelled) setAutoState('none')
          return
        }
        const data = await resp.json()
        if (!cancelled) {
          setPcInfo({
            pcName: saved.pc_name || data?.pc?.etiqueta || 'PC',
            ip: data?.pc?.ip,
            mac: data?.pc?.mac,
            so: data?.pc?.sistema,
            pairingCode: saved.pairing_code,
            serverUrl: saved.server_url || 'http://localhost:8787',
            status: 'Conectada',
            userInfo: data?.pc?.responsable ? { name: data.pc.responsable, email: data.pc.email, role: data.pc.rol } : null,
          })
          setCurrentScreen('connected')
          setAutoState('done')
          setTimeout(() => invoke('hide_to_tray').catch(() => {}), 1200)
        }
      } catch {
        if (!cancelled) setAutoState('none')
      }
    }
    checkSavedSession()
    return () => { cancelled = true }
  }, [])

  const handleSplashComplete = useCallback((url, code) => {
    setServerUrl(url)
    setPairingCode(code)
    setCurrentScreen('connecting')
  }, [])

  const handlePaired = useCallback((info) => {
    setPcInfo(info)
    setCurrentScreen('connected')
  }, [])

  const handleDisconnect = useCallback(() => {
    setCurrentScreen('splash')
  }, [])

  const renderScreen = () => {
    switch (currentScreen) {
      case 'splash':
        return <SplashScreen autoState={autoState} onComplete={handleSplashComplete} />
      case 'connecting':
        return (
          <ConnectingScreen
            serverUrl={serverUrl}
            pairingCode={pairingCode}
            onPaired={handlePaired}
            onError={() => setCurrentScreen('splash')}
          />
        )
      case 'connected':
        return (
          <ConnectedScreen
            pcInfo={pcInfo}
            serverUrl={serverUrl}
            onDisconnect={handleDisconnect}
          />
        )
      default:
        return <SplashScreen autoState={autoState} onComplete={handleSplashComplete} />
    }
  }

  return (
    <div className="app">
      <TitleBar />
      {renderScreen()}
    </div>
  )
}

export default App

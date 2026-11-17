import { useState, useCallback } from 'react'
import './App.css'
import SplashScreen from './screens/SplashScreen'
import ConnectingScreen from './screens/ConnectingScreen'
import ConnectedScreen from './screens/ConnectedScreen'
import TitleBar from './components/TitleBar'
import { invoke } from '@tauri-apps/api/core'
import { DEFAULT_SERVER_URL } from './config'

function App() {
  const [currentScreen, setCurrentScreen] = useState('splash')
  const [serverUrl, setServerUrl] = useState(DEFAULT_SERVER_URL)
  const [pairingCode, setPairingCode] = useState('')
  const [pcInfo, setPcInfo] = useState(null)

  const handleSplashComplete = useCallback((url, code) => {
    setServerUrl(url)
    setPairingCode(code)
    setCurrentScreen('connecting')
  }, [])

  const handleAutoPaired = useCallback((info) => {
    setServerUrl(info.serverUrl)
    setPairingCode(info.pairingCode)
    setPcInfo(info)
    setCurrentScreen('connected')
    setTimeout(() => invoke('hide_to_tray').catch(() => {}), 1200)
  }, [])

  const handlePaired = useCallback((info) => {
    setServerUrl(info.serverUrl)
    setPairingCode(info.pairingCode)
    setPcInfo(info)
    setCurrentScreen('connected')
  }, [])

  const handleRemoved = useCallback(() => {
    setPcInfo(null)
    setPairingCode('')
    setCurrentScreen('splash')
  }, [])

  const handleDisconnect = useCallback(async () => {
    await invoke('clear_state').catch(() => {})
    await invoke('remove_startup_script').catch(() => {})
    setPcInfo(null)
    setPairingCode('')
    setCurrentScreen('splash')
  }, [])

  const renderScreen = () => {
    switch (currentScreen) {
      case 'splash':
        return <SplashScreen onComplete={handleSplashComplete} onAutoPaired={handleAutoPaired} />
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
            onRemoved={handleRemoved}
          />
        )
      default:
        return <SplashScreen onComplete={handleSplashComplete} onAutoPaired={handleAutoPaired} />
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

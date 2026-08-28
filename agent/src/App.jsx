import { useState, useCallback } from 'react'
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

  const handleDisconnect = useCallback(() => {
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

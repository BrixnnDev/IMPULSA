import { useState, useCallback } from 'react'
import './App.css'
import SplashScreen from './screens/SplashScreen'
import ConnectingScreen from './screens/ConnectingScreen'
import ConnectedScreen from './screens/ConnectedScreen'
import TitleBar from './components/TitleBar'

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

  const handlePaired = useCallback((info) => {
    setPcInfo(info)
    setCurrentScreen('connected')
  }, [])

  const handleDisconnect = useCallback(() => {
    setPcInfo(null)
    setPairingCode('')
    setCurrentScreen('splash')
  }, [])

  const renderScreen = () => {
    switch (currentScreen) {
      case 'splash':
        return <SplashScreen onComplete={handleSplashComplete} />
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
        return <SplashScreen onComplete={handleSplashComplete} />
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

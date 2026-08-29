import { invoke } from '@tauri-apps/api/core'

export default function TitleBar() {
  const handleMinimize = async () => {
    try {
      await invoke('hide_to_tray')
    } catch {
      try {
        const { getCurrentWindow } = await import('@tauri-apps/api/window')
        await getCurrentWindow().hide()
      } catch {}
    }
  }

  return (
    <div className="titlebar" data-tauri-drag-region>
      <div className="titlebar-left" data-tauri-drag-region>
        <div className="titlebar-logo">IM</div>
        <span className="titlebar-text" data-tauri-drag-region>IMPULSA</span>
      </div>
      <div className="titlebar-right">
        <button className="titlebar-btn titlebar-minimize" onClick={handleMinimize} title="Minimizar a bandeja">
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
            <line x1="5" y1="12" x2="19" y2="12" />
          </svg>
        </button>
      </div>
    </div>
  )
}

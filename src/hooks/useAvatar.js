import { useEffect, useState } from 'react'

const KEY = 'sf_avatar'
const EVT = 'sf-avatar'

export function setAvatar(dataUrl) {
  if (dataUrl) localStorage.setItem(KEY, dataUrl)
  else localStorage.removeItem(KEY)
  window.dispatchEvent(new Event(EVT))
}

export default function useAvatar() {
  const [avatar, setAv] = useState(() => localStorage.getItem(KEY))

  useEffect(() => {
    const handler = () => setAv(localStorage.getItem(KEY))
    window.addEventListener(EVT, handler)
    return () => window.removeEventListener(EVT, handler)
  }, [])

  return [avatar, setAvatar]
}

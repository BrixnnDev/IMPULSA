import { useEffect, useState } from 'react'

const KEY = 'sf_avatar'
const EVT = 'sf-avatar'

// La foto se guarda por usuario para no mezclar cuentas en el mismo equipo.
const keyFor = (userId) => (userId ? `${KEY}_${userId}` : KEY)

export function setAvatar(dataUrl, userId) {
  const k = keyFor(userId)
  if (dataUrl) localStorage.setItem(k, dataUrl)
  else localStorage.removeItem(k)
  // Limpia la clave antigua global (compartida entre cuentas).
  if (userId) localStorage.removeItem(KEY)
  window.dispatchEvent(new Event(EVT))
}

export function getAvatar(userId) {
  return localStorage.getItem(keyFor(userId)) || null
}

// Reclama una foto guardada con la clave antigua (global) para la cuenta actual.
export function claimLegacyAvatar(userId) {
  if (!userId) return null
  const legacy = localStorage.getItem(KEY)
  if (legacy && !localStorage.getItem(keyFor(userId))) {
    localStorage.setItem(keyFor(userId), legacy)
    localStorage.removeItem(KEY)
    return legacy
  }
  return null
}

export default function useAvatar(userId) {
  const [avatar, setAv] = useState(() => getAvatar(userId))

  useEffect(() => {
    const handler = () => setAv(getAvatar(userId))
    setAv(getAvatar(userId))
    window.addEventListener(EVT, handler)
    return () => window.removeEventListener(EVT, handler)
  }, [userId])

  return [avatar, (v) => setAvatar(v, userId)]
}

import { createContext, useContext, useEffect, useState } from 'react'

const AuthContext = createContext(null)

const SESSION_KEY = 'sf_session'
const PROFILE_KEY = 'sf_profile'
const API = import.meta.env.VITE_API_URL || 'http://localhost:8787'

const read = (key, fallback) => {
  try {
    return JSON.parse(localStorage.getItem(key)) ?? fallback
  } catch {
    return fallback
  }
}

export function AuthProvider({ children }) {
  const [user, setUser] = useState(() => read(SESSION_KEY, null))
  const [profile, setProfile] = useState(() => localStorage.getItem(PROFILE_KEY) || null)

  useEffect(() => {
    if (user) localStorage.setItem(SESSION_KEY, JSON.stringify(user))
    else localStorage.removeItem(SESSION_KEY)
  }, [user])

  useEffect(() => {
    if (profile) localStorage.setItem(PROFILE_KEY, profile)
    else localStorage.removeItem(PROFILE_KEY)
  }, [profile])

  const register = async ({ name, email, password }) => {
    try {
      const res = await fetch(`${API}/api/users/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, email, password }),
      })
      const data = await res.json()
      if (!res.ok) return { ok: false, error: data.error || 'Error al registrar.' }
      setUser(data.user)
      setProfile(null)
      return { ok: true, requiereVerificacion: !data.user.verificado }
    } catch {
      return { ok: false, error: 'Sin conexión con el servidor.' }
    }
  }

  const login = async ({ email, password }) => {
    try {
      const res = await fetch(`${API}/api/users/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      })
      const data = await res.json()
      if (!res.ok) return { ok: false, error: data.error || 'Error al iniciar sesión.' }
      setUser(data.user)
      setProfile(null)
      return { ok: true, requiereVerificacion: data.requiereVerificacion }
    } catch {
      return { ok: false, error: 'Sin conexión con el servidor.' }
    }
  }

  const verificar = async ({ email, codigo }) => {
    try {
      const res = await fetch(`${API}/api/users/verify`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, codigo }),
      })
      const data = await res.json()
      if (!res.ok) return { ok: false, error: data.error || 'Código incorrecto.' }
      setUser(data.user)
      return { ok: true }
    } catch {
      return { ok: false, error: 'Sin conexión con el servidor.' }
    }
  }

  const resetPassword = async ({ email, password }) => {
    try {
      const res = await fetch(`${API}/api/users/reset`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      })
      const data = await res.json()
      if (!res.ok) return { ok: false, error: data.error || 'Error.' }
      return { ok: true }
    } catch {
      return { ok: false, error: 'Sin conexión con el servidor.' }
    }
  }

  const updateProfile = async ({ name, telefono }) => {
    try {
      const res = await fetch(`${API}/api/users/${user.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, telefono }),
      })
      const data = await res.json()
      if (!res.ok) return { ok: false, error: data.error || 'Error.' }
      setUser(data.user)
      return { ok: true }
    } catch {
      return { ok: false, error: 'Sin conexión con el servidor.' }
    }
  }

  const logout = () => {
    setUser(null)
    setProfile(null)
  }

  const isAdmin = user?.rol === 'admin'

  return (
    <AuthContext.Provider
      value={{
        user,
        profile,
        setProfile,
        register,
        login,
        verificar,
        resetPassword,
        updateProfile,
        logout,
        isAdmin,
        requiereVerificacion: !!user && !user.verificado,
      }}
    >
      {children}
    </AuthContext.Provider>
  )
}

export const useAuth = () => useContext(AuthContext)

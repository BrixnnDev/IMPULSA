import { createContext, useContext, useEffect, useState } from 'react'

const AuthContext = createContext(null)

const USERS_KEY = 'sf_users'
const SESSION_KEY = 'sf_session'
const PROFILE_KEY = 'sf_profile'

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

  const register = ({ name, email, password }) => {
    const users = read(USERS_KEY, [])
    if (users.some((u) => u.email.toLowerCase() === email.toLowerCase())) {
      return { ok: false, error: 'Este correo ya está registrado. Inicia sesión.' }
    }
    users.push({ name, email, password })
    localStorage.setItem(USERS_KEY, JSON.stringify(users))
    return { ok: true }
  }

  const login = ({ email, password }) => {
    const users = read(USERS_KEY, [])
    const found = users.find(
      (u) => u.email.toLowerCase() === email.toLowerCase() && u.password === password,
    )
    if (!found) return { ok: false, error: 'Correo o contraseña incorrectos.' }
    setUser({ name: found.name, email: found.email })
    setProfile(null)
    return { ok: true }
  }

  const resetPassword = ({ email, password }) => {
    const users = read(USERS_KEY, [])
    const idx = users.findIndex((u) => u.email.toLowerCase() === email.toLowerCase())
    if (idx === -1) return { ok: false, error: 'No existe una cuenta con ese correo.' }
    users[idx].password = password
    localStorage.setItem(USERS_KEY, JSON.stringify(users))
    return { ok: true }
  }

  const updateProfile = ({ name, telefono }) => {
    if (!user) return { ok: false, error: 'No hay sesión activa.' }
    const users = read(USERS_KEY, [])
    const idx = users.findIndex((u) => u.email.toLowerCase() === user.email.toLowerCase())
    if (idx !== -1) {
      users[idx].name = name
      if (telefono !== undefined) users[idx].telefono = telefono
      localStorage.setItem(USERS_KEY, JSON.stringify(users))
    }
    setUser({ ...user, name, ...(telefono !== undefined ? { telefono } : {}) })
    return { ok: true }
  }

  const logout = () => {
    setUser(null)
    setProfile(null)
  }

  return (
    <AuthContext.Provider
      value={{ user, profile, setProfile, register, login, resetPassword, updateProfile, logout }}
    >
      {children}
    </AuthContext.Provider>
  )
}

export const useAuth = () => useContext(AuthContext)

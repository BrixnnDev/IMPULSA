import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { FiMail, FiLock, FiUser, FiEye, FiEyeOff, FiArrowLeft, FiAlertCircle } from 'react-icons/fi'
import { useAuth } from '../context/AuthContext'

export default function Register() {
  const { register, login } = useAuth()
  const navigate = useNavigate()
  const [form, setForm] = useState({ name: '', email: '', password: '', confirm: '' })
  const [showPass, setShowPass] = useState(false)
  const [error, setError] = useState('')

  const handleChange = (e) => setForm({ ...form, [e.target.name]: e.target.value })

  const handleSubmit = (e) => {
    e.preventDefault()
    setError('')
    if (form.password.length < 6) {
      return setError('La contraseña debe tener al menos 6 caracteres.')
    }
    if (form.password !== form.confirm) {
      return setError('Las contraseñas no coinciden.')
    }
    const res = register({ name: form.name, email: form.email, password: form.password })
    if (!res.ok) return setError(res.error)

    login({ email: form.email, password: form.password })
    navigate('/seleccionar-perfil')
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-night-950 px-4 py-12">
      <div className="pointer-events-none fixed -top-32 left-1/2 h-[420px] w-[600px] -translate-x-1/2 rounded-full bg-blue-600/15 blur-[130px]" />

      <div className="relative w-full max-w-md">
        <Link
          to="/"
          className="mb-6 inline-flex items-center gap-2 text-sm text-slate-400 transition hover:text-blue-400"
        >
          <FiArrowLeft /> Volver al inicio
        </Link>

        <div className="panel glow-blue p-8">
          <div className="text-center">
            <span className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-blue-600 text-2xl font-black text-white">
              S
            </span>
            <h1 className="mt-5 text-2xl font-bold text-white">Crea tu cuenta</h1>
            <p className="mt-1 text-sm text-slate-400">
              Regístrate y elige entre Digitación o POS
            </p>
          </div>

          {error && (
            <div className="mt-6 flex items-center gap-2 rounded-xl border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-300">
              <FiAlertCircle className="shrink-0" /> {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="mt-7 space-y-5">
            <div>
              <label className="label-form" htmlFor="name">Nombre completo</label>
              <div className="relative">
                <FiUser className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-slate-500" />
                <input
                  id="name"
                  name="name"
                  type="text"
                  required
                  value={form.name}
                  onChange={handleChange}
                  placeholder="Tu nombre"
                  className="input-field !pl-11"
                />
              </div>
            </div>

            <div>
              <label className="label-form" htmlFor="email">Correo electrónico</label>
              <div className="relative">
                <FiMail className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-slate-500" />
                <input
                  id="email"
                  name="email"
                  type="email"
                  required
                  value={form.email}
                  onChange={handleChange}
                  placeholder="tucorreo@ejemplo.com"
                  className="input-field !pl-11"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
              <div>
                <label className="label-form" htmlFor="password">Contraseña</label>
                <div className="relative">
                  <FiLock className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-slate-500" />
                  <input
                    id="password"
                    name="password"
                    type={showPass ? 'text' : 'password'}
                    required
                    value={form.password}
                    onChange={handleChange}
                    placeholder="••••••••"
                    className="input-field !pl-11 !pr-11"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPass(!showPass)}
                    className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-500 transition hover:text-slate-300"
                    aria-label={showPass ? 'Ocultar contraseña' : 'Mostrar contraseña'}
                  >
                    {showPass ? <FiEyeOff /> : <FiEye />}
                  </button>
                </div>
              </div>
              <div>
                <label className="label-form" htmlFor="confirm">Confirmar</label>
                <div className="relative">
                  <FiLock className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-slate-500" />
                  <input
                    id="confirm"
                    name="confirm"
                    type={showPass ? 'text' : 'password'}
                    required
                    value={form.confirm}
                    onChange={handleChange}
                    placeholder="••••••••"
                    className="input-field !pl-11"
                  />
                </div>
              </div>
            </div>

            <button type="submit" className="btn-primary w-full py-3.5">
              Crear cuenta
            </button>
          </form>

          <p className="mt-6 text-center text-sm text-slate-400">
            ¿Ya tienes cuenta?{' '}
            <Link to="/login" className="font-semibold text-blue-400 hover:text-blue-300">
              Inicia sesión
            </Link>
          </p>
        </div>
      </div>
    </div>
  )
}

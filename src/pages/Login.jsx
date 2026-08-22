import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { FiMail, FiLock, FiEye, FiEyeOff, FiArrowLeft, FiAlertCircle } from 'react-icons/fi'
import { useAuth } from '../context/AuthContext'

export default function Login() {
  const { login } = useAuth()
  const navigate = useNavigate()
  const [form, setForm] = useState({ email: '', password: '' })
  const [showPass, setShowPass] = useState(false)
  const [error, setError] = useState('')

  const handleChange = (e) => setForm({ ...form, [e.target.name]: e.target.value })

  const handleSubmit = (e) => {
    e.preventDefault()
    setError('')
    const res = login(form)
    if (!res.ok) return setError(res.error)
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
            <h1 className="mt-5 text-2xl font-bold text-white">Bienvenido de vuelta</h1>
            <p className="mt-1 text-sm text-slate-400">
              Inicia sesión para elegir tu perfil y continuar
            </p>
          </div>

          {error && (
            <div className="mt-6 flex items-center gap-2 rounded-xl border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-300">
              <FiAlertCircle className="shrink-0" /> {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="mt-7 space-y-5">
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

            <div>
              <div className="flex items-center justify-between">
                <label className="label-form" htmlFor="password">Contraseña</label>
                <Link to="/olvide-contrasena" className="mb-1.5 text-xs font-medium text-blue-400 hover:text-blue-300">
                  ¿Olvidaste tu contraseña?
                </Link>
              </div>
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

            <button type="submit" className="btn-primary w-full py-3.5">
              Iniciar sesión
            </button>
          </form>

          <p className="mt-6 text-center text-sm text-slate-400">
            ¿No tienes cuenta?{' '}
            <Link to="/registro" className="font-semibold text-blue-400 hover:text-blue-300">
              Regístrate gratis
            </Link>
          </p>
        </div>
      </div>
    </div>
  )
}

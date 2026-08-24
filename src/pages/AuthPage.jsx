import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { FiMail, FiLock, FiUser, FiEye, FiEyeOff, FiArrowLeft, FiAlertCircle, FiZap, FiCheckCircle } from 'react-icons/fi'
import { useAuth } from '../context/AuthContext'
import DeviceMockup from '../components/DeviceMockup'

export default function AuthPage({ initialMode = 'login' }) {
  const { login, register } = useAuth()
  const navigate = useNavigate()
  const [mode, setMode] = useState(initialMode)
  const [form, setForm] = useState({ name: '', email: '', password: '', confirm: '' })
  const [showPass, setShowPass] = useState(false)
  const [error, setError] = useState('')

  const handleChange = (e) => setForm({ ...form, [e.target.name]: e.target.value })

  const switchMode = (m) => {
    setMode(m)
    setError('')
  }

  const handleSubmit = (e) => {
    e.preventDefault()
    setError('')
    if (mode === 'register') {
      if (form.password.length < 6) return setError('La contraseña debe tener al menos 6 caracteres.')
      if (form.password !== form.confirm) return setError('Las contraseñas no coinciden.')
      const res = register({ name: form.name, email: form.email, password: form.password })
      if (!res.ok) return setError(res.error)
      login({ email: form.email, password: form.password })
    } else {
      const res = login({ email: form.email, password: form.password })
      if (!res.ok) return setError(res.error)
    }
    navigate('/seleccionar-perfil')
  }

  const esRegistro = mode === 'register'

  return (
    <div className="relative flex min-h-screen flex-col justify-center overflow-hidden bg-night-950 px-4 py-20 text-slate-200 lg:h-screen lg:gap-0 lg:py-16">
      {/* Botón volver al inicio: esquina superior izquierda */}
      <Link
        to="/"
        className="absolute left-4 top-4 z-20 inline-flex items-center gap-2 rounded-xl border border-white/10 bg-white/5 px-4 py-2 text-sm font-medium text-slate-300 backdrop-blur transition hover:bg-white/10 hover:text-blue-400"
      >
        <FiArrowLeft /> Volver al inicio
      </Link>

      {/* Fondo: cuadrícula + triángulos + orbes */}
      <div className="bg-grid pointer-events-none absolute inset-0 opacity-70 [mask-image:radial-gradient(ellipse_75%_70%_at_50%_35%,black_25%,transparent_80%)]" />
      <div className="pointer-events-none absolute -top-32 left-1/3 h-[420px] w-[600px] rounded-full bg-blue-600/15 blur-[130px]" />
      <div className="pointer-events-none absolute -left-32 top-40 h-96 w-96 rounded-full bg-indigo-600/15 blur-[120px]" />
      <div className="pointer-events-none absolute -right-24 bottom-10 h-96 w-96 rounded-full bg-cyan-500/10 blur-[130px]" />
      <svg className="animate-float pointer-events-none absolute left-[4%] bottom-[12%] hidden h-12 w-12 text-blue-500/35 lg:block" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.4">
        <path d="M12 4 L21 20 L3 20 Z" strokeLinejoin="round" />
      </svg>
      <svg className="animate-float pointer-events-none absolute right-[5%] top-[12%] hidden h-9 w-9 text-cyan-400/30 lg:block [animation-delay:2.6s]" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.4">
        <path d="M12 4 L21 20 L3 20 Z" strokeLinejoin="round" />
      </svg>
      <span className="animate-float-alt pointer-events-none absolute left-[42%] top-14 hidden h-8 w-8 rotate-12 rounded-lg border border-blue-500/40 bg-blue-500/5 lg:block [animation-delay:1s]" />

      <div className="relative mx-auto grid w-full max-w-6xl flex-1 grid-cols-1 items-center gap-10 lg:grid-cols-2 lg:gap-14">
        {/* Contenedor izquierdo: marca + PC + celular */}
        <div className="order-2 lg:order-1">
          {/* Nombre de la página centrado */}
          <div className="mb-5 flex flex-col items-center gap-2 text-center lg:mb-6">
            <span className="flex h-12 w-12 items-center justify-center rounded-2xl bg-blue-600 text-xl font-black text-white shadow-lg shadow-blue-600/30">
              S
            </span>
            <div>
              <p className="text-xl font-black tracking-tight text-white">StockFlow</p>
              <p className="mt-0.5 flex items-center justify-center gap-1.5 text-[11px] font-semibold uppercase tracking-[0.2em] text-blue-300">
                <FiZap size={11} /> Inventario · POS · Digitación
              </p>
            </div>
          </div>

          <DeviceMockup />
        </div>

        {/* Contenedor derecho: formulario */}
        <div className="order-1 lg:order-2">
          <div className="rounded-2xl border border-white/10 bg-night-900/40 p-6 backdrop-blur sm:p-7">
            <h1 className="text-xl font-bold text-white sm:text-2xl">
              {esRegistro ? 'Crea tu cuenta' : 'Bienvenido de vuelta'}
            </h1>
            <p className="mt-0.5 text-sm text-slate-400">
              {esRegistro
                ? 'Regístrate y elige entre Digitación o POS'
                : 'Inicia sesión para elegir tu perfil y continuar'}
            </p>

            {error && (
              <div className="mt-4 flex items-center gap-2 rounded-xl border border-red-500/30 bg-red-500/10 px-4 py-2.5 text-sm text-red-300 animate-field">
                <FiAlertCircle className="shrink-0" /> {error}
              </div>
            )}

            <form onSubmit={handleSubmit} className={error ? 'mt-4 space-y-4' : 'mt-5 space-y-4'}>
                {/* Campo Nombre (solo registro, animado) */}
                {esRegistro && (
                  <div key="name" className="animate-field">
                    <label className="label-form" htmlFor="name">Nombre completo</label>
                    <div className="relative">
                      <FiUser className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-slate-500" />
                      <input
                        id="name"
                        name="name"
                        type="text"
                        required={esRegistro}
                        value={form.name}
                        onChange={handleChange}
                        placeholder="Tu nombre"
                        className="input-field !pl-11"
                        style={{ animationDelay: '0.05s' }}
                      />
                    </div>
                  </div>
                )}

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
                    {!esRegistro && (
                      <Link to="/olvide-contrasena" className="mb-1.5 text-xs font-medium text-blue-400 hover:text-blue-300">
                        ¿Olvidaste tu contraseña?
                      </Link>
                    )}
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

                {/* Campo Confirmar (solo registro, animado) */}
                {esRegistro && (
                  <div key="confirm" className="animate-field">
                    <label className="label-form" htmlFor="confirm">Confirmar contraseña</label>
                    <div className="relative">
                      <FiLock className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-slate-500" />
                      <input
                        id="confirm"
                        name="confirm"
                        type={showPass ? 'text' : 'password'}
                        required={esRegistro}
                        value={form.confirm}
                        onChange={handleChange}
                        placeholder="••••••••"
                        className="input-field !pl-11"
                        style={{ animationDelay: '0.15s' }}
                      />
                    </div>
                  </div>
                )}

                <button type="submit" className="btn-primary !mt-6 w-full py-3">
                  {esRegistro ? 'Crear cuenta' : 'Iniciar sesión'}
                </button>
            </form>

            <p className="mt-4 text-center text-sm text-slate-400">
              {esRegistro ? '¿Ya tienes cuenta?' : '¿No tienes cuenta?'}{' '}
              <button
                type="button"
                onClick={() => switchMode(esRegistro ? 'login' : 'register')}
                className="font-semibold text-blue-400 hover:text-blue-300 underline underline-offset-2"
              >
                {esRegistro ? 'Inicia sesión' : 'Regístrate gratis'}
              </button>
            </p>

            {/* Beneficios compactos dentro del panel */}
            <ul className="mt-4 flex flex-wrap items-center justify-center gap-x-5 gap-y-1.5 border-t border-white/5 pt-4">
              {(esRegistro
                ? ['Gratis para empezar', 'Sin tarjeta', 'En minutos']
                : ['Fácil e intuitivo', 'Celular y PC', 'Tiempo real']
              ).map((t) => (
                <li key={t} className="flex items-center gap-1.5 text-xs text-slate-400">
                  <FiCheckCircle className="text-cyan-400" size={12} /> {t}
                </li>
              ))}
            </ul>
          </div>
        </div>
      </div>
    </div>
  )
}

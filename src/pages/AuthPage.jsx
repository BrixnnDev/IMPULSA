import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { FiMail, FiLock, FiUser, FiEye, FiEyeOff, FiArrowLeft, FiAlertCircle, FiZap, FiCheckCircle, FiShield, FiKey } from 'react-icons/fi'
import { useAuth } from '../context/AuthContext'
import DeviceMockup from '../components/DeviceMockup'

export default function AuthPage({ initialMode = 'login' }) {
  const { login, register, verificar, requiereVerificacion } = useAuth()
  const navigate = useNavigate()
  const [mode, setMode] = useState(initialMode)
  const [form, setForm] = useState({ name: '', email: '', password: '', confirm: '' })
  const [codigo, setCodigo] = useState('')
  const [showPass, setShowPass] = useState(false)
  const [error, setError] = useState('')

  const handleChange = (e) => setForm({ ...form, [e.target.name]: e.target.value })

  const switchMode = (m) => {
    setMode(m)
    setError('')
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')
    if (mode === 'register') {
      if (form.password.length < 6) return setError('La contraseña debe tener al menos 6 caracteres.')
      if (form.password !== form.confirm) return setError('Las contraseñas no coinciden.')
      const res = await register({ name: form.name, email: form.email, password: form.password })
      if (!res.ok) return setError(res.error)
      if (res.requiereVerificacion) {
        setMode('verificar')
        setCodigo('')
        return
      }
      navigate('/seleccionar-perfil')
    } else if (mode === 'login') {
      const res = await login({ email: form.email, password: form.password })
      if (!res.ok) return setError(res.error)
      if (res.requiereVerificacion) {
        setMode('verificar')
        setCodigo('')
        return
      }
      navigate('/seleccionar-perfil')
    } else {
      // verificar
      const res = await verificar({ email: form.email, codigo })
      if (!res.ok) return setError(res.error)
      navigate('/seleccionar-perfil')
    }
  }

  const esRegistro = mode === 'register'
  const esVerificacion = mode === 'verificar'

  return (
    <div className="relative flex min-h-screen flex-col justify-center overflow-hidden bg-night-950 px-4 py-20 text-slate-200 lg:h-screen lg:gap-0 lg:py-16">
      <Link
        to="/"
        className="absolute left-4 top-4 z-20 inline-flex items-center gap-2 rounded-xl border border-white/10 bg-white/5 px-4 py-2 text-sm font-medium text-slate-300 backdrop-blur transition hover:bg-white/10 hover:text-blue-400"
      >
        <FiArrowLeft /> Volver al inicio
      </Link>

      <div className="bg-grid pointer-events-none absolute inset-0 opacity-70 [mask-image:radial-gradient(ellipse_75%_70%_at_50%_35%,black_25%,transparent_80%)]" />
      <div className="pointer-events-none absolute -top-32 left-1/3 h-[420px] w-[600px] rounded-full bg-blue-600/15 blur-[130px]" />
      <div className="pointer-events-none absolute -left-32 top-40 h-96 w-96 rounded-full bg-indigo-600/15 blur-[120px]" />
      <div className="pointer-events-none absolute -right-24 bottom-10 h-96 w-96 rounded-full bg-cyan-500/10 blur-[130px]" />

      <div className="relative mx-auto grid w-full max-w-6xl flex-1 grid-cols-1 items-center gap-10 lg:grid-cols-2 lg:gap-14">
        {/* Izquierda */}
        <div className="order-2 lg:order-1">
          <div className="mb-5 flex flex-col items-center gap-2 text-center lg:mb-6">
            <span className="flex h-12 w-12 items-center justify-center rounded-2xl bg-blue-600 text-xl font-black text-white shadow-lg shadow-blue-600/30">S</span>
            <div>
              <p className="text-xl font-black tracking-tight text-white">StockFlow</p>
              <p className="mt-0.5 flex items-center justify-center gap-1.5 text-[11px] font-semibold uppercase tracking-[0.2em] text-blue-300">
                <FiZap size={11} /> Inventario · POS · Digitación
              </p>
            </div>
          </div>
          <DeviceMockup />
        </div>

        {/* Derecha */}
        <div className="order-1 lg:order-2">
          <div className="rounded-2xl border border-white/10 bg-night-900/40 p-6 backdrop-blur sm:p-7">
            {esVerificacion ? (
              <>
                <div className="flex items-center gap-3">
                  <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-amber-500/15 text-amber-400 ring-1 ring-amber-500/40"><FiShield size={22} /></span>
                  <div>
                    <h1 className="text-xl font-bold text-white">Verifica tu cuenta</h1>
                    <p className="mt-0.5 text-sm text-slate-400">Ingresa el código que te dio el administrador.</p>
                  </div>
                </div>

                {error && (
                  <div className="mt-4 flex items-center gap-2 rounded-xl border border-red-500/30 bg-red-500/10 px-4 py-2.5 text-sm text-red-300 animate-field">
                    <FiAlertCircle className="shrink-0" /> {error}
                  </div>
                )}

                <form onSubmit={handleSubmit} className="mt-5 space-y-4">
                  <div>
                    <label className="label-form">Correo</label>
                    <div className="relative">
                      <FiMail className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-slate-500" />
                      <input value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} placeholder="tucorreo@ejemplo.com" className="input-field !pl-11" />
                    </div>
                  </div>
                  <div>
                    <label className="label-form">Código de verificación</label>
                    <div className="relative">
                      <FiKey className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-slate-500" />
                      <input
                        value={codigo}
                        onChange={(e) => setCodigo(e.target.value.toUpperCase().replace(/[^A-Z0-9]/g, ''))}
                        placeholder="Código de 8 dígitos"
                        className="input-field !pl-11 text-center font-mono text-xl tracking-[0.3em]"
                        maxLength={8}
                        autoFocus
                      />
                    </div>
                  </div>
                  <button type="submit" className="btn-primary !mt-6 w-full py-3">
                    <FiKey /> Verificar
                  </button>
                </form>

                <p className="mt-4 text-center text-sm text-slate-400">
                  No tienes código?{' '}
                  <button onClick={() => { switchMode('login'); setCodigo('') }} className="font-semibold text-blue-400 hover:text-blue-300 underline underline-offset-2">
                    Volver al inicio de sesión
                  </button>
                </p>
              </>
            ) : (
              <>
                <h1 className="text-xl font-bold text-white sm:text-2xl">
                  {esRegistro ? 'Crea tu cuenta' : 'Bienvenido de vuelta'}
                </h1>
                <p className="mt-0.5 text-sm text-slate-400">
                  {esRegistro
                    ? 'Regístrate y espera la verificación del administrador'
                    : 'Inicia sesión para elegir tu perfil y continuar'}
                </p>

                {error && (
                  <div className="mt-4 flex items-center gap-2 rounded-xl border border-red-500/30 bg-red-500/10 px-4 py-2.5 text-sm text-red-300 animate-field">
                    <FiAlertCircle className="shrink-0" /> {error}
                  </div>
                )}

                <form onSubmit={handleSubmit} className={error ? 'mt-4 space-y-4' : 'mt-5 space-y-4'}>
                  {esRegistro && (
                    <div key="name" className="animate-field">
                      <label className="label-form">Nombre completo</label>
                      <div className="relative">
                        <FiUser className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-slate-500" />
                        <input name="name" type="text" value={form.name} onChange={handleChange} placeholder="Tu nombre" className="input-field !pl-11" style={{ animationDelay: '0.05s' }} />
                      </div>
                    </div>
                  )}

                  <div>
                    <label className="label-form">Correo electrónico</label>
                    <div className="relative">
                      <FiMail className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-slate-500" />
                      <input name="email" type="email" value={form.email} onChange={handleChange} placeholder="tucorreo@ejemplo.com" className="input-field !pl-11" />
                    </div>
                  </div>

                  <div>
                    <div className="flex items-center justify-between">
                      <label className="label-form">Contraseña</label>
                      {!esRegistro && (
                        <Link to="/olvide-contrasena" className="mb-1.5 text-xs font-medium text-blue-400 hover:text-blue-300">¿Olvidaste tu contraseña?</Link>
                      )}
                    </div>
                    <div className="relative">
                      <FiLock className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-slate-500" />
                      <input name="password" type={showPass ? 'text' : 'password'} value={form.password} onChange={handleChange} placeholder="••••••••" className="input-field !pl-11 !pr-11" />
                      <button type="button" onClick={() => setShowPass(!showPass)} className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-500 transition hover:text-slate-300" aria-label={showPass ? 'Ocultar contraseña' : 'Mostrar contraseña'}>
                        {showPass ? <FiEyeOff /> : <FiEye />}
                      </button>
                    </div>
                  </div>

                  {esRegistro && (
                    <div key="confirm" className="animate-field">
                      <label className="label-form">Confirmar contraseña</label>
                      <div className="relative">
                        <FiLock className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-slate-500" />
                        <input name="confirm" type={showPass ? 'text' : 'password'} value={form.confirm} onChange={handleChange} placeholder="••••••••" className="input-field !pl-11" style={{ animationDelay: '0.15s' }} />
                      </div>
                    </div>
                  )}

                  <button type="submit" className="btn-primary !mt-6 w-full py-3">
                    {esRegistro ? 'Crear cuenta' : 'Iniciar sesión'}
                  </button>
                </form>

                <p className="mt-4 text-center text-sm text-slate-400">
                  {esRegistro ? '¿Ya tienes cuenta?' : '¿No tienes cuenta?'}{' '}
                  <button type="button" onClick={() => switchMode(esRegistro ? 'login' : 'register')} className="font-semibold text-blue-400 hover:text-blue-300 underline underline-offset-2">
                    {esRegistro ? 'Inicia sesión' : 'Regístrate gratis'}
                  </button>
                </p>

                <ul className="mt-4 flex flex-wrap items-center justify-center gap-x-5 gap-y-1.5 border-t border-white/5 pt-4">
                  {(esRegistro ? ['Verificación por código', 'Roles controlados', 'Seguro'] : ['Fácil e intuitivo', 'Celular y PC', 'Tiempo real']).map((t) => (
                    <li key={t} className="flex items-center gap-1.5 text-xs text-slate-400">
                      <FiCheckCircle className="text-cyan-400" size={12} /> {t}
                    </li>
                  ))}
                </ul>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

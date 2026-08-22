import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { FiMail, FiArrowLeft, FiAlertCircle, FiCheckCircle, FiKey } from 'react-icons/fi'
import { useAuth } from '../context/AuthContext'

export default function ForgotPassword() {
  const { resetPassword } = useAuth()
  const navigate = useNavigate()
  const [form, setForm] = useState({ email: '', password: '', confirm: '' })
  const [error, setError] = useState('')
  const [done, setDone] = useState(false)

  const handleChange = (e) => setForm({ ...form, [e.target.name]: e.target.value })

  const handleSubmit = (e) => {
    e.preventDefault()
    setError('')
    if (form.password.length < 6) {
      return setError('La nueva contraseña debe tener al menos 6 caracteres.')
    }
    if (form.password !== form.confirm) {
      return setError('Las contraseñas no coinciden.')
    }
    const res = resetPassword({ email: form.email, password: form.password })
    if (!res.ok) return setError(res.error)
    setDone(true)
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-night-950 px-4 py-12">
      <div className="pointer-events-none fixed -top-32 left-1/2 h-[420px] w-[600px] -translate-x-1/2 rounded-full bg-blue-600/15 blur-[130px]" />

      <div className="relative w-full max-w-md">
        <Link
          to="/login"
          className="mb-6 inline-flex items-center gap-2 text-sm text-slate-400 transition hover:text-blue-400"
        >
          <FiArrowLeft /> Volver a iniciar sesión
        </Link>

        <div className="panel glow-blue p-8">
          {!done ? (
            <>
              <div className="text-center">
                <span className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-blue-600/15 text-blue-400 ring-1 ring-blue-500/40">
                  <FiKey size={26} />
                </span>
                <h1 className="mt-5 text-2xl font-bold text-white">Recuperar contraseña</h1>
                <p className="mt-1 text-sm text-slate-400">
                  Escribe tu correo y define una nueva contraseña
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
                  <label className="label-form" htmlFor="password">Nueva contraseña</label>
                  <input
                    id="password"
                    name="password"
                    type="password"
                    required
                    value={form.password}
                    onChange={handleChange}
                    placeholder="••••••••"
                    className="input-field"
                  />
                </div>

                <div>
                  <label className="label-form" htmlFor="confirm">Confirmar contraseña</label>
                  <input
                    id="confirm"
                    name="confirm"
                    type="password"
                    required
                    value={form.confirm}
                    onChange={handleChange}
                    placeholder="••••••••"
                    className="input-field"
                  />
                </div>

                <button type="submit" className="btn-primary w-full py-3.5">
                  Restablecer contraseña
                </button>
              </form>
            </>
          ) : (
            <div className="py-6 text-center">
              <span className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-emerald-500/15 text-emerald-400 ring-1 ring-emerald-500/40">
                <FiCheckCircle size={32} />
              </span>
              <h1 className="mt-5 text-xl font-bold text-white">¡Contraseña actualizada!</h1>
              <p className="mt-2 text-sm text-slate-400">
                Tu contraseña se restableció correctamente. Ya puedes iniciar sesión.
              </p>
              <button onClick={() => navigate('/login')} className="btn-primary mt-7 w-full py-3.5">
                Ir a iniciar sesión
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

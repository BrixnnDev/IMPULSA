import { useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { FiKey, FiAlertCircle, FiArrowLeft, FiShield, FiCheckCircle } from 'react-icons/fi'
import { useAuth } from '../context/AuthContext'

export default function VerifyPage() {
  const { user, verificar, logout } = useAuth()
  const navigate = useNavigate()
  const [codigo, setCodigo] = useState('')
  const [error, setError] = useState('')

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')
    const res = await verificar({ email: user?.email, codigo })
    if (!res.ok) return setError(res.error)
    navigate('/seleccionar-perfil')
  }

  if (!user) return null

  return (
    <div className="relative flex min-h-screen items-center justify-center overflow-hidden bg-night-950 px-4 text-slate-200">
      <div className="bg-grid pointer-events-none absolute inset-0 opacity-70 [mask-image:radial-gradient(ellipse_75%_70%_at_50%_35%,black_25%,transparent_80%)]" />
      <div className="pointer-events-none absolute -top-24 left-1/3 h-96 w-[500px] rounded-full bg-amber-500/10 blur-[120px]" />

      <Link to="/" onClick={logout} className="absolute left-4 top-4 z-20 inline-flex items-center gap-2 rounded-xl border border-white/10 bg-white/5 px-4 py-2 text-sm font-medium text-slate-300 backdrop-blur transition hover:bg-white/10 hover:text-blue-400">
        <FiArrowLeft /> Salir
      </Link>

      <div className="relative z-10 w-full max-w-md rounded-2xl border border-white/10 bg-night-900/40 p-6 backdrop-blur sm:p-7">
        <div className="flex items-center gap-3">
          <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-amber-500/15 text-amber-400 ring-1 ring-amber-500/40"><FiShield size={22} /></span>
          <div>
            <h1 className="text-xl font-bold text-white">Cuenta sin verificar</h1>
            <p className="mt-0.5 text-sm text-slate-400">{user.name} — ingresa tu código.</p>
          </div>
        </div>

        {error && (
          <div className="mt-4 flex items-center gap-2 rounded-xl border border-red-500/30 bg-red-500/10 px-4 py-2.5 text-sm text-red-300 animate-field">
            <FiAlertCircle className="shrink-0" /> {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="mt-5 space-y-4">
          <div>
            <label className="label-form">Código de verificación</label>
            <input
              value={codigo}
              onChange={(e) => setCodigo(e.target.value.replace(/[^0-9]/g, ''))}
              placeholder="Código de 6 dígitos"
              className="input-field text-center font-mono text-xl tracking-[0.3em]"
              maxLength={6}
              autoFocus
            />
          </div>
          <button type="submit" className="btn-primary w-full py-3">
            <FiKey /> Verificar
          </button>
        </form>

        <p className="mt-4 flex items-center justify-center gap-1.5 text-center text-xs text-slate-400">
          <FiCheckCircle className="text-amber-400" size={12} /> Pídele el código al administrador.
        </p>
      </div>
    </div>
  )
}

import { useState } from 'react'
import { FiUser, FiCreditCard, FiPhone, FiAlertCircle, FiShield, FiCheckCircle } from 'react-icons/fi'
import { useAuth } from '../context/AuthContext'

// Burbuja persistente para completar el perfil (nombre, apellido, cédula, celular).
// Aparece cuando el usuario ya está verificado pero todavía no tiene nombre, y
// no se puede cerrar hasta llenar los datos.
export default function ProfileBubble() {
  const { user, updateProfile } = useAuth()
  const [form, setForm] = useState({ nombre: '', apellido: '', cedula: '', celular: '' })
  const [error, setError] = useState('')
  const [saving, setSaving] = useState(false)

  const necesitaPerfil = !!user && user.verificado && !String(user.name || '').trim()
  if (!necesitaPerfil) return null

  const set = (campo, valor) => setForm((f) => ({ ...f, [campo]: valor }))

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')
    if (!form.nombre.trim() || !form.apellido.trim() || !form.cedula.trim() || !form.celular.trim()) {
      return setError('Completa nombre, apellido, cédula y celular para continuar.')
    }
    setSaving(true)
    const res = await updateProfile({
      name: form.nombre.trim(),
      apellido: form.apellido.trim(),
      cedula: form.cedula.trim(),
      telefono: form.celular.trim(),
    })
    setSaving(false)
    if (!res.ok) return setError(res.error || 'No se pudo guardar. Intenta de nuevo.')
  }

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/80 p-4 backdrop-blur-sm">
      <div className="w-full max-w-lg space-y-5 rounded-2xl border border-white/10 bg-night-850 p-6 shadow-2xl sm:p-7">
        <div className="flex items-center gap-3">
          <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-blue-600/15 text-blue-400 ring-1 ring-blue-500/40">
            <FiUser size={22} />
          </span>
          <div>
            <h2 className="text-xl font-bold text-white">Completa tu perfil</h2>
            <p className="mt-0.5 text-sm text-slate-400">
              Cuéntanos tus datos para terminar de configurar tu cuenta.
            </p>
          </div>
        </div>

        {error && (
          <div className="flex items-center gap-2 rounded-xl border border-red-500/30 bg-red-500/10 px-4 py-2.5 text-sm text-red-300 animate-field">
            <FiAlertCircle className="shrink-0" /> {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div>
              <label className="label-form">Nombre *</label>
              <div className="relative">
                <FiUser className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-slate-500" />
                <input
                  value={form.nombre}
                  onChange={(e) => set('nombre', e.target.value)}
                  placeholder="Tu nombre"
                  className="input-field !pl-11"
                  autoFocus
                />
              </div>
            </div>
            <div>
              <label className="label-form">Apellido *</label>
              <div className="relative">
                <FiUser className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-slate-500" />
                <input
                  value={form.apellido}
                  onChange={(e) => set('apellido', e.target.value)}
                  placeholder="Tu apellido"
                  className="input-field !pl-11"
                />
              </div>
            </div>
            <div>
              <label className="label-form">Cédula *</label>
              <div className="relative">
                <FiCreditCard className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-slate-500" />
                <input
                  value={form.cedula}
                  onChange={(e) => set('cedula', e.target.value)}
                  placeholder="Número de cédula"
                  className="input-field !pl-11"
                />
              </div>
            </div>
            <div>
              <label className="label-form">Celular *</label>
              <div className="relative">
                <FiPhone className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-slate-500" />
                <input
                  value={form.celular}
                  onChange={(e) => set('celular', e.target.value)}
                  placeholder="Ej. +57 320 123 4567"
                  className="input-field !pl-11"
                />
              </div>
            </div>
          </div>

          <button type="submit" disabled={saving} className="btn-primary !mt-2 w-full py-3 disabled:opacity-60">
            <FiCheckCircle /> {saving ? 'Guardando…' : 'Guardar y continuar'}
          </button>
        </form>

        <p className="flex items-center justify-center gap-1.5 text-center text-xs text-slate-400">
          <FiShield className="text-blue-400" size={12} /> Necesitamos estos datos para completar tu registro.
        </p>
      </div>
    </div>
  )
}

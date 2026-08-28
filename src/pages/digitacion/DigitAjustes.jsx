import { useEffect, useState } from 'react'
import {
  FiUser,
  FiCheckCircle,
  FiX,
  FiShield,
  FiSliders,
  FiSmartphone,
  FiWifi,
  FiCopy,
  FiRefreshCw,
  FiPrinter,
  FiInfo,
} from 'react-icons/fi'
import { useAuth } from '../../context/AuthContext'
import useAvatar, { setAvatar } from '../../hooks/useAvatar'

const ACCENTS = [
  { id: 'blue', label: 'Azul', color: '#2563eb' },
  { id: 'violet', label: 'Violeta', color: '#7c3aed' },
  { id: 'emerald', label: 'Esmeralda', color: '#059669' },
  { id: 'amber', label: 'Ámbar', color: '#d97706' },
  { id: 'rose', label: 'Rosa', color: '#e11d48' },
]

const IMPRESORAS = ['HP LaserJet P1102w', 'Epson L3110', 'Canon G3110', 'Brother HL-1210W']

const API = import.meta.env.VITE_API_URL || 'http://localhost:8787'

export default function DigitAjustes() {
  const { user, updateProfile, resetPassword } = useAuth()

  const [nombre, setNombre] = useState(user?.name || '')
  const [telefono, setTelefono] = useState(user?.telefono || '')
  const [pass, setPass] = useState({ actual: '', nueva: '', confirmar: '' })
  const [ok, setOk] = useState('')

  const [accent, setAccent] = useState('blue')
  const [dispositivo, setDispositivo] = useState(`Celular de ${user?.name || 'Usuario'}`)
  const [ip, setIp] = useState(`192.168.1.${20 + Math.floor(Math.random() * 200)}`)
  const [impresora, setImpresora] = useState(IMPRESORAS[0])
  const [avatar] = useAvatar()

  const guardarSetting = async (clave, valor) => {
    if (!user?.id) return
    try {
      await fetch(`${API}/api/settings/${user.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ clave, valor }),
      })
    } catch {
      /* silencioso */
    }
  }

  useEffect(() => {
    if (!user?.id) return
    fetch(`${API}/api/settings/${user.id}`)
      .then((r) => r.json())
      .then((s) => {
        if (s?.accent) setAccent(s.accent)
        if (s?.dispositivo) setDispositivo(s.dispositivo)
        if (s?.ip) setIp(s.ip)
        if (s?.impresora) setImpresora(s.impresora)
      })
      .catch(() => {})
  }, [user?.id])

  const mostrarOk = (msg) => {
    setOk(msg)
    setTimeout(() => setOk(''), 3500)
  }

  const guardarNombre = (e) => {
    e.preventDefault()
    if (!nombre.trim()) return
    const res = updateProfile({ name: nombre.trim(), telefono: telefono.trim() })
    mostrarOk(res.ok ? 'Perfil actualizado correctamente.' : res.error)
  }

  const cambiarContrasena = async (e) => {
    e.preventDefault()
    if (!pass.actual || !pass.nueva) return
    if (pass.nueva !== pass.confirmar) return mostrarOk('Las contraseñas nuevas no coinciden.')
    try {
      const validacion = await fetch(`${API}/api/users/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: user?.email, password: pass.actual }),
      })
      const val = await validacion.json()
      if (!val.ok) return mostrarOk('La contraseña actual no es correcta.')
      const res = await fetch(`${API}/api/users/reset`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: user?.email, password: pass.nueva }),
      })
      const data = await res.json()
      if (!data.ok) throw new Error(data.error || 'Error')
      setPass({ actual: '', nueva: '', confirmar: '' })
      mostrarOk('Contraseña actualizada correctamente.')
    } catch {
      mostrarOk('No se pudo actualizar la contraseña.')
    }
  }

  const elegirAccent = (id) => {
    setAccent(id)
    guardarSetting('accent', id)
    mostrarOk('Apariencia guardada.')
  }

  const guardarDispositivo = () => {
    const nombre = dispositivo.trim() || 'Celular'
    setDispositivo(nombre)
    guardarSetting('dispositivo', nombre)
    mostrarOk('Dispositivo actualizado.')
  }

  const regenerarIp = () => {
    const nueva = `192.168.1.${20 + Math.floor(Math.random() * 200)}`
    setIp(nueva)
    guardarSetting('ip', nueva)
    mostrarOk('Dirección IP regenerada.')
  }

  const copiarIp = async () => {
    try {
      await navigator.clipboard.writeText(ip)
      mostrarOk('IP copiada al portapapeles.')
    } catch {
      mostrarOk('No se pudo copiar la IP.')
    }
  }

  const procesarImagen = (file) => {
    if (!file || !file.type.startsWith('image/')) return mostrarOk('Selecciona un archivo de imagen.')
    const reader = new FileReader()
    reader.onload = () => {
      const img = new Image()
      img.onload = () => {
        const canvas = document.createElement('canvas')
        canvas.width = 500
        canvas.height = 500
        const ctx = canvas.getContext('2d')
        const min = Math.min(img.width, img.height)
        ctx.drawImage(img, (img.width - min) / 2, (img.height - min) / 2, min, min, 0, 0, 500, 500)
        setAvatar(canvas.toDataURL('image/jpeg', 0.85))
        const dataUrl = canvas.toDataURL('image/jpeg', 0.85)
        ;(async () => {
          try {
            const API = import.meta.env.VITE_API_URL || 'http://localhost:8787'
            await fetch(`${API}/api/users/${user?.id}`, {
              method: 'PATCH',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ avatar_url: dataUrl }),
            })
            if (user?.id) {
              const sesion = JSON.parse(localStorage.getItem('sf_session') || 'null')
              if (sesion) {
                sesion.avatar_url = dataUrl
                localStorage.setItem('sf_session', JSON.stringify(sesion))
              }
            }
          } catch {
            /* el avatar queda igual en localStorage */
          }
        })()
        mostrarOk('Foto de perfil actualizada (500×500).')
      }
      img.src = reader.result
    }
    reader.readAsDataURL(file)
  }

  const accentObj = ACCENTS.find((a) => a.id === accent) || ACCENTS[0]

  return (
    <div className="space-y-6">
      {/* Título */}
      <div>
        <h2 className="flex items-center gap-2.5 text-2xl font-black text-white">
          <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-600/15 text-blue-400 ring-1 ring-blue-500/30">
            <FiSliders size={20} />
          </span>
          Configuración
        </h2>
        <p className="mt-1 text-sm text-slate-400">Administra tu perfil, la apariencia y tu dispositivo.</p>
      </div>

      {ok && (
        <div className="flex items-center gap-3 rounded-xl border border-emerald-500/30 bg-emerald-500/10 px-5 py-4 text-sm text-emerald-300">
          <FiCheckCircle size={18} /> {ok}
          <button onClick={() => setOk('')} className="ml-auto text-emerald-300/70 hover:text-emerald-200">
            <FiX size={16} />
          </button>
        </div>
      )}

      <div className="grid grid-cols-1 gap-6 xl:grid-cols-[1fr_380px]">
        {/* Columna izquierda */}
        <div className="space-y-6">
          {/* Editar perfil */}
          <section className="panel p-6">
            <div className="flex items-center gap-3 border-b border-white/5 pb-4">
              <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-600/15 text-blue-400 ring-1 ring-blue-500/40">
                <FiUser size={18} />
              </span>
              <h3 className="font-bold text-white">Editar perfil</h3>
            </div>

            <div className="mt-5 flex items-center gap-4">
              {avatar ? (
                <img src={avatar} alt="Avatar" className="h-14 w-14 rounded-full object-cover ring-2 ring-blue-500/40" />
              ) : (
                <span
                  className="flex h-14 w-14 items-center justify-center rounded-full text-xl font-bold text-white"
                  style={{ backgroundColor: accentObj.color }}
                >
                  {(nombre || user?.name || 'U').charAt(0).toUpperCase()}
                </span>
              )}
              <div>
                <p className="font-bold text-white">{user?.name}</p>
                <p className="text-xs text-slate-500">{user?.email}</p>
                <div className="mt-2 flex items-center gap-2">
                  <label
                    htmlFor="upload-avatar"
                    className="cursor-pointer rounded-xl bg-blue-600/15 px-3 py-1.5 text-xs font-bold text-blue-300 ring-1 ring-blue-500/40 transition hover:bg-blue-600 hover:text-white"
                  >
                    Cambiar foto
                  </label>
                  {avatar && (
                    <button
                      onClick={() => {
                        setAvatar(null)
                        mostrarOk('Foto eliminada.')
                      }}
                      className="rounded-xl px-3 py-1.5 text-xs font-semibold text-slate-400 transition hover:bg-white/10 hover:text-white"
                    >
                      Quitar
                    </button>
                  )}
                </div>
              </div>
              <input
                id="upload-avatar"
                type="file"
                accept="image/*"
                className="hidden"
                onChange={(e) => {
                  procesarImagen(e.target.files?.[0])
                  e.target.value = ''
                }}
              />
            </div>

            <form onSubmit={guardarNombre} className="mt-5 space-y-4">
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <div>
                  <label className="label-form">Nombre *</label>
                  <input value={nombre} onChange={(e) => setNombre(e.target.value)} placeholder="Tu nombre" className="input-field" />
                </div>
                <div>
                  <label className="label-form">Número de celular</label>
                  <input
                    value={telefono}
                    onChange={(e) => setTelefono(e.target.value)}
                    placeholder="Ej. +57 320 123 4567"
                    className="input-field"
                  />
                </div>
              </div>
              <div>
                <label className="label-form">Correo (no editable)</label>
                <input value={user?.email || ''} disabled className="input-field cursor-not-allowed opacity-60" />
              </div>
              <div className="flex justify-end">
                <button type="submit" className="btn-primary !px-5 !py-2.5 !text-xs">
                  Guardar cambios
                </button>
              </div>
            </form>

            {/* Contraseña */}
            <form onSubmit={cambiarContrasena} className="mt-6 border-t border-white/5 pt-5">
              <p className="mb-4 flex items-center gap-2 text-sm font-bold text-white">
                <FiShield className="text-blue-400" /> Cambiar contraseña
              </p>
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
                <input
                  type="password"
                  value={pass.actual}
                  onChange={(e) => setPass({ ...pass, actual: e.target.value })}
                  placeholder="Contraseña actual"
                  className="input-field"
                />
                <input
                  type="password"
                  value={pass.nueva}
                  onChange={(e) => setPass({ ...pass, nueva: e.target.value })}
                  placeholder="Nueva contraseña"
                  className="input-field"
                />
                <input
                  type="password"
                  value={pass.confirmar}
                  onChange={(e) => setPass({ ...pass, confirmar: e.target.value })}
                  placeholder="Confirmar nueva"
                  className="input-field"
                />
              </div>
              <div className="mt-4 flex justify-end">
                <button type="submit" className="btn-ghost !px-5 !py-2.5 !text-xs">
                  Actualizar contraseña
                </button>
              </div>
            </form>
          </section>

          {/* Apariencia */}
          <section className="panel p-6">
            <div className="flex items-center gap-3 border-b border-white/5 pb-4">
              <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-violet-500/15 text-violet-400 ring-1 ring-violet-500/40">
                <FiSliders size={18} />
              </span>
              <h3 className="font-bold text-white">Apariencia</h3>
            </div>

            <div className="mt-5 grid grid-cols-1 gap-4 sm:grid-cols-2">
              <button className="rounded-xl border-2 border-blue-500/60 bg-blue-600/10 p-4 text-left transition">
                <div className="flex items-center gap-2.5">
                  <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-night-800 ring-1 ring-white/10">
                    <span className="h-4 w-4 rounded bg-slate-900" />
                  </span>
                  <p className="text-sm font-bold text-white">Oscuro</p>
                  <FiCheckCircle size={16} className="ml-auto text-blue-400" />
                </div>
                <p className="mt-2 text-xs text-slate-500">Tema actual de StockFlow.</p>
              </button>
              <button className="rounded-xl border border-white/10 p-4 text-left opacity-50 transition hover:border-white/20">
                <div className="flex items-center gap-2.5">
                  <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-slate-100 ring-1 ring-black/10">
                    <span className="h-4 w-4 rounded bg-white" />
                  </span>
                  <p className="text-sm font-bold text-white">Claro</p>
                </div>
                <p className="mt-2 text-xs text-slate-500">Disponible próximamente.</p>
              </button>
            </div>

            <div className="mt-5">
              <label className="label-form">Color de acento</label>
              <div className="flex flex-wrap items-center gap-3">
                {ACCENTS.map((a) => (
                  <button
                    key={a.id}
                    onClick={() => elegirAccent(a.id)}
                    title={a.label}
                    className={`flex h-10 w-10 items-center justify-center rounded-full transition ${
                      accent === a.id ? 'ring-2 ring-white ring-offset-2 ring-offset-night-850' : 'opacity-70 hover:opacity-100'
                    }`}
                    style={{ backgroundColor: a.color }}
                  >
                    {accent === a.id && <FiCheckCircle size={16} className="text-white" />}
                  </button>
                ))}
                <span
                  className="ml-2 rounded-xl px-4 py-2 text-xs font-bold text-white transition"
                  style={{ backgroundColor: accentObj.color }}
                >
                  Vista previa · {accentObj.label}
                </span>
              </div>
            </div>
          </section>
        </div>

        {/* Columna derecha: dispositivo */}
        <div className="space-y-6">
          <section className="panel p-6">
            <div className="flex items-center gap-3 border-b border-white/5 pb-4">
              <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-500/15 text-emerald-400 ring-1 ring-emerald-500/40">
                <FiSmartphone size={18} />
              </span>
              <h3 className="font-bold text-white">Dispositivo y conexión</h3>
            </div>

            <div className="mt-5 space-y-4">
              <div>
                <label className="label-form">Nombre del dispositivo</label>
                <div className="flex gap-2">
                  <input value={dispositivo} onChange={(e) => setDispositivo(e.target.value)} className="input-field" />
                  <button onClick={guardarDispositivo} className="btn-primary !px-4 !py-2.5 !text-xs">
                    Guardar
                  </button>
                </div>
              </div>

              <div>
                <label className="label-form">Dirección IP del celular</label>
                <div className="flex items-center gap-2 rounded-xl border border-white/10 bg-night-800 px-4 py-3">
                  <FiWifi className="shrink-0 text-emerald-400" />
                  <span className="font-mono text-sm font-bold tabular-nums text-white">{ip}</span>
                  <div className="ml-auto flex items-center gap-1">
                    <button title="Copiar IP" onClick={copiarIp} className="rounded-lg p-2 text-slate-400 transition hover:bg-white/10 hover:text-white">
                      <FiCopy size={15} />
                    </button>
                    <button title="Regenerar IP" onClick={regenerarIp} className="rounded-lg p-2 text-slate-400 transition hover:bg-white/10 hover:text-white">
                      <FiRefreshCw size={15} />
                    </button>
                  </div>
                </div>
                <p className="mt-1.5 text-xs text-slate-500">
                  Úsala para conectar el celular con la impresora de la papelería.
                </p>
              </div>

              <div>
                <label className="label-form">Red WiFi conectada</label>
                <div className="flex items-center gap-2.5 rounded-xl border border-white/10 bg-night-800 px-4 py-3 text-sm text-slate-300">
                  <FiWifi className="text-emerald-400" /> CLARO_2G_A21F
                  <span className="ml-auto rounded-full bg-emerald-500/15 px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wider text-emerald-400 ring-1 ring-emerald-500/30">
                    Conectado
                  </span>
                </div>
              </div>

              <div>
                <label className="label-form">Impresora predeterminada</label>
                <div className="flex items-center gap-2.5 rounded-xl border border-white/10 bg-night-800 px-4 py-3">
                  <FiPrinter className="shrink-0 text-blue-400" />
                  <select value={impresora} onChange={(e) => {
                    setImpresora(e.target.value)
                    guardarSetting('impresora', e.target.value)
                    mostrarOk('Impresora guardada.')
                  }} className="w-full bg-transparent text-sm font-semibold text-white outline-none [&>option]:bg-night-800">
                    {IMPRESORAS.map((p) => (
                      <option key={p}>{p}</option>
                    ))}
                  </select>
                </div>
              </div>
            </div>
          </section>

          <section className="panel p-6">
            <div className="flex items-center gap-3">
              <FiInfo className="text-slate-400" />
              <h3 className="font-bold text-white">Acerca de</h3>
            </div>
            <dl className="mt-4 space-y-2.5 text-sm">
              <div className="flex justify-between">
                <dt className="text-slate-500">Aplicación</dt>
                <dd className="font-semibold text-white">StockFlow Mobile</dd>
              </div>
              <div className="flex justify-between">
                <dt className="text-slate-500">Versión</dt>
                <dd className="font-semibold text-white">v1.0.0 · Build 2026.08</dd>
              </div>
              <div className="flex justify-between">
                <dt className="text-slate-500">Perfil</dt>
                <dd className="font-semibold capitalize text-white">{user ? 'Digitación' : '—'}</dd>
              </div>
            </dl>
          </section>
        </div>
      </div>
    </div>
  )
}

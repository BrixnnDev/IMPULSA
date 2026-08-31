import { useEffect, useState } from 'react'
import { io } from 'socket.io-client'
import {
  FiUsers, FiPlus, FiX, FiCopy, FiShield, FiUser, FiCheckCircle, FiClock, FiTrash2,
  FiMail, FiLock, FiEye, FiEyeOff, FiKey,
} from 'react-icons/fi'
import { useAuth } from '../../context/AuthContext'

const API = import.meta.env.VITE_API_URL || 'http://localhost:8787'

const ROLES = [
  { value: 'digitador', label: 'Digitación' },
  { value: 'pos', label: 'POS' },
  { value: 'admin', label: 'Admin' },
]

export default function DigitRegistros() {
  const { isAdmin } = useAuth()
  const [users, setUsers] = useState([])
  const [createOpen, setCreateOpen] = useState(false)
  const [form, setForm] = useState({ name: '', email: '', rol: 'digitador', password: '' })
  const [showPass, setShowPass] = useState(false)
  const [copiado, setCopiado] = useState('')
  const [error, setError] = useState('')
  const [nuevoCodigo, setNuevoCodigo] = useState(null)
  const [keys, setKeys] = useState([])
  const [keyOpen, setKeyOpen] = useState(false)
  const [keyRol, setKeyRol] = useState('digitador')
  const [nuevaKey, setNuevaKey] = useState(null)

  const cargar = () => {
    fetch(`${API}/api/users/list`).then((r) => r.json()).then((d) => { if (Array.isArray(d)) setUsers(d) }).catch(() => {})
  }

  const cargarKeys = () => {
    fetch(`${API}/api/users/keys`).then((r) => r.json()).then((d) => { if (Array.isArray(d)) setKeys(d) }).catch(() => {})
  }

  useEffect(() => {
    if (!isAdmin) return
    cargar()
    cargarKeys()
    const s = io(API, { transports: ['websocket'], reconnectionAttempts: 5 })
    s.on('user:registro', cargar)
    s.on('user:verificado', cargar)
    s.on('user:rol', cargar)
    return () => s.close()
  }, [isAdmin])

  const copiar = (texto, label) => {
    navigator.clipboard?.writeText(texto)
    setCopiado(label)
    setTimeout(() => setCopiado(''), 2000)
  }

  const crear = async (e) => {
    e.preventDefault()
    setError('')
    if (!form.name.trim() || !form.email.trim()) return setError('Nombre y correo son obligatorios.')
    try {
      const res = await fetch(`${API}/api/users/create`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: form.name, email: form.email, rol: form.rol, password: form.password || '123456' }),
      })
      const data = await res.json()
      if (!res.ok) return setError(data.error || 'Error.')
      setNuevoCodigo(data.user)
      setForm({ name: '', email: '', rol: 'digitador', password: '' })
      setCreateOpen(false)
      cargar()
    } catch {
      setError('Sin conexión con el servidor.')
    }
  }

  const crearKey = async () => {
    try {
      const res = await fetch(`${API}/api/users/keys`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ rol: keyRol }),
      })
      const data = await res.json()
      if (!res.ok) return setError(data.error || 'Error al crear la key.')
      setNuevaKey(data.key)
      setKeyOpen(false)
      cargarKeys()
    } catch {
      setError('Sin conexión con el servidor.')
    }
  }

  const eliminarKey = async (id) => {
    if (!window.confirm('¿Eliminar esta key?')) return
    try {
      await fetch(`${API}/api/users/keys/${id}`, { method: 'DELETE' })
      cargarKeys()
    } catch {}
  }

  const cambiarRol = async (id, rol) => {
    try {
      await fetch(`${API}/api/users/${id}/rol`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ rol }),
      })
      cargar()
    } catch {}
  }

  const eliminar = async (id) => {
    if (!window.confirm('¿Eliminar este usuario?')) return
    try {
      await fetch(`${API}/api/users/${id}`, { method: 'DELETE' })
      cargar()
    } catch {}
  }

  if (!isAdmin) {
    return (
      <div className="flex h-[50vh] items-center justify-center">
        <p className="text-sm text-slate-400">Solo administradores pueden acceder.</p>
      </div>
    )
  }

  const verificados = users.filter((u) => u.verificado && u.id !== 'u-admin').length
  const pendientes = users.filter((u) => !u.verificado).length

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h2 className="flex items-center gap-2.5 text-2xl font-black text-white">
            <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-600/15 text-blue-400 ring-1 ring-blue-500/30"><FiUsers size={20} /></span>
            Registros de usuarios
          </h2>
          <p className="mt-1 text-sm text-slate-400">Gestiona usuarios, roles y códigos de verificación.</p>
        </div>
        <div className="flex items-center gap-2">
          <button onClick={() => { setKeyRol('digitador'); setKeyOpen(true) }} className="inline-flex items-center gap-2 rounded-lg bg-amber-600 px-4 py-2.5 text-xs font-bold text-white transition hover:bg-amber-500">
            <FiKey /> Crear key
          </button>
          <button onClick={() => setCreateOpen(true)} className="btn-primary !px-4 !py-2.5 !text-xs">
            <FiPlus /> Crear usuario
          </button>
        </div>
      </div>

      <div className="grid grid-cols-3 gap-4">
        <div className="panel flex items-center gap-3 p-4">
          <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-blue-600/15 text-blue-400 ring-1 ring-blue-500/40"><FiUsers /></span>
          <div><p className="text-[11px] font-semibold uppercase tracking-wider text-slate-400">Total usuarios</p><p className="text-xl font-black text-white">{users.length}</p></div>
        </div>
        <div className="panel flex items-center gap-3 p-4">
          <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-emerald-500/15 text-emerald-400 ring-1 ring-emerald-500/40"><FiCheckCircle /></span>
          <div><p className="text-[11px] font-semibold uppercase tracking-wider text-slate-400">Verificados</p><p className="text-xl font-black text-emerald-400">{verificados}</p></div>
        </div>
        <div className="panel flex items-center gap-3 p-4">
          <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-amber-500/15 text-amber-400 ring-1 ring-amber-500/40"><FiClock /></span>
          <div><p className="text-[11px] font-semibold uppercase tracking-wider text-slate-400">Pendientes</p><p className="text-xl font-black text-amber-400">{pendientes}</p></div>
        </div>
      </div>

      {/* Panel de keys de acceso */}
      <div className="panel">
        <div className="flex items-center justify-between border-b border-white/10 px-5 py-4">
          <div className="flex items-center gap-2.5">
            <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-amber-500/15 text-amber-400 ring-1 ring-amber-500/30"><FiKey size={16} /></span>
            <div>
              <h3 className="text-sm font-bold text-white">Keys de acceso</h3>
              <p className="text-xs text-slate-400">Genera keys con rol para que los nuevos usuarios se registren y verifiquen.</p>
            </div>
          </div>
          <button onClick={() => { setKeyRol('digitador'); setKeyOpen(true) }} className="btn-ghost !px-3 !py-2 !text-xs"><FiKey /> Crear key</button>
        </div>
        <div className="p-4">
          {keys.length === 0 ? (
            <p className="py-6 text-center text-sm text-slate-500">Aún no hay keys. Crea la primera para empezar.</p>
          ) : (
            <div className="flex flex-wrap gap-3">
              {keys.map((k) => (
                <div key={k.id} className={`flex items-center gap-3 rounded-xl border px-4 py-3 ${k.usado ? 'border-white/5 bg-white/[0.02] opacity-50' : 'border-amber-500/25 bg-amber-500/5'}`}>
                  <code className="font-mono text-lg font-black tracking-widest text-amber-400">{k.codigo}</code>
                  <span className="rounded-full px-2 py-0.5 text-[10px] font-bold text-slate-300 ring-1 ring-white/10">{ROLES.find((r) => r.value === k.rol)?.label || k.rol}</span>
                  <span className={`rounded-full px-2 py-0.5 text-[10px] font-bold ${k.usado ? 'bg-slate-500/15 text-slate-400' : 'bg-emerald-500/15 text-emerald-400'}`}>{k.usado ? 'Usada' : 'Disponible'}</span>
                  <button onClick={() => copiar(k.codigo, `k-${k.id}`)} className="rounded-lg p-1.5 text-slate-400 transition hover:bg-white/10 hover:text-white" title="Copiar key"><FiCopy size={13} /></button>
                  {copiado === `k-${k.id}` && <span className="text-[10px] text-emerald-400">Copiado</span>}
                  <button onClick={() => eliminarKey(k.id)} className="rounded-lg p-1.5 text-slate-500 transition hover:bg-red-600/15 hover:text-red-400" title="Eliminar key"><FiTrash2 size={13} /></button>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Tabla de usuarios */}
      <div className="panel overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead>
              <tr className="border-b border-white/10 bg-night-800/60 text-[11px] uppercase tracking-wider text-slate-400">
                <th className="px-5 py-3.5 font-semibold">Usuario</th>
                <th className="px-5 py-3.5 font-semibold">Estado</th>
                <th className="px-5 py-3.5 font-semibold">Código verificación</th>
                <th className="px-5 py-3.5 font-semibold">Rol</th>
                <th className="px-5 py-3.5 font-semibold">Creado</th>
                <th className="px-5 py-3.5 font-semibold"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              {users.map((u) => (
                <tr key={u.id} className="transition hover:bg-white/[0.02]">
                  <td className="px-5 py-3.5">
                    <div className="flex items-center gap-3">
                      <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-blue-600/15 text-xs font-bold text-blue-300 ring-1 ring-blue-500/30">
                        {u.name.charAt(0).toUpperCase()}
                      </span>
                      <div>
                        <p className="font-semibold text-white">{u.name} {u.id === 'u-admin' && <span className="ml-1 rounded-full bg-violet-500/15 px-2 py-0.5 text-[10px] font-bold text-violet-300 ring-1 ring-violet-500/30">MASTER</span>}</p>
                        <p className="text-xs text-slate-500">{u.email}</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-5 py-3.5">
                    {u.verificado ? (
                      <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-500/15 px-2.5 py-1 text-[11px] font-bold text-emerald-400 ring-1 ring-emerald-500/30"><FiCheckCircle size={12} /> Verificado</span>
                    ) : (
                      <span className="inline-flex items-center gap-1.5 rounded-full bg-amber-500/15 px-2.5 py-1 text-[11px] font-bold text-amber-400 ring-1 ring-amber-500/30"><FiClock size={12} /> Pendiente</span>
                    )}
                  </td>
                  <td className="px-5 py-3.5">
                    {u.verificado ? (
                      <span className="text-xs text-slate-500">—</span>
                    ) : (
                      <div className="flex items-center gap-2">
                        <code className="rounded-lg bg-black/30 px-3 py-1.5 font-mono text-sm font-bold tracking-widest text-amber-400 ring-1 ring-amber-500/25">{u.codigo}</code>
                        <button onClick={() => copiar(u.codigo, u.id)} className="rounded-lg p-1.5 text-slate-400 transition hover:bg-white/10 hover:text-white" title="Copiar código"><FiCopy size={14} /></button>
                        {copiado === u.id && <span className="text-[10px] text-emerald-400">Copiado</span>}
                      </div>
                    )}
                  </td>
                  <td className="px-5 py-3.5">
                    {u.id === 'u-admin' ? (
                      <span className="text-xs text-slate-500">Admin</span>
                    ) : (
                      <select
                        value={u.rol}
                        onChange={(e) => cambiarRol(u.id, e.target.value)}
                        className="rounded-lg border border-white/10 bg-night-800 px-2.5 py-1.5 text-xs font-semibold text-white ring-1 ring-white/5 focus:border-blue-500/50 focus:outline-none"
                      >
                        {ROLES.map((r) => <option key={r.value} value={r.value}>{r.label}</option>)}
                      </select>
                    )}
                  </td>
                  <td className="px-5 py-3.5 text-xs text-slate-500">
                    {u.verificado ? (
                      u.verificadoEn ? new Date(u.verificadoEn).toLocaleString('es-CO', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' }) : '—'
                    ) : new Date(u.creado).toLocaleDateString('es-CO')}
                  </td>
                  <td className="px-5 py-3.5">
                    {u.id !== 'u-admin' && (
                      <button onClick={() => eliminar(u.id)} className="rounded-lg p-2 text-slate-500 transition hover:bg-red-600/15 hover:text-red-400" title="Eliminar"><FiTrash2 size={14} /></button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal crear usuario */}
      {createOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4 backdrop-blur-sm" onClick={() => setCreateOpen(false)}>
          <div className="w-full max-w-md space-y-5 rounded-2xl border border-white/10 bg-night-850 p-6 shadow-2xl" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center gap-3 border-b border-white/5 pb-4">
              <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-600/15 text-blue-400 ring-1 ring-blue-500/40"><FiUser size={18} /></span>
              <div><h3 className="font-bold text-white">Crear usuario</h3><p className="text-xs text-slate-400">Se generará un código de verificación.</p></div>
              <button onClick={() => setCreateOpen(false)} className="ml-auto rounded-xl p-2.5 text-slate-400 transition hover:bg-white/10 hover:text-white"><FiX size={16} /></button>
            </div>

            {error && <div className="flex items-center gap-2 rounded-xl border border-red-500/30 bg-red-500/10 px-4 py-2.5 text-sm text-red-300">{error}</div>}

            <form onSubmit={crear} className="space-y-4">
              <div>
                <label className="label-form">Nombre *</label>
                <input autoFocus value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder="Nombre completo" className="input-field" />
              </div>
              <div>
                <label className="label-form">Correo *</label>
                <div className="relative">
                  <FiMail className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-slate-500" size={15} />
                  <input type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} placeholder="correo@ejemplo.com" className="input-field !pl-11" />
                </div>
              </div>
              <div>
                <label className="label-form">Rol</label>
                <div className="grid grid-cols-3 gap-2">
                  {ROLES.map((r) => (
                    <button
                      key={r.value}
                      type="button"
                      onClick={() => setForm({ ...form, rol: r.value })}
                      className={`flex items-center justify-center gap-1.5 rounded-xl border px-2 py-2.5 text-xs font-semibold transition ${
                        form.rol === r.value
                          ? 'border-blue-500/50 bg-blue-600/15 text-blue-300'
                          : 'border-white/10 bg-night-800 text-slate-400 hover:bg-white/5'
                      }`}
                    >
                      {r.value === 'digitador' ? <FiUsers size={13} /> : r.value === 'pos' ? <FiLock size={13} /> : <FiShield size={13} />}
                      {r.label}
                    </button>
                  ))}
                </div>
              </div>
              <div>
                <label className="label-form">Contraseña (opcional)</label>
                <div className="relative">
                  <FiLock className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-slate-500" size={15} />
                  <input type={showPass ? 'text' : 'password'} value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} placeholder="Por defecto: 123456" className="input-field !pl-11 !pr-11" />
                  <button type="button" onClick={() => setShowPass(!showPass)} className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-300"><FiEye size={15} /></button>
                </div>
              </div>
              <div className="flex justify-end gap-3 border-t border-white/5 pt-4">
                <button type="button" onClick={() => setCreateOpen(false)} className="btn-ghost !px-5 !py-2.5 !text-xs">Cancelar</button>
                <button type="submit" className="btn-primary !px-5 !py-2.5 !text-xs"><FiUser /> Crear usuario</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal nuevo código */}
      {nuevoCodigo && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4 backdrop-blur-sm" onClick={() => setNuevoCodigo(null)}>
          <div className="w-full max-w-md space-y-5 rounded-2xl border border-white/10 bg-night-850 p-6 shadow-2xl" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center gap-3 border-b border-white/5 pb-4">
              <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-500/15 text-emerald-400 ring-1 ring-emerald-500/40"><FiKey size={18} /></span>
              <div><h3 className="font-bold text-white">Usuario creado</h3><p className="text-xs text-slate-400">{nuevoCodigo.name}</p></div>
              <button onClick={() => setNuevoCodigo(null)} className="ml-auto rounded-xl p-2.5 text-slate-400 transition hover:bg-white/10 hover:text-white"><FiX size={16} /></button>
            </div>

            <div className="rounded-xl border border-white/5 bg-black/30 p-5 text-center">
              <p className="text-xs font-semibold text-slate-300">Código de verificación — entrégaselo al usuario:</p>
              <div className="mt-3 flex items-center justify-center gap-3">
                <span className="rounded-xl bg-black/40 px-6 py-4 font-mono text-3xl font-black tracking-widest text-emerald-400 ring-1 ring-emerald-500/30 select-all">{nuevoCodigo.codigo}</span>
                <button onClick={() => copiar(nuevoCodigo.codigo, 'nuevo')} className="rounded-xl p-3 text-slate-400 transition hover:bg-white/10 hover:text-white"><FiCopy size={20} /></button>
              </div>
              {copiado === 'nuevo' && <p className="mt-2 text-xs text-emerald-400">Copiado</p>}
              <p className="mt-3 text-xs text-slate-500">Rol asignado: <span className="font-bold text-slate-300">{ROLES.find((r) => r.value === nuevoCodigo.rol)?.label}</span></p>
            </div>

            <button onClick={() => setNuevoCodigo(null)} className="btn-primary w-full !py-2.5 !text-xs">Entendido</button>
          </div>
        </div>
      )}

      {/* Modal crear key */}
      {keyOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4 backdrop-blur-sm" onClick={() => setKeyOpen(false)}>
          <div className="w-full max-w-md space-y-5 rounded-2xl border border-white/10 bg-night-850 p-6 shadow-2xl" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center gap-3 border-b border-white/5 pb-4">
              <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-amber-500/15 text-amber-400 ring-1 ring-amber-500/40"><FiKey size={18} /></span>
              <div><h3 className="font-bold text-white">Crear key de acceso</h3><p className="text-xs text-slate-400">Se generará una key de 6 dígitos con el rol elegido.</p></div>
              <button onClick={() => setKeyOpen(false)} className="ml-auto rounded-xl p-2.5 text-slate-400 transition hover:bg-white/10 hover:text-white"><FiX size={16} /></button>
            </div>

            <div>
              <label className="label-form">Rol de la key</label>
              <div className="grid grid-cols-3 gap-2">
                {ROLES.map((r) => (
                  <button
                    key={r.value}
                    type="button"
                    onClick={() => setKeyRol(r.value)}
                    className={`flex items-center justify-center gap-1.5 rounded-xl border px-2 py-2.5 text-xs font-semibold transition ${
                      keyRol === r.value
                        ? 'border-amber-500/50 bg-amber-600/15 text-amber-300'
                        : 'border-white/10 bg-night-800 text-slate-400 hover:bg-white/5'
                    }`}
                  >
                    {r.value === 'digitador' ? <FiUsers size={13} /> : r.value === 'pos' ? <FiLock size={13} /> : <FiShield size={13} />}
                    {r.label}
                  </button>
                ))}
              </div>
            </div>

            <div className="flex justify-end gap-3 border-t border-white/5 pt-4">
              <button type="button" onClick={() => setKeyOpen(false)} className="btn-ghost !px-5 !py-2.5 !text-xs">Cancelar</button>
              <button onClick={crearKey} className="inline-flex items-center gap-2 rounded-lg bg-amber-600 px-5 py-2.5 text-xs font-bold text-white transition hover:bg-amber-500"><FiKey size={14} /> Generar key</button>
            </div>
          </div>
        </div>
      )}

      {/* Modal key generada */}
      {nuevaKey && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4 backdrop-blur-sm" onClick={() => setNuevaKey(null)}>
          <div className="w-full max-w-md space-y-5 rounded-2xl border border-white/10 bg-night-850 p-6 shadow-2xl" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center gap-3 border-b border-white/5 pb-4">
              <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-500/15 text-emerald-400 ring-1 ring-emerald-500/40"><FiKey size={18} /></span>
              <div><h3 className="font-bold text-white">Key generada</h3><p className="text-xs text-slate-400">Entrégasela al nuevo usuario.</p></div>
              <button onClick={() => setNuevaKey(null)} className="ml-auto rounded-xl p-2.5 text-slate-400 transition hover:bg-white/10 hover:text-white"><FiX size={16} /></button>
            </div>

            <div className="rounded-xl border border-white/5 bg-black/30 p-5 text-center">
              <p className="text-xs font-semibold text-slate-300">Key de acceso de 6 dígitos:</p>
              <div className="mt-3 flex items-center justify-center gap-3">
                <span className="rounded-xl bg-black/40 px-6 py-4 font-mono text-3xl font-black tracking-widest text-amber-400 ring-1 ring-amber-500/30 select-all">{nuevaKey.codigo}</span>
                <button onClick={() => copiar(nuevaKey.codigo, 'nkey')} className="rounded-xl p-3 text-slate-400 transition hover:bg-white/10 hover:text-white"><FiCopy size={20} /></button>
              </div>
              {copiado === 'nkey' && <p className="mt-2 text-xs text-emerald-400">Copiada</p>}
              <p className="mt-3 text-xs text-slate-500">Rol asignado: <span className="font-bold text-slate-300">{ROLES.find((r) => r.value === nuevaKey.rol)?.label}</span></p>
            </div>

            <button onClick={() => setNuevaKey(null)} className="btn-primary w-full !py-2.5 !text-xs">Entendido</button>
          </div>
        </div>
      )}
    </div>
  )
}

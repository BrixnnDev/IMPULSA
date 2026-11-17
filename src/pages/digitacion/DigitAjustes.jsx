import { useEffect, useState } from 'react'
import {
  FiUser, FiCheckCircle, FiX, FiShield, FiSliders, FiSmartphone,
  FiWifi, FiCopy, FiRefreshCw, FiPrinter, FiInfo, FiChevronDown, FiBell,
} from 'react-icons/fi'
import { useAuth } from '../../context/AuthContext'
import useAvatar, { setAvatar } from '../../hooks/useAvatar'

const ACCENTS = [
  { id: 'blue',    label: 'Azul',       color: '#2563eb' },
  { id: 'violet',  label: 'Violeta',    color: '#7c3aed' },
  { id: 'emerald', label: 'Esmeralda',  color: '#059669' },
  { id: 'amber',   label: 'Ámbar',      color: '#d97706' },
  { id: 'rose',    label: 'Rosa',       color: '#e11d48' },
]

const IMPRESORAS = ['HP LaserJet P1102w', 'Epson L3110', 'Canon G3110', 'Brother HL-1210W']
const API = import.meta.env.VITE_API_URL || 'http://localhost:8787'

function Section({ id, abierta, toggle, icon: Icon, color, titulo, children }) {
  const open = abierta === id
  return (
    <div className="panel overflow-hidden">
      <button
        onClick={() => toggle(id)}
        className="flex w-full items-center gap-3 px-5 py-4 text-left transition hover:bg-white/[0.03]"
      >
        <span className={`flex h-9 w-9 shrink-0 items-center justify-center overflow-hidden rounded-xl border ${color}`}>
          <Icon size={16} />
        </span>
        <span className="flex-1 font-bold text-white">{titulo}</span>
        <FiChevronDown
          size={16}
          className={`shrink-0 text-slate-400 transition-transform duration-200 ${open ? 'rotate-180' : ''}`}
        />
      </button>
      {open && <div className="border-t border-white/5 px-5 pb-5 pt-4">{children}</div>}
    </div>
  )
}

export default function DigitAjustes() {
  const { user, updateProfile } = useAuth()
  const [abierta, setAbierta] = useState('perfil')
  const toggle = (id) => setAbierta((prev) => (prev === id ? null : id))

  const [nombre,   setNombre]   = useState(user?.name     || '')
  const [apellido, setApellido] = useState(user?.apellido || '')
  const [cedula,   setCedula]   = useState(user?.cedula   || '')
  const [telefono, setTelefono] = useState(user?.telefono || '')
  const [pass, setPass] = useState({ actual: '', nueva: '', confirmar: '' })
  const [ok,   setOk]   = useState('')

  const [accent,     setAccent]     = useState('blue')
  const [dispositivo, setDispositivo] = useState(`Celular de ${user?.name || 'Usuario'}`)
  const [ip,         setIp]         = useState(`192.168.1.${20 + Math.floor(Math.random() * 200)}`)
  const [impresora,  setImpresora]  = useState(IMPRESORAS[0])
  const [avatar]                    = useAvatar(user?.id)

  // Notificaciones: mensajes nuevos + pagos recibidos
  const [notifMensajes, setNotifMensajes] = useState(0)
  const [notifPagos,    setNotifPagos]    = useState(true) // toggle
  const [notifSonido,   setNotifSonido]   = useState(true)

  const guardarSetting = async (clave, valor) => {
    if (!user?.id) return
    try {
      await fetch(`${API}/api/settings/${user.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ clave, valor }),
      })
    } catch { /* silencioso */ }
  }

  useEffect(() => {
    if (!user?.id) return
    fetch(`${API}/api/settings/${user.id}`)
      .then((r) => r.json())
      .then((s) => {
        if (s?.accent)      setAccent(s.accent)
        if (s?.dispositivo) setDispositivo(s.dispositivo)
        if (s?.ip)          setIp(s.ip)
        if (s?.impresora)   setImpresora(s.impresora)
        if (s?.notifPagos  !== undefined) setNotifPagos(s.notifPagos  === 'true')
        if (s?.notifSonido !== undefined) setNotifSonido(s.notifSonido === 'true')
      })
      .catch(() => {})
    // Mensajes no leídos
    fetch(`${API}/api/mensajes/usuarios?de_user=${user.id}`)
      .then((r) => r.json())
      .then((arr) => {
        if (Array.isArray(arr)) {
          const total = arr.reduce((a, c) => a + (c.noLeidos || 0), 0)
          setNotifMensajes(total)
        }
      })
      .catch(() => {})
  }, [user?.id])

  const mostrarOk = (msg) => { setOk(msg); setTimeout(() => setOk(''), 3500) }

  const guardarNombre = async (e) => {
    e.preventDefault()
    if (!nombre.trim()) return
    const res = await updateProfile({ name: nombre.trim(), apellido: apellido.trim(), cedula: cedula.trim(), telefono: telefono.trim() })
    mostrarOk(res.ok ? 'Perfil actualizado.' : (res.error || 'No se pudo actualizar.'))
  }

  const cambiarContrasena = async (e) => {
    e.preventDefault()
    if (!pass.actual || !pass.nueva) return
    if (pass.nueva !== pass.confirmar) return mostrarOk('Las contraseñas nuevas no coinciden.')
    try {
      const val = await fetch(`${API}/api/users/login`, {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: user?.email, password: pass.actual }),
      }).then((r) => r.json())
      if (!val.ok) return mostrarOk('La contraseña actual no es correcta.')
      const res = await fetch(`${API}/api/users/reset`, {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: user?.email, password: pass.nueva }),
      }).then((r) => r.json())
      if (!res.ok) throw new Error(res.error || 'Error')
      setPass({ actual: '', nueva: '', confirmar: '' })
      mostrarOk('Contraseña actualizada.')
    } catch { mostrarOk('No se pudo actualizar la contraseña.') }
  }

  const elegirAccent = (id) => { setAccent(id); guardarSetting('accent', id); mostrarOk('Apariencia guardada.') }

  const guardarDispositivo = () => {
    const v = dispositivo.trim() || 'Celular'
    setDispositivo(v); guardarSetting('dispositivo', v); mostrarOk('Dispositivo actualizado.')
  }

  const regenerarIp = () => {
    const v = `192.168.1.${20 + Math.floor(Math.random() * 200)}`
    setIp(v); guardarSetting('ip', v); mostrarOk('IP regenerada.')
  }

  const copiarIp = async () => {
    try { await navigator.clipboard.writeText(ip); mostrarOk('IP copiada.') }
    catch { mostrarOk('No se pudo copiar.') }
  }

  const procesarImagen = (file) => {
    if (!file || !file.type.startsWith('image/')) return mostrarOk('Selecciona una imagen.')
    const reader = new FileReader()
    reader.onload = () => {
      const img = new Image()
      img.onload = () => {
        const canvas = document.createElement('canvas')
        canvas.width = 500; canvas.height = 500
        const ctx = canvas.getContext('2d')
        const min = Math.min(img.width, img.height)
        ctx.drawImage(img, (img.width-min)/2, (img.height-min)/2, min, min, 0, 0, 500, 500)
        const dataUrl = canvas.toDataURL('image/jpeg', 0.85)
        setAvatar(dataUrl, user?.id)
        ;(async () => {
          try {
            await fetch(`${API}/api/users/${user?.id}`, {
              method: 'PATCH', headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ avatar_url: dataUrl }),
            })
            const sesion = JSON.parse(localStorage.getItem('sf_session') || 'null')
            if (sesion) { sesion.avatar_url = dataUrl; localStorage.setItem('sf_session', JSON.stringify(sesion)) }
          } catch { /* guarda en local */ }
        })()
        mostrarOk('Foto actualizada.')
      }
      img.src = reader.result
    }
    reader.readAsDataURL(file)
  }

  const accentObj = ACCENTS.find((a) => a.id === accent) || ACCENTS[0]
  const shortId = user?.short_id || user?.id?.replace(/^u-/, '').slice(0, 8).toUpperCase() || '????????'

  return (
    <div className="space-y-3">
      {/* Título */}
      <div className="mb-2">
        <h2 className="flex items-center gap-2.5 text-2xl font-black text-white">
          <span className="flex h-10 w-10 shrink-0 items-center justify-center overflow-hidden rounded-xl border border-blue-500/30 bg-blue-600/15 text-blue-400">
            <FiSliders size={16} />
          </span>
          Configuración
        </h2>
        <p className="mt-1 text-sm text-slate-400">Administra tu cuenta y preferencias.</p>
      </div>

      {ok && (
        <div className="flex items-center gap-3 rounded-xl border border-emerald-500/30 bg-emerald-500/10 px-5 py-3 text-sm text-emerald-300">
          <FiCheckCircle size={16} /> {ok}
          <button onClick={() => setOk('')} className="ml-auto text-emerald-300/60 hover:text-emerald-200"><FiX size={14} /></button>
        </div>
      )}

      {/* ── PERFIL ── */}
      <Section id="perfil" abierta={abierta} toggle={toggle}
        icon={FiUser} color="border-blue-500/30 bg-blue-600/15 text-blue-400" titulo="Perfil">
        <div className="flex items-center gap-4 mb-5">
          {avatar
            ? <img src={avatar} alt="Avatar" className="h-14 w-14 rounded-full object-cover ring-2 ring-blue-500/40" />
            : <span className="flex h-14 w-14 items-center justify-center rounded-full text-xl font-bold text-white" style={{ backgroundColor: accentObj.color }}>
                {(nombre || user?.name || 'U').charAt(0).toUpperCase()}
              </span>
          }
          <div>
            <p className="font-bold text-white">{[user?.name, user?.apellido].filter(Boolean).join(' ') || user?.email}</p>
            <p className="text-xs text-slate-500">{user?.email}</p>
            <div className="mt-2 flex items-center gap-2">
              <label htmlFor="upload-avatar" className="cursor-pointer rounded-lg bg-blue-600/15 px-3 py-1.5 text-xs font-bold text-blue-300 ring-1 ring-blue-500/40 transition hover:bg-blue-600 hover:text-white">
                Cambiar foto
              </label>
              {avatar && (
                <button onClick={() => { setAvatar(null, user?.id); mostrarOk('Foto eliminada.') }}
                  className="rounded-lg px-3 py-1.5 text-xs text-slate-400 transition hover:bg-white/10 hover:text-white">
                  Quitar
                </button>
              )}
            </div>
          </div>
          <input id="upload-avatar" type="file" accept="image/*" className="hidden"
            onChange={(e) => { procesarImagen(e.target.files?.[0]); e.target.value = '' }} />
        </div>

        <form onSubmit={guardarNombre} className="space-y-4">
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div><label className="label-form">Nombre *</label>
              <input value={nombre} onChange={(e) => setNombre(e.target.value.toUpperCase())} placeholder="Tu nombre" className="input-field input-upper" /></div>
            <div><label className="label-form">Apellido</label>
              <input value={apellido} onChange={(e) => setApellido(e.target.value.toUpperCase())} placeholder="Tu apellido" className="input-field input-upper" /></div>
            <div><label className="label-form">Cédula</label>
              <input value={cedula} onChange={(e) => setCedula(e.target.value)} placeholder="Número de cédula" className="input-field" /></div>
            <div><label className="label-form">Celular</label>
              <input value={telefono} onChange={(e) => setTelefono(e.target.value)} placeholder="+57 320 123 4567" className="input-field" /></div>
          </div>
          <div><label className="label-form">Correo (no editable)</label>
            <input value={user?.email || ''} disabled className="input-field cursor-not-allowed opacity-60" /></div>
          <div className="flex justify-end">
            <button type="submit" className="btn-primary !px-5 !py-2.5 !text-xs">Guardar cambios</button>
          </div>
        </form>
      </Section>

      {/* ── CAMBIAR CONTRASEÑA ── */}
      <Section id="password" abierta={abierta} toggle={toggle}
        icon={FiShield} color="border-violet-500/30 bg-violet-500/15 text-violet-400" titulo="Cambiar contraseña">
        <form onSubmit={cambiarContrasena} className="space-y-4">
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
            <div><label className="label-form">Contraseña actual</label>
              <input type="password" value={pass.actual} onChange={(e) => setPass({ ...pass, actual: e.target.value })} placeholder="••••••" className="input-field" /></div>
            <div><label className="label-form">Nueva contraseña</label>
              <input type="password" value={pass.nueva} onChange={(e) => setPass({ ...pass, nueva: e.target.value })} placeholder="••••••" className="input-field" /></div>
            <div><label className="label-form">Confirmar nueva</label>
              <input type="password" value={pass.confirmar} onChange={(e) => setPass({ ...pass, confirmar: e.target.value })} placeholder="••••••" className="input-field" /></div>
          </div>
          <div className="flex justify-end">
            <button type="submit" className="btn-ghost !px-5 !py-2.5 !text-xs">Actualizar contraseña</button>
          </div>
        </form>
      </Section>

      {/* ── APARIENCIA ── */}
      <Section id="apariencia" abierta={abierta} toggle={toggle}
        icon={FiSliders} color="border-amber-500/30 bg-amber-500/15 text-amber-400" titulo="Apariencia">
        <div className="space-y-5">
          <div className="grid grid-cols-2 gap-4">
            <button className="rounded-xl border-2 border-blue-500/60 bg-blue-600/10 p-4 text-left">
              <div className="flex items-center gap-2.5">
                <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-night-800 ring-1 ring-white/10">
                  <span className="h-3.5 w-3.5 rounded bg-slate-900" />
                </span>
                <p className="text-sm font-bold text-white">Oscuro</p>
                <FiCheckCircle size={15} className="ml-auto text-blue-400" />
              </div>
              <p className="mt-1.5 text-xs text-slate-500">Tema actual.</p>
            </button>
            <button className="rounded-xl border border-white/10 p-4 text-left opacity-50">
              <div className="flex items-center gap-2.5">
                <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-slate-100 ring-1 ring-black/10">
                  <span className="h-3.5 w-3.5 rounded bg-white" />
                </span>
                <p className="text-sm font-bold text-white">Claro</p>
              </div>
              <p className="mt-1.5 text-xs text-slate-500">Próximamente.</p>
            </button>
          </div>
          <div>
            <label className="label-form">Color de acento</label>
            <div className="flex flex-wrap items-center gap-3">
              {ACCENTS.map((a) => (
                <button key={a.id} onClick={() => elegirAccent(a.id)} title={a.label}
                  className={`flex h-9 w-9 items-center justify-center rounded-full transition ${accent === a.id ? 'ring-2 ring-white ring-offset-2 ring-offset-night-850' : 'opacity-70 hover:opacity-100'}`}
                  style={{ backgroundColor: a.color }}>
                  {accent === a.id && <FiCheckCircle size={15} className="text-white" />}
                </button>
              ))}
              <span className="ml-2 rounded-xl px-4 py-2 text-xs font-bold text-white" style={{ backgroundColor: accentObj.color }}>
                {accentObj.label}
              </span>
            </div>
          </div>
        </div>
      </Section>

      {/* ── DISPOSITIVO Y CONEXIÓN ── */}
      <Section id="dispositivo" abierta={abierta} toggle={toggle}
        icon={FiSmartphone} color="border-emerald-500/30 bg-emerald-500/15 text-emerald-400" titulo="Dispositivo y conexión">
        <div className="space-y-4">
          <div>
            <label className="label-form">Nombre del dispositivo</label>
            <div className="flex gap-2">
              <input value={dispositivo} onChange={(e) => setDispositivo(e.target.value)} className="input-field" />
              <button onClick={guardarDispositivo} className="btn-primary !px-4 !py-2.5 !text-xs">Guardar</button>
            </div>
          </div>
          <div>
            <label className="label-form">Dirección IP</label>
            <div className="flex items-center gap-2 rounded-xl border border-white/10 bg-night-800 px-4 py-3">
              <FiWifi className="shrink-0 text-emerald-400" />
              <span className="font-mono text-sm font-bold text-white">{ip}</span>
              <div className="ml-auto flex gap-1">
                <button title="Copiar" onClick={copiarIp} className="rounded-lg p-2 text-slate-400 hover:bg-white/10 hover:text-white"><FiCopy size={14} /></button>
                <button title="Regenerar" onClick={regenerarIp} className="rounded-lg p-2 text-slate-400 hover:bg-white/10 hover:text-white"><FiRefreshCw size={14} /></button>
              </div>
            </div>
            <p className="mt-1.5 text-xs text-slate-500">Para conectar el celular con la impresora.</p>
          </div>
          <div>
            <label className="label-form">Red WiFi</label>
            <div className="flex items-center gap-2.5 rounded-xl border border-white/10 bg-night-800 px-4 py-3 text-sm text-slate-300">
              <FiWifi className="text-emerald-400" /> CLARO_2G_A21F
              <span className="ml-auto rounded-full bg-emerald-500/15 px-2.5 py-0.5 text-[10px] font-bold text-emerald-400 ring-1 ring-emerald-500/30">Conectado</span>
            </div>
          </div>
          <div>
            <label className="label-form">Impresora predeterminada</label>
            <div className="flex items-center gap-2.5 rounded-xl border border-white/10 bg-night-800 px-4 py-3">
              <FiPrinter className="shrink-0 text-blue-400" />
              <select value={impresora} onChange={(e) => { setImpresora(e.target.value); guardarSetting('impresora', e.target.value); mostrarOk('Impresora guardada.') }}
                className="w-full bg-transparent text-sm font-semibold text-white outline-none [&>option]:bg-night-800">
                {IMPRESORAS.map((p) => <option key={p}>{p}</option>)}
              </select>
            </div>
          </div>
        </div>
      </Section>

      {/* ── NOTIFICACIONES ── */}
      <Section id="notificaciones" abierta={abierta} toggle={toggle}
        icon={FiBell} color="border-rose-500/30 bg-rose-500/15 text-rose-400" titulo="Notificaciones">
        <div className="space-y-3">
          {/* Resumen */}
          <div className="flex items-center justify-between rounded-xl bg-night-800 px-4 py-3 ring-1 ring-white/5">
            <div>
              <p className="text-sm font-semibold text-white">Mensajes sin leer</p>
              <p className="text-xs text-slate-500">Conversaciones con otros usuarios</p>
            </div>
            <span className={`rounded-full px-3 py-1 text-sm font-black ring-1 ${notifMensajes > 0 ? 'bg-red-500/15 text-red-400 ring-red-500/30' : 'bg-white/5 text-slate-500 ring-white/10'}`}>
              {notifMensajes > 0 ? notifMensajes : '—'}
            </span>
          </div>

          {/* Toggle: notificación de pagos */}
          <div className="flex items-center justify-between rounded-xl bg-night-800 px-4 py-3 ring-1 ring-white/5">
            <div>
              <p className="text-sm font-semibold text-white">Notificar pagos recibidos</p>
              <p className="text-xs text-slate-500">Cuando un valecito es aprobado o cobrado</p>
            </div>
            <button
              onClick={() => { const v = !notifPagos; setNotifPagos(v); guardarSetting('notifPagos', String(v)) }}
              className={`relative h-6 w-11 rounded-full transition-colors ${notifPagos ? 'bg-emerald-500' : 'bg-night-700'}`}
            >
              <span className={`absolute top-0.5 h-5 w-5 rounded-full bg-white shadow transition-transform ${notifPagos ? 'translate-x-5' : 'translate-x-0.5'}`} />
            </button>
          </div>

          {/* Toggle: sonido */}
          <div className="flex items-center justify-between rounded-xl bg-night-800 px-4 py-3 ring-1 ring-white/5">
            <div>
              <p className="text-sm font-semibold text-white">Sonido de notificaciones</p>
              <p className="text-xs text-slate-500">Reproducir sonido al recibir mensajes</p>
            </div>
            <button
              onClick={() => { const v = !notifSonido; setNotifSonido(v); guardarSetting('notifSonido', String(v)) }}
              className={`relative h-6 w-11 rounded-full transition-colors ${notifSonido ? 'bg-emerald-500' : 'bg-night-700'}`}
            >
              <span className={`absolute top-0.5 h-5 w-5 rounded-full bg-white shadow transition-transform ${notifSonido ? 'translate-x-5' : 'translate-x-0.5'}`} />
            </button>
          </div>
        </div>
      </Section>

      {/* ── INFORMACIÓN DE LA CUENTA ── */}
      <Section id="info" abierta={abierta} toggle={toggle}
        icon={FiInfo} color="border-slate-500/30 bg-slate-500/15 text-slate-400" titulo="Información de la cuenta">
        <dl className="space-y-2.5 text-sm">
          <div className="flex items-center justify-between rounded-xl bg-night-800 px-4 py-2.5 ring-1 ring-white/5">
            <dt className="text-slate-400">ID de cuenta</dt>
            <dd className="font-mono text-lg font-black tracking-widest text-blue-300">{shortId}</dd>
          </div>
          <div className="flex items-center justify-between rounded-xl bg-night-800 px-4 py-2.5 ring-1 ring-white/5">
            <dt className="text-slate-400">Rol</dt>
            <dd className="font-semibold capitalize text-white">{user?.rol || '—'}</dd>
          </div>
          <div className="flex items-center justify-between rounded-xl bg-night-800 px-4 py-2.5 ring-1 ring-white/5">
            <dt className="text-slate-400">Verificado</dt>
            <dd className={`font-semibold ${user?.verificado ? 'text-emerald-400' : 'text-amber-400'}`}>
              {user?.verificado ? 'Sí ✓' : 'Pendiente'}
            </dd>
          </div>
          <div className="flex items-center justify-between rounded-xl bg-night-800 px-4 py-2.5 ring-1 ring-white/5">
            <dt className="text-slate-400">Miembro desde</dt>
            <dd className="font-semibold text-white">
              {user?.creado ? new Date(user.creado).toLocaleDateString('es-CO', { dateStyle: 'medium' }) : '—'}
            </dd>
          </div>
          <div className="flex items-center justify-between rounded-xl bg-night-800 px-4 py-2.5 ring-1 ring-white/5">
            <dt className="text-slate-400">Versión</dt>
            <dd className="font-semibold text-white">v1.0.0 · Build 2026.08</dd>
          </div>
        </dl>
      </Section>
    </div>
  )
}

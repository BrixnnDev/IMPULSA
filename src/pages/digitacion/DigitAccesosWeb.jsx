import { useEffect, useState } from 'react'
import { io } from 'socket.io-client'
import {
  FiGlobe, FiPlus, FiX, FiTrash2, FiExternalLink, FiSearch,
  FiCopy, FiFolder, FiArrowLeft,
} from 'react-icons/fi'
import { useAuth } from '../../context/AuthContext'

const API = import.meta.env.VITE_API_URL || 'http://localhost:8787'

function hostDe(url) {
  try { return new URL(url.includes('://') ? url : `https://${url}`).hostname } catch { return '' }
}
function faviconDe(url) {
  const h = hostDe(url)
  return h ? `https://www.google.com/s2/favicons?domain=${h}&sz=64` : ''
}
function nombreAutoDe(url) {
  const h = hostDe(url).replace(/^www\./i, '')
  if (!h) return ''
  const parts = h.split('.')
  const base = parts.length >= 2 ? parts[parts.length - 2] : parts[0]
  return base.charAt(0).toUpperCase() + base.slice(1)
}

export default function DigitAccesosWeb() {
  const { user } = useAuth()
  const userId = 'global'

  const [carpetas, setCarpetas] = useState([])
  const [accesos, setAccesos] = useState([])
  const [carpetaAbierta, setCarpetaAbierta] = useState(null) // objeto carpeta

  // modals
  const [modalCarpeta, setModalCarpeta] = useState(false)
  const [nombreCarpeta, setNombreCarpeta] = useState('')
  const [modalAcceso, setModalAcceso] = useState(false)
  const [formUrl, setFormUrl] = useState('')
  const [formNombre, setFormNombre] = useState('')
  const [formCarpetaId, setFormCarpetaId] = useState('')
  const [confirmarElimCarp, setConfirmarElimCarp] = useState(null)
  const [confirmarElimAcc, setConfirmarElimAcc] = useState(null)

  const [busqueda, setBusqueda] = useState('')
  const [copiado, setCopiado] = useState('')
  const [error, setError] = useState('')

  // ── Cargar ────────────────────────────────────────────────
  const cargarCarpetas = async () => {
    try {
      const r = await fetch(`${API}/api/web/carpetas?user_id=${userId}`)
      const d = await r.json()
      setCarpetas(Array.isArray(d) ? d : [])
    } catch { /* silencioso */ }
  }

  const cargarAccesos = async () => {
    try {
      const r = await fetch(`${API}/api/web/accesos`)
      const d = await r.json()
      setAccesos(Array.isArray(d) ? d : [])
    } catch { /* silencioso */ }
  }

  useEffect(() => {
    cargarCarpetas()
    cargarAccesos()
    const s = io(API, { transports: ['websocket'], reconnectionAttempts: 5 })
    s.on('webcarpeta:new', cargarCarpetas)
    s.on('webcarpeta:removed', () => { cargarCarpetas(); cargarAccesos() })
    s.on('webacceso:new', cargarAccesos)
    s.on('webacceso:removed', cargarAccesos)
    const id = setInterval(() => { cargarCarpetas(); cargarAccesos() }, 5000)
    return () => { s.close(); clearInterval(id) }
  }, [])

  // ── Acciones carpetas ─────────────────────────────────────
  const crearCarpeta = async () => {
    const nombre = nombreCarpeta.trim()
    if (!nombre) return setError('Escribe un nombre.')
    try {
      const r = await fetch(`${API}/api/web/carpetas`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ nombre, user_id: userId }),
      })
      const d = await r.json()
      if (!r.ok || !d.ok) return setError(d.error || 'Error al crear.')
      setCarpetas((p) => [...p, d.carpeta])
      setNombreCarpeta('')
      setModalCarpeta(false)
      setError('')
    } catch { setError('Sin conexión.') }
  }

  const eliminarCarpeta = async () => {
    if (!confirmarElimCarp) return
    try {
      await fetch(`${API}/api/web/carpetas/${confirmarElimCarp.id}`, { method: 'DELETE' })
      setCarpetas((p) => p.filter((c) => c.id !== confirmarElimCarp.id))
      setAccesos((p) => p.filter((a) => a.carpeta_id !== confirmarElimCarp.id))
      if (carpetaAbierta?.id === confirmarElimCarp.id) setCarpetaAbierta(null)
      setConfirmarElimCarp(null)
    } catch { setError('No se pudo eliminar.') }
  }

  // ── Acciones accesos ──────────────────────────────────────
  const abrirModalAcceso = () => {
    if (carpetas.length === 0) return setError('Crea una carpeta primero antes de agregar páginas.')
    setFormUrl('')
    setFormNombre('')
    setFormCarpetaId(carpetaAbierta?.id || carpetas[0]?.id || '')
    setError('')
    setModalAcceso(true)
  }

  const agregarAcceso = async () => {
    const url = formUrl.trim()
    if (!url) return setError('Escribe una URL.')
    if (!formCarpetaId) return setError('Selecciona una carpeta.')
    try {
      const r = await fetch(`${API}/api/web/accesos`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          carpeta_id: formCarpetaId,
          url,
          nombre: formNombre.trim() || nombreAutoDe(url) || url,
          creado_por: user?.name || '',
        }),
      })
      const d = await r.json()
      if (!r.ok || !d.ok) return setError(d.error || 'Error al guardar.')
      setAccesos((p) => [d.acceso, ...p])
      setModalAcceso(false)
      setError('')
      // si hay carpeta abierta y se guardó en ella, quedamos ahí
      if (d.acceso.carpeta_id !== carpetaAbierta?.id && !carpetaAbierta) {
        setCarpetaAbierta(carpetas.find((c) => c.id === formCarpetaId) || null)
      }
    } catch { setError('Sin conexión.') }
  }

  const eliminarAcceso = async () => {
    if (!confirmarElimAcc) return
    try {
      await fetch(`${API}/api/web/accesos/${confirmarElimAcc.id}`, { method: 'DELETE' })
      setAccesos((p) => p.filter((a) => a.id !== confirmarElimAcc.id))
      setConfirmarElimAcc(null)
    } catch { setError('No se pudo eliminar.') }
  }

  const copiar = (texto, id) => {
    navigator.clipboard?.writeText(texto)
    setCopiado(id)
    setTimeout(() => setCopiado(''), 2000)
  }

  // ── Filtrado ──────────────────────────────────────────────
  const q = busqueda.trim().toLowerCase()
  const accesosDeAbierta = carpetaAbierta
    ? accesos.filter((a) => a.carpeta_id === carpetaAbierta.id)
    : []
  const accesosVisibles = q
    ? accesosDeAbierta.filter((a) => a.nombre.toLowerCase().includes(q) || a.url.toLowerCase().includes(q))
    : accesosDeAbierta

  // ── Render ─────────────────────────────────────────────────
  return (
    <div className="flex h-[calc(100dvh-7rem)] flex-col gap-4">

      {/* Encabezado */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          {carpetaAbierta && (
            <button
              onClick={() => { setCarpetaAbierta(null); setBusqueda('') }}
              className="flex h-9 w-9 items-center justify-center rounded-xl text-slate-400 transition hover:bg-white/10 hover:text-white"
              title="Volver a carpetas"
            >
              <FiArrowLeft size={18} />
            </button>
          )}
          <div>
            <h2 className="flex items-center gap-2.5 text-xl font-black text-white">
              <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-sky-600/15 text-sky-400 ring-1 ring-sky-500/30">
                {carpetaAbierta ? <FiFolder size={18} /> : <FiGlobe size={18} />}
              </span>
              {carpetaAbierta ? carpetaAbierta.nombre : 'Accesos Web'}
            </h2>
            <p className="mt-0.5 text-xs text-slate-400">
              {carpetaAbierta
                ? `${accesosDeAbierta.length} ${accesosDeAbierta.length === 1 ? 'página' : 'páginas'} guardadas`
                : `${carpetas.length} ${carpetas.length === 1 ? 'carpeta' : 'carpetas'}`}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {carpetaAbierta && (
            <div className="relative">
              <FiSearch size={14} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
              <input
                value={busqueda}
                onChange={(e) => setBusqueda(e.target.value)}
                placeholder="Buscar…"
                className="input-field !w-40 !py-2 !pl-9 !text-xs"
              />
            </div>
          )}
          {/* Botón crear carpeta — siempre visible */}
          <button
            onClick={() => { setNombreCarpeta(''); setError(''); setModalCarpeta(true) }}
            title="Crear carpeta"
            className="flex h-9 w-9 items-center justify-center rounded-xl border border-white/10 bg-white/5 text-slate-300 transition hover:bg-violet-600/20 hover:text-violet-300"
          >
            <FiFolder size={17} />
          </button>
          {/* Botón agregar página */}
          <button
            onClick={abrirModalAcceso}
            className="inline-flex items-center gap-2 rounded-lg bg-sky-600 px-4 py-2 text-xs font-bold text-white transition hover:bg-sky-500"
          >
            <FiPlus size={14} /> Agregar página
          </button>
        </div>
      </div>

      {error && (
        <p className="rounded-lg bg-red-500/10 px-4 py-2.5 text-xs font-semibold text-red-300 ring-1 ring-red-500/30">
          {error}
        </p>
      )}

      {/* ── Vista carpetas ─────────────────────────────────── */}
      {!carpetaAbierta && (
        <div className="min-h-0 flex-1 overflow-y-auto pb-2">
          {carpetas.length === 0 ? (
            <div className="panel flex flex-col items-center gap-3 p-10 text-center">
              <span className="flex h-14 w-14 items-center justify-center rounded-full bg-violet-500/10 text-violet-400 ring-1 ring-violet-500/30">
                <FiFolder size={26} />
              </span>
              <p className="text-sm font-semibold text-white">No hay carpetas todavía</p>
              <p className="max-w-xs text-xs text-slate-400">
                Haz clic en el ícono de carpeta para crear una y empezar a guardar tus páginas web.
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4 xl:grid-cols-5">
              {carpetas.map((c) => {
                const n = accesos.filter((a) => a.carpeta_id === c.id).length
                return (
                  <div key={c.id} className="group relative text-left">
                    <button onClick={() => setCarpetaAbierta(c)} className="w-full text-left">
                      <span className="relative mx-auto block h-2.5 w-14 rounded-t-md bg-night-700 ring-1 ring-white/10 transition group-hover:bg-sky-500/40" />
                      <span className="panel relative flex aspect-square flex-col items-center justify-center gap-2.5 p-3 text-center transition duration-300 group-hover:-translate-y-1 group-hover:border-sky-500/40">
                        <span className="absolute right-2 top-2 z-10 opacity-0 transition group-hover:opacity-100">
                          <button
                            onClick={(e) => { e.stopPropagation(); setConfirmarElimCarp(c) }}
                            title="Eliminar carpeta"
                            className="flex h-7 w-7 items-center justify-center rounded-lg bg-red-600/20 text-red-400 transition hover:bg-red-600 hover:text-white"
                          >
                            <FiTrash2 size={13} />
                          </button>
                        </span>
                        <span className="flex h-12 w-12 items-center justify-center rounded-xl bg-sky-600/15 text-sky-400 transition group-hover:scale-110">
                          <FiFolder size={22} />
                        </span>
                        <span className="block w-full truncate px-0.5 text-xs font-bold text-white sm:text-sm">{c.nombre}</span>
                        <span className="text-[11px] text-slate-500">{n} {n === 1 ? 'página' : 'páginas'}</span>
                      </span>
                    </button>
                  </div>
                )
              })}
            </div>
          )}
        </div>
      )}

      {/* ── Vista accesos dentro de carpeta ───────────────── */}
      {carpetaAbierta && (
        <div className="min-h-0 flex-1 space-y-2 overflow-y-auto pb-2">
          {accesosVisibles.length === 0 ? (
            <div className="panel flex flex-col items-center gap-3 p-10 text-center">
              <span className="flex h-14 w-14 items-center justify-center rounded-full bg-sky-500/10 text-sky-400 ring-1 ring-sky-500/30">
                <FiGlobe size={24} />
              </span>
              <p className="text-sm font-semibold text-white">
                {q ? 'Sin resultados para tu búsqueda.' : 'Esta carpeta está vacía.'}
              </p>
              {!q && (
                <p className="max-w-xs text-xs text-slate-400">
                  Presiona "Agregar página" para guardar una URL aquí.
                </p>
              )}
            </div>
          ) : (
            accesosVisibles.map((i) => (
              <div
                key={i.id}
                className="group flex items-center gap-3 rounded-xl border border-white/10 bg-night-900 p-4 transition hover:border-sky-500/40 hover:bg-white/[0.03]"
              >
                <a
                  href={i.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex min-w-0 flex-1 items-center gap-3"
                >
                  <span className="flex h-10 w-10 shrink-0 items-center justify-center overflow-hidden rounded-xl bg-white/5 ring-1 ring-white/10">
                    <img
                      src={faviconDe(i.url)}
                      alt=""
                      className="h-6 w-6 object-contain"
                      onError={(e) => { e.currentTarget.style.display = 'none' }}
                    />
                  </span>
                  <span className="min-w-0">
                    <span className="block truncate text-sm font-bold text-white">{i.nombre}</span>
                    <span className="block truncate text-xs text-slate-500">{hostDe(i.url)}</span>
                  </span>
                  <FiExternalLink size={14} className="ml-1 shrink-0 text-slate-500 opacity-0 transition group-hover:opacity-100" />
                </a>
                <div className="flex shrink-0 items-center gap-1">
                  {copiado === i.id && <span className="text-[10px] text-emerald-400">Copiado</span>}
                  <button
                    onClick={() => copiar(i.url, i.id)}
                    className="rounded-lg p-2 text-slate-400 transition hover:bg-white/10 hover:text-white"
                    title="Copiar URL"
                  >
                    <FiCopy size={15} />
                  </button>
                  <button
                    onClick={() => setConfirmarElimAcc(i)}
                    className="rounded-lg p-2 text-slate-500 transition hover:bg-red-600/15 hover:text-red-400"
                    title="Eliminar"
                  >
                    <FiTrash2 size={15} />
                  </button>
                </div>
              </div>
            ))
          )}
        </div>
      )}

      {/* ── Modal crear carpeta ────────────────────────────── */}
      {modalCarpeta && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4 backdrop-blur-sm" onClick={() => setModalCarpeta(false)}>
          <div className="w-full max-w-sm space-y-5 rounded-2xl border border-white/10 bg-night-850 p-6 shadow-2xl" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center gap-3 border-b border-white/5 pb-4">
              <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-violet-600/15 text-violet-400 ring-1 ring-violet-500/40">
                <FiFolder size={18} />
              </span>
              <div>
                <h3 className="font-bold text-white">Nueva carpeta</h3>
                <p className="text-xs text-slate-400">Organiza tus páginas web en carpetas.</p>
              </div>
              <button onClick={() => setModalCarpeta(false)} className="ml-auto rounded-xl p-2.5 text-slate-400 transition hover:bg-white/10 hover:text-white">
                <FiX size={16} />
              </button>
            </div>
            {error && <p className="rounded-lg bg-red-500/10 px-3 py-2 text-xs font-semibold text-red-300 ring-1 ring-red-500/30">{error}</p>}
            <div>
              <label className="label-form">Nombre de la carpeta *</label>
              <input
                autoFocus
                value={nombreCarpeta}
                onChange={(e) => setNombreCarpeta(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && crearCarpeta()}
                placeholder="ej. Redes Sociales"
                className="input-field"
              />
            </div>
            <div className="flex justify-end gap-3 border-t border-white/5 pt-4">
              <button onClick={() => setModalCarpeta(false)} className="btn-ghost !px-5 !py-2.5 !text-xs">Cancelar</button>
              <button onClick={crearCarpeta} className="inline-flex items-center gap-2 rounded-lg bg-violet-600 px-5 py-2.5 text-xs font-bold text-white transition hover:bg-violet-500">
                <FiFolder size={13} /> Crear carpeta
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── Modal agregar página ───────────────────────────── */}
      {modalAcceso && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4 backdrop-blur-sm" onClick={() => setModalAcceso(false)}>
          <div className="w-full max-w-md space-y-5 rounded-2xl border border-white/10 bg-night-850 p-6 shadow-2xl" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center gap-3 border-b border-white/5 pb-4">
              <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-sky-600/15 text-sky-400 ring-1 ring-sky-500/40">
                <FiPlus size={18} />
              </span>
              <div>
                <h3 className="font-bold text-white">Agregar página</h3>
                <p className="text-xs text-slate-400">Guarda una URL dentro de una carpeta.</p>
              </div>
              <button onClick={() => setModalAcceso(false)} className="ml-auto rounded-xl p-2.5 text-slate-400 transition hover:bg-white/10 hover:text-white">
                <FiX size={16} />
              </button>
            </div>
            {error && <p className="rounded-lg bg-red-500/10 px-3 py-2 text-xs font-semibold text-red-300 ring-1 ring-red-500/30">{error}</p>}
            <div className="space-y-4">
              <div>
                <label className="label-form">Carpeta *</label>
                <select
                  value={formCarpetaId}
                  onChange={(e) => setFormCarpetaId(e.target.value)}
                  className="input-field"
                >
                  {carpetas.map((c) => (
                    <option key={c.id} value={c.id}>{c.nombre}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="label-form">URL *</label>
                <input
                  autoFocus
                  value={formUrl}
                  onChange={(e) => { setFormUrl(e.target.value); if (!formNombre) setFormNombre(nombreAutoDe(e.target.value)) }}
                  placeholder="ej. https://youtube.com"
                  className="input-field"
                />
              </div>
              <div>
                <label className="label-form">Nombre</label>
                <input
                  value={formNombre}
                  onChange={(e) => setFormNombre(e.target.value)}
                  placeholder="se toma del sitio automáticamente"
                  className="input-field"
                />
              </div>
            </div>
            <div className="flex justify-end gap-3 border-t border-white/5 pt-4">
              <button onClick={() => setModalAcceso(false)} className="btn-ghost !px-5 !py-2.5 !text-xs">Cancelar</button>
              <button onClick={agregarAcceso} className="inline-flex items-center gap-2 rounded-lg bg-sky-600 px-5 py-2.5 text-xs font-bold text-white transition hover:bg-sky-500">
                <FiPlus size={14} /> Guardar
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── Modal confirmar eliminar carpeta ──────────────── */}
      {confirmarElimCarp && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4 backdrop-blur-sm" onClick={() => setConfirmarElimCarp(null)}>
          <div className="w-full max-w-sm space-y-5 rounded-2xl border border-white/10 bg-night-850 p-6 shadow-2xl" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center gap-3">
              <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-red-500/15 text-red-400 ring-1 ring-red-500/40"><FiTrash2 size={18} /></span>
              <div>
                <h3 className="font-bold text-white">¿Eliminar carpeta?</h3>
                <p className="text-xs text-slate-400">Se eliminarán también todas las páginas guardadas en "{confirmarElimCarp.nombre}".</p>
              </div>
            </div>
            <div className="flex justify-end gap-3 border-t border-white/5 pt-4">
              <button onClick={() => setConfirmarElimCarp(null)} className="btn-ghost !px-5 !py-2.5 !text-xs">Cancelar</button>
              <button onClick={eliminarCarpeta} className="inline-flex items-center gap-2 rounded-lg bg-red-600 px-5 py-2.5 text-xs font-bold text-white transition hover:bg-red-500">
                <FiTrash2 size={14} /> Eliminar
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── Modal confirmar eliminar acceso ───────────────── */}
      {confirmarElimAcc && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4 backdrop-blur-sm" onClick={() => setConfirmarElimAcc(null)}>
          <div className="w-full max-w-sm space-y-5 rounded-2xl border border-white/10 bg-night-850 p-6 shadow-2xl" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center gap-3">
              <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-red-500/15 text-red-400 ring-1 ring-red-500/40"><FiTrash2 size={18} /></span>
              <div>
                <h3 className="font-bold text-white">¿Eliminar página?</h3>
                <p className="truncate text-xs text-slate-400">{confirmarElimAcc.nombre}</p>
              </div>
            </div>
            <div className="flex justify-end gap-3 border-t border-white/5 pt-4">
              <button onClick={() => setConfirmarElimAcc(null)} className="btn-ghost !px-5 !py-2.5 !text-xs">Cancelar</button>
              <button onClick={eliminarAcceso} className="inline-flex items-center gap-2 rounded-lg bg-red-600 px-5 py-2.5 text-xs font-bold text-white transition hover:bg-red-500">
                <FiTrash2 size={14} /> Eliminar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

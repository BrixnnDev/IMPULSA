import { useEffect, useMemo, useState } from 'react'
import {
  FiGlobe, FiPlus, FiX, FiTrash2, FiInfo, FiExternalLink, FiSearch, FiCopy,
} from 'react-icons/fi'
import { useAuth } from '../../context/AuthContext'

const API = import.meta.env.VITE_API_URL || 'http://localhost:8787'
const CLAVE = 'accesos_web'

function hostDe(url) {
  try {
    return new URL(url.includes('://') ? url : `https://${url}`).hostname
  } catch {
    return ''
  }
}

function faviconDe(url) {
  const h = hostDe(url)
  return h ? `https://www.google.com/s2/favicons?domain=${h}&sz=64` : ''
}

export default function DigitAccesosWeb() {
  const { user } = useAuth()
  const [items, setItems] = useState([])
  const [cargando, setCargando] = useState(true)
  const [error, setError] = useState('')
  const [url, setUrl] = useState('')
  const [nombre, setNombre] = useState('')
  const [categoria, setCategoria] = useState('')
  const [busqueda, setBusqueda] = useState('')
  const [copiado, setCopiado] = useState('')
  const [infoItem, setInfoItem] = useState(null)

  const userId = user?.id || ''

  const cargar = async () => {
    if (!userId) return
    try {
      const res = await fetch(`${API}/api/settings/${userId}`)
      const data = await res.json()
      const raw = data && data[CLAVE]
      setItems(raw ? JSON.parse(raw) : [])
    } catch {
      setError('No se pudieron cargar los accesos web.')
    } finally {
      setCargando(false)
    }
  }

  useEffect(() => {
    cargar()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [userId])

  const guardar = async (nuevos) => {
    try {
      const res = await fetch(`${API}/api/settings/${userId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ clave: CLAVE, valor: JSON.stringify(nuevos) }),
      })
      if (res.ok) {
        setItems(nuevos)
        return true
      }
      setError('No se pudo guardar el cambio.')
      return false
    } catch {
      setError('Sin conexión con el servidor.')
      return false
    }
  }

  const autoNombre = () => (nombre.trim() ? nombre.trim() : hostDe(url) || 'Página web')

  const agregar = async () => {
    const u = url.trim()
    if (!u) return setError('Escribe una URL.')
    const nuevo = {
      id: `web-${Date.now()}`,
      url: u.includes('://') ? u : `https://${u}`,
      nombre: autoNombre(),
      categoria: categoria.trim() || 'General',
      creado: new Date().toISOString(),
    }
    const ok = await guardar([...items, nuevo])
    if (ok) {
      setUrl('')
      setNombre('')
      setCategoria('')
    }
  }

  const eliminar = async (id) => {
    if (!window.confirm('¿Eliminar este acceso web?')) return
    await guardar(items.filter((i) => i.id !== id))
  }

  const copiar = (texto, label) => {
    navigator.clipboard?.writeText(texto)
    setCopiado(label)
    setTimeout(() => setCopiado(''), 2000)
  }

  const q = busqueda.trim().toLowerCase()
  const visibles = q
    ? items.filter(
        (i) =>
          i.nombre.toLowerCase().includes(q) ||
          i.url.toLowerCase().includes(q) ||
          (i.categoria || '').toLowerCase().includes(q),
      )
    : items

  const agrupados = useMemo(() => {
    const map = {}
    visibles.forEach((i) => {
      const cat = i.categoria || 'General'
      if (!map[cat]) map[cat] = []
      map[cat].push(i)
    })
    return Object.entries(map).sort((a, b) => a[0].localeCompare(b[0]))
  }, [visibles])

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h2 className="flex items-center gap-2.5 text-2xl font-black text-white">
            <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-sky-600/15 text-sky-400 ring-1 ring-sky-500/30"><FiGlobe size={20} /></span>
            Accesos Web
          </h2>
          <p className="mt-1 text-sm text-slate-400">Guarda y organiza las páginas web que usas a diario.</p>
        </div>
        <div className="relative">
          <FiSearch size={15} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
          <input
            value={busqueda}
            onChange={(e) => setBusqueda(e.target.value)}
            placeholder="Buscar acceso…"
            className="input-field !w-56 !py-2.5 !pl-9 !text-xs"
          />
        </div>
      </div>

      {/* Formulario agregar */}
      <div className="panel space-y-4 p-5">
        <p className="text-xs font-semibold uppercase tracking-wider text-slate-400">Agregar acceso web</p>
        {error && <p className="rounded-lg bg-red-500/10 px-3 py-2 text-xs font-semibold text-red-300 ring-1 ring-red-500/30">{error}</p>}
        <div className="grid grid-cols-1 gap-3 md:grid-cols-4">
          <div className="md:col-span-2">
            <label className="label-form">URL</label>
            <input
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              onBlur={() => setNombre(hostDe(url))}
              placeholder="ej. https://ejemplo.com"
              className="input-field"
            />
          </div>
          <div>
            <label className="label-form">Nombre (opcional)</label>
            <input
              value={nombre}
              onChange={(e) => setNombre(e.target.value)}
              placeholder="ej. Portal del proveedor"
              className="input-field"
            />
          </div>
          <div>
            <label className="label-form">Categoría</label>
            <input
              value={categoria}
              onChange={(e) => setCategoria(e.target.value)}
              placeholder="ej. Trabajo"
              className="input-field"
            />
          </div>
        </div>
        <div className="flex justify-end">
          <button onClick={agregar} className="inline-flex items-center gap-2 rounded-lg bg-sky-600 px-5 py-2.5 text-xs font-bold text-white transition hover:bg-sky-500">
            <FiPlus size={14} /> Guardar acceso
          </button>
        </div>
      </div>

      {/* Lista */}
      {cargando ? (
        <div className="flex h-40 items-center justify-center">
          <p className="text-sm text-slate-400">Cargando accesos…</p>
        </div>
      ) : items.length === 0 ? (
        <div className="panel flex flex-col items-center gap-3 p-12 text-center">
          <span className="flex h-14 w-14 items-center justify-center rounded-full bg-sky-500/10 text-sky-400 ring-1 ring-sky-500/30"><FiGlobe size={24} /></span>
          <p className="text-sm font-semibold text-white">Aún no tienes accesos web</p>
          <p className="max-w-sm text-xs text-slate-400">Agrega una URL arriba para guardar una página web, su icono y categoría.</p>
        </div>
      ) : agrupados.length === 0 ? (
        <div className="panel flex flex-col items-center gap-3 p-12 text-center">
          <FiSearch size={28} className="text-slate-500" />
          <p className="text-sm text-slate-400">No hay resultados para tu búsqueda.</p>
        </div>
      ) : (
        agrupados.map(([cat, lista]) => (
          <div key={cat} className="space-y-3">
            <div className="flex items-center gap-2">
              <h3 className="text-sm font-bold uppercase tracking-wider text-slate-300">{cat}</h3>
              <span className="rounded-full bg-white/5 px-2 py-0.5 text-[10px] font-bold text-slate-400 ring-1 ring-white/10">{lista.length}</span>
            </div>
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
              {lista.map((i) => (
                <div
                  key={i.id}
                  className="group flex items-center gap-3 rounded-2xl border border-white/10 bg-night-900 p-4 transition hover:border-sky-500/40 hover:bg-white/[0.03]"
                >
                  <a
                    href={i.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex min-w-0 flex-1 items-center gap-3"
                    title={i.url}
                  >
                    <span className="flex h-11 w-11 shrink-0 items-center justify-center overflow-hidden rounded-xl bg-white/5 ring-1 ring-white/10">
                      <img src={faviconDe(i.url)} alt="" className="h-6 w-6 object-contain" onError={(e) => { e.currentTarget.style.display = 'none' }} />
                      {!faviconDe(i.url) && <FiGlobe size={18} className="text-sky-400" />}
                    </span>
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-semibold text-white">{i.nombre}</p>
                      <p className="truncate text-[11px] text-slate-500">{hostDe(i.url)}</p>
                    </div>
                    <FiExternalLink size={15} className="shrink-0 text-slate-500 opacity-0 transition group-hover:opacity-100" />
                  </a>
                  <div className="flex shrink-0 items-center gap-1">
                    <button
                      onClick={() => setInfoItem(i)}
                      className="rounded-lg p-1.5 text-slate-400 transition hover:bg-white/10 hover:text-white"
                      title="Información"
                    >
                      <FiInfo size={15} />
                    </button>
                    <button
                      onClick={() => copiar(i.url, i.id)}
                      className="rounded-lg p-1.5 text-slate-400 transition hover:bg-white/10 hover:text-white"
                      title="Copiar URL"
                    >
                      <FiCopy size={15} />
                    </button>
                    {copiado === i.id && <span className="text-[10px] text-emerald-400">Copiado</span>}
                    <button
                      onClick={() => eliminar(i.id)}
                      className="rounded-lg p-1.5 text-slate-500 transition hover:bg-red-600/15 hover:text-red-400"
                      title="Eliminar"
                    >
                      <FiTrash2 size={15} />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        ))
      )}

      {/* Modal información */}
      {infoItem && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4 backdrop-blur-sm" onClick={() => setInfoItem(null)}>
          <div className="w-full max-w-md space-y-5 rounded-2xl border border-white/10 bg-night-850 p-6 shadow-2xl" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center gap-3 border-b border-white/5 pb-4">
              <span className="flex h-11 w-11 shrink-0 items-center justify-center overflow-hidden rounded-xl bg-white/5 ring-1 ring-white/10">
                <img src={faviconDe(infoItem.url)} alt="" className="h-6 w-6 object-contain" onError={(e) => { e.currentTarget.style.display = 'none' }} />
              </span>
              <div className="min-w-0 flex-1">
                <h3 className="truncate font-bold text-white">{infoItem.nombre}</h3>
                <p className="truncate text-xs text-slate-400">{infoItem.url}</p>
              </div>
              <button onClick={() => setInfoItem(null)} className="rounded-xl p-2.5 text-slate-400 transition hover:bg-white/10 hover:text-white"><FiX size={16} /></button>
            </div>

            <dl className="space-y-2.5 text-sm">
              <div className="flex items-center justify-between rounded-xl bg-night-800 px-4 py-2.5 ring-1 ring-white/5">
                <dt className="text-slate-400">Categoría</dt>
                <dd className="font-semibold text-white">{infoItem.categoria || 'General'}</dd>
              </div>
              <div className="flex items-center justify-between rounded-xl bg-night-800 px-4 py-2.5 ring-1 ring-white/5">
                <dt className="text-slate-400">Dominio</dt>
                <dd className="font-semibold text-white">{hostDe(infoItem.url)}</dd>
              </div>
              <div className="flex items-center justify-between rounded-xl bg-night-800 px-4 py-2.5 ring-1 ring-white/5">
                <dt className="text-slate-400">Agregado</dt>
                <dd className="font-semibold text-white">{infoItem.creado ? new Date(infoItem.creado).toLocaleDateString('es-CO') : '—'}</dd>
              </div>
            </dl>

            <div className="flex justify-end gap-3 border-t border-white/5 pt-4">
              <button onClick={() => setInfoItem(null)} className="btn-ghost !px-5 !py-2.5 !text-xs">Cerrar</button>
              <a href={infoItem.url} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-2 rounded-lg bg-sky-600 px-5 py-2.5 text-xs font-bold text-white transition hover:bg-sky-500">
                <FiExternalLink size={14} /> Abrir página
              </a>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

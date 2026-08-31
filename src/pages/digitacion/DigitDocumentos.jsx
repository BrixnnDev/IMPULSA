import { useCallback, useEffect, useState } from 'react'
import { io } from 'socket.io-client'
import { FiFolder, FiPlus, FiX, FiFileText, FiSearch, FiClock, FiCheckCircle, FiEye, FiDownload, FiTrash2, FiFile, FiInfo } from 'react-icons/fi'
import { useAuth } from '../../context/AuthContext'

const API = import.meta.env.VITE_API_URL || 'http://localhost:8787'

const TIPO_STYLES = {
  PDF: 'bg-red-500/15 text-red-400',
  Word: 'bg-blue-500/15 text-blue-400',
  Excel: 'bg-emerald-500/15 text-emerald-400',
  PowerPoint: 'bg-orange-500/15 text-orange-400',
  Texto: 'bg-slate-500/15 text-slate-400',
  Programa: 'bg-fuchsia-500/15 text-fuchsia-400',
  Imagen: 'bg-pink-500/15 text-pink-400',
  Comprimido: 'bg-amber-500/15 text-amber-400',
  Multimedia: 'bg-cyan-500/15 text-cyan-400',
  Archivo: 'bg-slate-500/15 text-slate-400',
}

const ESTADO_STYLES = {
  Borrador: 'bg-amber-500/10 text-amber-400 ring-amber-500/30',
  Finalizado: 'bg-blue-600/10 text-blue-400 ring-blue-500/30',
  Firmado: 'bg-emerald-500/10 text-emerald-400 ring-emerald-500/30',
}

function formatearTamano(bytes = 0) {
  if (!bytes) return '0 KB'
  if (bytes < 1024) return `${bytes} B`
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(0)} KB`
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
}

export default function DigitDocumentos() {
  const { isAdmin, user } = useAuth()
  const [carpetas, setCarpetas] = useState([])
  const [documentos, setDocumentos] = useState([])
  const [busqueda, setBusqueda] = useState('')
  const [mostrarNueva, setMostrarNueva] = useState(false)
  const [nombreNueva, setNombreNueva] = useState('')
  const [abierta, setAbierta] = useState(null)
  const [mostrarForm, setMostrarForm] = useState(false)
  const [form, setForm] = useState({ nombre: '', subidoPor: user?.name || '', carpeta: '' })
  const [archivo, setArchivo] = useState(null)
  const [verPdf, setVerPdf] = useState(null)
  const [subiendo, setSubiendo] = useState(false)
  const [error, setError] = useState('')
  const [eliminarCarpetaNombre, setEliminarCarpetaNombre] = useState(null)
  const [infoCarpeta, setInfoCarpeta] = useState(null)

  const cargar = useCallback(async () => {
    try {
      const [carp, docs] = await Promise.all([
        fetch(`${API}/api/documents/carpetas`).then((r) => r.json()),
        fetch(`${API}/api/documents/list`).then((r) => r.json()),
      ])
      setCarpetas(Array.isArray(carp) ? carp.map((c) => ({ id: c.id, nombre: c.nombre, creado_por: c.creado_por, fecha: c.fecha })) : [])
      setDocumentos(Array.isArray(docs) ? docs : [])
    } catch {
      setError('No se pudo cargar los documentos.')
    }
  }, [])

  useEffect(() => {
    cargar()
    const id = setInterval(cargar, 500)
    const s = io(API, { transports: ['websocket'], reconnectionAttempts: 5 })
    s.on('connect', cargar)
    s.on('doc:new', cargar)
    s.on('doc:carpeta', cargar)
    s.on('doc:removed', cargar)
    return () => { s.close(); clearInterval(id) }
  }, [cargar])

  const q = busqueda.trim().toLowerCase()
  const todasDocs = q
    ? documentos.filter(
        (d) =>
          d.nombre.toLowerCase().includes(q) ||
          (d.tipo || '').toLowerCase().includes(q) ||
          (d.carpeta || '').toLowerCase().includes(q) ||
          (d.subido_por || '').toLowerCase().includes(q),
      )
    : documentos

  const crearCarpeta = async () => {
    const nombre = nombreNueva.trim()
    if (!nombre || carpetas.some((c) => c.nombre.toLowerCase() === nombre.toLowerCase())) return
    try {
      const res = await fetch(`${API}/api/documents/carpetas`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ nombre, creado_por: user?.name || '' }),
      })
      const data = await res.json()
      setCarpetas([...carpetas, { id: data.id, nombre }])
      setNombreNueva('')
      setMostrarNueva(false)
    } catch {
      setError('No se pudo crear la carpeta.')
    }
  }

  const eliminarCarpeta = (c) => setEliminarCarpetaNombre(c)

  const confirmarEliminarCarpeta = async () => {
    const c = eliminarCarpetaNombre
    if (!c?.id) return
    try {
      await fetch(`${API}/api/documents/carpetas/${c.id}`, { method: 'DELETE' })
      setCarpetas((prev) => prev.filter((x) => x.id !== c.id))
    } catch {
      setError('No se pudo eliminar la carpeta.')
    }
    setEliminarCarpetaNombre(null)
    cargar()
  }

  const abrirCarpeta = (c) => setAbierta(c)

  const descargarDoc = (d) => {
    const a = document.createElement('a')
    a.href = `${API}/api/documents/file/${encodeURIComponent(d.ruta)}`
    a.download = d.nombre
    a.click()
  }

  const verArchivo = (d) => {
    window.open(`${API}/api/documents/file/${encodeURIComponent(d.ruta)}`, '_blank')
  }

  const eliminarDoc = async (d) => {
    if (!window.confirm(`¿Eliminar el documento "${d.nombre}"?`)) return
    try {
      await fetch(`${API}/api/documents/${d.id}`, { method: 'DELETE' })
      setDocumentos((prev) => prev.filter((x) => x.id !== d.id))
      if (verPdf?.id === d.id) setVerPdf(null)
    } catch {
      setError('No se pudo eliminar el documento.')
    }
  }

  const registrarDocumento = async (e) => {
    e.preventDefault()
    const nombre = form.nombre.trim()
    const subidoPor = form.subidoPor.trim()
    if (!nombre || !form.carpeta) {
      setError('Completa el nombre y la carpeta.')
      return
    }
    if (!archivo) {
      setError('Adjunta un archivo.')
      return
    }
    setSubiendo(true)
    setError('')
    const fd = new FormData()
    fd.append('file', archivo)
    fd.append('nombre', nombre)
    fd.append('carpeta', form.carpeta)
    fd.append('subido_por', subidoPor)
    fd.append('user_id', user?.id || '')
    try {
      const r = await fetch(`${API}/api/documents/upload`, { method: 'POST', body: fd })
      const data = await r.json()
      if (!r.ok || !data.ok) throw new Error(data.error || 'Error al subir')
      setDocumentos((prev) => [data.doc, ...prev])
      setMostrarForm(false)
      setArchivo(null)
      setForm({ nombre: '', subidoPor: user?.name || '', carpeta: '' })
    } catch (err) {
      setError(err.message)
    } finally {
      setSubiendo(false)
    }
  }

  return (
    <div className="space-y-6">
      {/* Título + buscador + crear carpeta en la misma línea */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h2 className="flex items-center gap-2.5 text-2xl font-black text-white">
            <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-600/15 text-blue-400 ring-1 ring-blue-500/30">
              <FiFolder size={20} />
            </span>
            Documentos
          </h2>
          <p className="mt-1 text-sm text-slate-400">Gestiona los documentos del sistema.</p>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <div className="relative w-full min-w-[200px] sm:w-64">
            <FiSearch className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-slate-500" size={16} />
            <input
              value={busqueda}
              onChange={(e) => setBusqueda(e.target.value)}
              placeholder="Buscar documento o carpeta..."
              className="input-field !pl-11"
            />
          </div>
          {isAdmin && (
            <button onClick={() => setMostrarNueva(true)} className="btn-primary !px-4 !py-2.5 !text-xs">
              <FiPlus /> Crear carpeta
            </button>
          )}
          <button
            onClick={() => {
              setMostrarForm(true)
              setArchivo(null)
              setError('')
            }}
            className="btn-primary !px-4 !py-2.5 !text-xs"
          >
            <FiFileText /> Agregar documento
          </button>
        </div>
      </div>

      {error && (
        <div className="rounded-xl border border-red-500/30 bg-red-500/10 px-4 py-2.5 text-sm text-red-300">
          {error}
        </div>
      )}

      {/* Totales debajo del search */}
      <div className="grid grid-cols-3 gap-4">
        <div className="panel flex items-center gap-3 p-4">
          <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-blue-600/15 text-blue-400 ring-1 ring-blue-500/40">
            <FiFolder />
          </span>
          <div>
            <p className="text-[11px] font-semibold uppercase tracking-wider text-slate-400">Carpetas</p>
            <p className="text-xl font-black text-white">{carpetas.length}</p>
          </div>
        </div>
        <div className="panel flex items-center gap-3 p-4">
          <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-violet-500/15 text-violet-400 ring-1 ring-violet-500/40">
            <FiFileText />
          </span>
          <div>
            <p className="text-[11px] font-semibold uppercase tracking-wider text-slate-400">Documentos</p>
            <p className="text-xl font-black text-white">{documentos.length}</p>
          </div>
        </div>
        <div className="panel flex items-center gap-3 p-4">
          <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-emerald-500/15 text-emerald-400 ring-1 ring-emerald-500/40">
            <FiCheckCircle />
          </span>
          <div>
            <p className="text-[11px] font-semibold uppercase tracking-wider text-slate-400">Firmados</p>
            <p className="text-xl font-black text-emerald-400">{documentos.filter((d) => d.estado === 'Firmado').length}</p>
          </div>
        </div>
      </div>

      {/* Resultados de búsqueda (documentos en todas las carpetas) */}
      {q ? (
        <div className="panel overflow-hidden">
          <div className="flex items-center gap-2 border-b border-white/10 px-5 py-3">
            <FiSearch size={15} className="text-blue-400" />
            <h3 className="font-bold text-white">
              Resultados de búsqueda <span className="text-slate-500">({todasDocs.length})</span>
            </h3>
          </div>
          <ul className="divide-y divide-white/5">
            {todasDocs.map((d) => (
              <li key={d.id} className="flex items-center gap-4 px-5 py-3.5 transition hover:bg-white/[0.03]">
                <span className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-lg ${TIPO_STYLES[d.tipo]}`}>
                  <FiFile size={18} />
                </span>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-semibold text-white">{d.nombre}</p>
                  <p className="text-xs text-slate-500">
                    {d.tipo} · {d.carpeta || 'Sin carpeta'} ·{' '}
                    {new Date(d.fecha).toLocaleString('es-PE', { dateStyle: 'short', timeStyle: 'short' })}
                  </p>
                </div>
                <div className="flex shrink-0 items-center gap-1">
                  <button title="Ver" onClick={() => verArchivo(d)} className="rounded-lg p-2 text-slate-400 transition hover:bg-blue-600/15 hover:text-blue-400">
                    <FiEye size={16} />
                  </button>
                  <button title="Descargar" onClick={() => descargarDoc(d)} className="rounded-lg p-2 text-slate-400 transition hover:bg-emerald-600/15 hover:text-emerald-400">
                    <FiDownload size={16} />
                  </button>
                  <button title="Eliminar" onClick={() => eliminarDoc(d)} className="rounded-lg p-2 text-slate-400 transition hover:bg-red-600/15 hover:text-red-400">
                    <FiTrash2 size={16} />
                  </button>
                </div>
              </li>
            ))}
            {todasDocs.length === 0 && (
              <li className="px-6 py-10 text-center text-sm text-slate-500">Sin resultados para "{busqueda}."</li>
            )}
          </ul>
        </div>
      ) : (
        /* Carpetas cuadradas */
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4 xl:grid-cols-5">
          {carpetas.map((c) => {
            const n = documentos.filter((d) => d.carpeta === c.nombre).length
            return (
              <div key={c.id} className="group relative text-left">
                <button onClick={() => abrirCarpeta(c.nombre)} className="w-full text-left">
                  <span className="relative mx-auto block h-2.5 w-14 rounded-t-md bg-night-700 ring-1 ring-white/10 transition group-hover:bg-blue-500/40" />
                  <span className="panel relative flex aspect-square flex-col items-center justify-center gap-2.5 p-3 text-center transition duration-300 group-hover:-translate-y-1 group-hover:border-blue-500/40">
                    {isAdmin && (
                      <span className="absolute right-2 top-2 z-10 flex items-center gap-1 opacity-0 transition group-hover:opacity-100">
                        <button
                          onClick={(e) => { e.stopPropagation(); setInfoCarpeta(c) }}
                          title="Información de la carpeta"
                          className="flex h-7 w-7 items-center justify-center rounded-lg bg-white/5 text-slate-300 ring-1 ring-white/10 transition hover:bg-blue-600/20 hover:text-blue-300"
                        >
                          <FiInfo size={13} />
                        </button>
                        <button
                          onClick={(e) => { e.stopPropagation(); eliminarCarpeta(c) }}
                          title="Eliminar carpeta"
                          className="flex h-7 w-7 items-center justify-center rounded-lg bg-red-600/20 text-red-400 transition hover:bg-red-600 hover:text-white"
                        >
                          <FiTrash2 size={13} />
                        </button>
                      </span>
                    )}
                    <span className="flex h-12 w-12 items-center justify-center rounded-xl bg-blue-600/15 text-blue-400 transition group-hover:scale-110">
                      <FiFolder size={22} />
                    </span>
                    <span className="block w-full truncate px-0.5 text-xs font-bold text-white sm:text-sm">{c.nombre}</span>
                    <span className="text-[11px] text-slate-500">
                      {n} {n === 1 ? 'documento' : 'documentos'}
                    </span>
                  </span>
                </button>
              </div>
            )
          })}
          {carpetas.length === 0 && (
            <p className="col-span-full py-10 text-center text-sm text-slate-500">No hay carpetas todavía.</p>
          )}
        </div>
      )}

      {/* Flotante: agregar documento */}
      {mostrarForm && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4 backdrop-blur-sm"
          onClick={() => {
            setMostrarForm(false)
            setArchivo(null)
            setError('')
          }}
        >
          <form
            onSubmit={registrarDocumento}
            className="max-h-[90vh] w-full max-w-4xl space-y-5 overflow-y-auto rounded-2xl border border-white/10 bg-night-850 p-6 shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center gap-3 border-b border-white/5 pb-4">
              <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-600/15 text-blue-400 ring-1 ring-blue-500/40">
                <FiFileText size={18} />
              </span>
              <div>
                <h3 className="font-bold text-white">Agregar documento</h3>
                <p className="text-xs text-slate-400">Guarda el documento dentro de una carpeta.</p>
              </div>
              <button
                type="button"
                onClick={() => {
                  setMostrarForm(false)
                  setArchivo(null)
                  setError('')
                }}
                aria-label="Cerrar"
                className="ml-auto rounded-xl p-2.5 text-slate-400 transition hover:bg-white/10 hover:text-white"
              >
                <FiX size={16} />
              </button>
            </div>

            <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
              <div>
                <label className="label-form">Carpeta *</label>
                <select
                  value={form.carpeta}
                  onChange={(e) => setForm({ ...form, carpeta: e.target.value })}
                  className="input-field"
                >
                  <option value="">Selecciona…</option>
                  {carpetas.map((c) => (
                    <option key={c.id} value={c.nombre}>
                      {c.nombre}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="label-form">Nombre del documento *</label>
                <input
                  value={form.nombre}
                  onChange={(e) => setForm({ ...form, nombre: e.target.value })}
                  placeholder="Ej. HV — Juan Pérez"
                  className="input-field"
                />
              </div>
              <div>
                <label className="label-form">Persona que sube el documento *</label>
                <input
                  value={form.subidoPor}
                  onChange={(e) => setForm({ ...form, subidoPor: e.target.value })}
                  placeholder="Ej. María Victoria Rojas"
                  className="input-field"
                />
              </div>
            </div>

            <div>
              <label className="label-form">Documento</label>
              <label
                htmlFor="upload-doc"
                className={`flex cursor-pointer flex-col items-center justify-center gap-2 rounded-xl border-2 border-dashed px-4 py-8 text-center transition ${
                  archivo
                    ? 'border-emerald-500/50 bg-emerald-500/5'
                    : 'border-white/15 bg-night-800 hover:border-blue-500/50 hover:bg-white/[0.03]'
                }`}
              >
                <FiFileText size={24} className={archivo ? 'text-emerald-400' : 'text-slate-500'} />
                {archivo ? (
                  <>
                    <p className="truncate text-sm font-semibold text-emerald-300">{archivo.name}</p>
                    <p className="text-xs text-slate-500">{formatearTamano(archivo.size)} · clic para cambiar</p>
                  </>
                ) : (
                  <>
                    <p className="text-sm font-semibold text-slate-300">Haz clic para subir un documento</p>
                    <p className="text-xs text-slate-500">PDF, Word, Excel, PowerPoint, imágenes, programas y más</p>
                  </>
                )}
              </label>
              <input
                id="upload-doc"
                type="file"
                className="hidden"
                onChange={(e) => setArchivo(e.target.files?.[0] || null)}
              />
            </div>

            {error && <p className="text-sm text-red-300">{error}</p>}

            <div className="flex justify-end gap-3 border-t border-white/5 pt-4">
              <button
                type="button"
                onClick={() => {
                  setMostrarForm(false)
                  setArchivo(null)
                  setError('')
                }}
                className="btn-ghost !px-5 !py-2.5 !text-xs"
              >
                Cancelar
              </button>
              <button type="submit" disabled={subiendo} className="btn-primary !px-5 !py-2.5 !text-xs disabled:opacity-50">
                {subiendo ? 'Subiendo…' : 'Registrar documento'}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Flotante: nueva carpeta */}
      {mostrarNueva && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4 backdrop-blur-sm"
          onClick={() => {
            setMostrarNueva(false)
            setNombreNueva('')
          }}
        >
          <div
            className="w-full max-w-md space-y-5 rounded-2xl border border-white/10 bg-night-850 p-6 shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center gap-3 border-b border-white/5 pb-4">
              <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-600/15 text-blue-400 ring-1 ring-blue-500/40">
                <FiFolder size={18} />
              </span>
              <div>
                <h3 className="font-bold text-white">Crear carpeta</h3>
                <p className="text-xs text-slate-400">Organiza tus documentos en una nueva carpeta.</p>
              </div>
              <button
                onClick={() => {
                  setMostrarNueva(false)
                  setNombreNueva('')
                }}
                aria-label="Cerrar"
                className="ml-auto rounded-xl p-2.5 text-slate-400 transition hover:bg-white/10 hover:text-white"
              >
                <FiX size={16} />
              </button>
            </div>

            <div>
              <label className="label-form">Nombre de la carpeta *</label>
              <input
                autoFocus
                value={nombreNueva}
                onChange={(e) => setNombreNueva(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && crearCarpeta()}
                placeholder="Ej. Facturas"
                className="input-field"
              />
            </div>

            <div className="flex justify-end gap-3 border-t border-white/5 pt-4">
              <button
                onClick={() => {
                  setMostrarNueva(false)
                  setNombreNueva('')
                }}
                className="btn-ghost !px-5 !py-2.5 !text-xs"
              >
                Cancelar
              </button>
              <button onClick={crearCarpeta} className="btn-primary !px-5 !py-2.5 !text-xs">
                Crear carpeta
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Flotante: documentos de la carpeta */}
      {abierta && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4 backdrop-blur-sm"
          onClick={() => setAbierta(null)}
        >
          <div
            className="flex max-h-[80vh] w-full max-w-lg flex-col overflow-hidden rounded-2xl border border-white/10 bg-night-850 shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center gap-3 border-b border-white/10 px-5 py-4">
              <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-blue-600/15 text-blue-400 ring-1 ring-blue-500/30">
                <FiFolder size={18} />
              </span>
              <div className="min-w-0">
                <h3 className="truncate font-bold text-white">{abierta}</h3>
                <p className="text-xs text-slate-400">
                  {documentos.filter((d) => d.carpeta === abierta).length} documentos
                </p>
              </div>
              <button
                onClick={() => setAbierta(null)}
                aria-label="Cerrar"
                className="ml-auto rounded-xl p-2.5 text-slate-400 transition hover:bg-white/10 hover:text-white"
              >
                <FiX size={16} />
              </button>
            </div>

            <ul className="flex-1 divide-y divide-white/5 overflow-y-auto">
              {documentos
                .filter((d) => d.carpeta === abierta)
                .map((d) => (
                  <li key={d.id} className="flex items-center gap-4 px-5 py-4 transition hover:bg-white/[0.03]">
                    <span className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-lg ${TIPO_STYLES[d.tipo]}`}>
                      <FiFile size={18} />
                    </span>
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-semibold text-white">{d.nombre}</p>
                      <p className="text-xs text-slate-500">
                        {d.tipo} · {formatearTamano(d.tamano)} ·{' '}
                        {new Date(d.fecha).toLocaleString('es-PE', { dateStyle: 'short', timeStyle: 'short' })}
                        {d.subido_por && ` · Subió: ${d.subido_por}`}
                      </p>
                    </div>
                    <span className={`shrink-0 rounded-full px-3 py-1 text-xs font-semibold ring-1 ${ESTADO_STYLES[d.estado]}`}>
                      {d.estado !== 'Firmado' && <FiClock size={11} className="mr-1 inline" />}
                      {d.estado}
                    </span>
                    <div className="flex shrink-0 items-center gap-1">
                      <button
                        title="Ver documento"
                        onClick={() => verArchivo(d)}
                        className="rounded-lg p-2 text-slate-400 transition hover:bg-blue-600/15 hover:text-blue-400"
                      >
                        <FiEye size={16} />
                      </button>
                      <button
                        title="Descargar"
                        onClick={() => descargarDoc(d)}
                        className="rounded-lg p-2 text-slate-400 transition hover:bg-emerald-600/15 hover:text-emerald-400"
                      >
                        <FiDownload size={16} />
                      </button>
                      <button
                        title="Eliminar"
                        onClick={() => eliminarDoc(d)}
                        className="rounded-lg p-2 text-slate-400 transition hover:bg-red-600/15 hover:text-red-400"
                      >
                        <FiTrash2 size={16} />
                      </button>
                    </div>
                  </li>
                ))}
              {documentos.filter((d) => d.carpeta === abierta).length === 0 && (
                <li className="px-6 py-10 text-center text-sm text-slate-500">
                  Esta carpeta está vacía.
                  <button onClick={() => setAbierta(null)} className="mx-auto mt-2 block text-blue-400 hover:underline">
                    Agregar documento
                  </button>
                </li>
              )}
            </ul>
          </div>
        </div>
      )}

      {/* Visor de documento */}
      {verPdf && (
        <div
          className="fixed inset-0 z-[60] flex items-center justify-center bg-black/70 p-4 backdrop-blur-sm"
          onClick={() => setVerPdf(null)}
        >
          <div
            className="flex max-h-[92vh] w-full max-w-3xl flex-col overflow-hidden rounded-2xl border border-white/10 bg-night-850 shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center gap-3 border-b border-white/10 px-5 py-4">
              <span className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl ring-1 ${TIPO_STYLES[verPdf.tipo]}`}>
                <FiFileText size={18} />
              </span>
              <div className="min-w-0">
                <p className="truncate text-sm font-bold text-white">{verPdf.nombre}</p>
                <p className="text-xs text-slate-400">
                  {verPdf.id} · {verPdf.tipo} · {formatearTamano(verPdf.tamano)} · {verPdf.carpeta}
                  {verPdf.subido_por && ` · Subió: ${verPdf.subido_por}`}
                </p>
              </div>
              <div className="ml-auto flex items-center gap-2">
                <button
                  onClick={() => descargarDoc(verPdf)}
                  className="inline-flex items-center gap-1.5 rounded-xl bg-blue-600 px-3.5 py-2 text-xs font-bold text-white transition hover:bg-blue-500"
                >
                  <FiDownload size={14} /> Descargar
                </button>
                <button
                  onClick={() => setVerPdf(null)}
                  aria-label="Cerrar visor"
                  className="rounded-xl p-2.5 text-slate-400 transition hover:bg-white/10 hover:text-white"
                >
                  <FiX size={16} />
                </button>
              </div>
            </div>

            <iframe
              src={`${API}/api/documents/file/${encodeURIComponent(verPdf.ruta)}`}
              title={verPdf.nombre}
              className="h-[70vh] w-full bg-slate-200"
            />
          </div>
        </div>
      )}

      {/* Flotante: confirmar eliminación de carpeta */}
      {eliminarCarpetaNombre && (
        <div
          className="fixed inset-0 z-[60] flex items-center justify-center bg-black/70 p-4 backdrop-blur-sm"
          onClick={() => setEliminarCarpetaNombre(null)}
        >
          <div
            className="w-full max-w-md space-y-5 rounded-2xl border border-white/10 bg-night-850 p-6 shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center gap-3 border-b border-white/5 pb-4">
              <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-red-600/15 text-red-400 ring-1 ring-red-500/40">
                <FiTrash2 size={18} />
              </span>
              <div>
                <h3 className="font-bold text-white">Eliminar carpeta</h3>
                <p className="text-xs text-slate-400">Esta acción no se puede deshacer.</p>
              </div>
              <button
                onClick={() => setEliminarCarpetaNombre(null)}
                aria-label="Cerrar"
                className="ml-auto rounded-xl p-2.5 text-slate-400 transition hover:bg-white/10 hover:text-white"
              >
                <FiX size={16} />
              </button>
            </div>

            <p className="text-sm text-slate-300">
              ¿Seguro que quieres eliminar la carpeta{' '}
              <span className="font-bold text-white">"{eliminarCarpetaNombre?.nombre}"</span> y todos sus
              documentos?
            </p>

            <div className="flex justify-end gap-3 border-t border-white/5 pt-4">
              <button
                onClick={() => setEliminarCarpetaNombre(null)}
                className="btn-ghost !px-5 !py-2.5 !text-xs"
              >
                Cancelar
              </button>
              <button
                onClick={confirmarEliminarCarpeta}
                className="inline-flex items-center gap-2 rounded-lg bg-red-600 px-5 py-2.5 text-xs font-bold text-white transition hover:bg-red-500"
              >
                <FiTrash2 size={14} /> Sí, eliminar
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Flotante: información de la carpeta */}
      {infoCarpeta && (
        <div
          className="fixed inset-0 z-[60] flex items-center justify-center bg-black/70 p-4 backdrop-blur-sm"
          onClick={() => setInfoCarpeta(null)}
        >
          <div
            className="w-full max-w-md space-y-5 rounded-2xl border border-white/10 bg-night-850 p-6 shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center gap-3 border-b border-white/5 pb-4">
              <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-600/15 text-blue-400 ring-1 ring-blue-500/40">
                <FiFolder size={18} />
              </span>
              <div className="min-w-0">
                <h3 className="truncate font-bold text-white">{infoCarpeta.nombre}</h3>
                <p className="text-xs text-slate-400">Información de la carpeta</p>
              </div>
              <button
                onClick={() => setInfoCarpeta(null)}
                aria-label="Cerrar"
                className="ml-auto rounded-xl p-2.5 text-slate-400 transition hover:bg-white/10 hover:text-white"
              >
                <FiX size={16} />
              </button>
            </div>

            {(() => {
              const docs = documentos.filter((d) => d.carpeta === infoCarpeta.nombre)
              const totalTam = docs.reduce((a, d) => a + (d.tamano || 0), 0)
              return (
                <div className="space-y-3">
                  <div className="flex items-center justify-between rounded-xl border border-white/5 bg-black/30 px-4 py-3">
                    <span className="text-sm text-slate-400">Documentos</span>
                    <span className="font-bold text-white">{docs.length}</span>
                  </div>
                  <div className="flex items-center justify-between rounded-xl border border-white/5 bg-black/30 px-4 py-3">
                    <span className="text-sm text-slate-400">Tamaño total</span>
                    <span className="font-bold text-white">{formatearTamano(totalTam)}</span>
                  </div>
                  <div className="flex items-center justify-between rounded-xl border border-white/5 bg-black/30 px-4 py-3">
                    <span className="text-sm text-slate-400">Creada por</span>
                    <span className="text-sm font-semibold text-white">{infoCarpeta.creado_por || '—'}</span>
                  </div>
                  <div className="flex items-center justify-between rounded-xl border border-white/5 bg-black/30 px-4 py-3">
                    <span className="text-sm text-slate-400">Fecha</span>
                    <span className="text-sm font-semibold text-white">
                      {infoCarpeta.fecha ? new Date(infoCarpeta.fecha).toLocaleString('es-PE', { dateStyle: 'medium', timeStyle: 'short' }) : '—'}
                    </span>
                  </div>
                </div>
              )
            })()}

            <div className="flex justify-end border-t border-white/5 pt-4">
              <button onClick={() => setInfoCarpeta(null)} className="btn-primary !px-5 !py-2.5 !text-xs">
                Entendido
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

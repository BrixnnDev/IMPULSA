import { useState } from 'react'
import { FiFolder, FiPlus, FiX, FiFileText, FiSearch, FiClock, FiCheckCircle, FiEye, FiDownload } from 'react-icons/fi'

const TIPO_STYLES = {
  PDF: 'bg-red-500/15 text-red-400',
  Word: 'bg-blue-500/15 text-blue-400',
  Excel: 'bg-emerald-500/15 text-emerald-400',
  PowerPoint: 'bg-orange-500/15 text-orange-400',
  Texto: 'bg-slate-500/15 text-slate-400',
}

const ESTADO_STYLES = {
  Borrador: 'bg-amber-500/10 text-amber-400 ring-amber-500/30',
  Finalizado: 'bg-blue-600/10 text-blue-400 ring-blue-500/30',
  Firmado: 'bg-emerald-500/10 text-emerald-400 ring-emerald-500/30',
}

const seedDocumentos = [
  { id: 'DOC-0521', nombre: 'Contrato alquiler local', tipo: 'PDF', paginas: 4, fecha: new Date(Date.now() - 3600e3 * 6).toISOString(), estado: 'Firmado', carpeta: 'Contratos' },
  { id: 'DOC-0522', nombre: 'Inventario semanal', tipo: 'Excel', paginas: 1, fecha: new Date(Date.now() - 3600e3 * 2).toISOString(), estado: 'Borrador', carpeta: 'Reportes' },
  { id: 'DOC-0523', nombre: 'Carta recomendación — Ana Cárdenas', tipo: 'Word', paginas: 1, fecha: new Date().toISOString(), estado: 'Finalizado', carpeta: 'Hojas de vida' },
]

const CARPETAS_INICIALES = ['Hojas de vida', 'Contratos', 'Reportes']

export default function DigitDocumentos() {
  const [carpetas, setCarpetas] = useState(CARPETAS_INICIALES)
  const [documentos, setDocumentos] = useState(seedDocumentos)
  const [busqueda, setBusqueda] = useState('')
  const [mostrarNueva, setMostrarNueva] = useState(false)
  const [nombreNueva, setNombreNueva] = useState('')
  const [abierta, setAbierta] = useState(null)
  const [mostrarForm, setMostrarForm] = useState(false)
  const [form, setForm] = useState({ nombre: '', subidoPor: '', carpeta: '' })
  const [archivo, setArchivo] = useState(null)
  const [verPdf, setVerPdf] = useState(null)

  const q = busqueda.trim().toLowerCase()
  const filtradas = carpetas.filter((c) => c.toLowerCase().includes(q))

  const crearCarpeta = () => {
    const nombre = nombreNueva.trim()
    if (!nombre || carpetas.some((c) => c.toLowerCase() === nombre.toLowerCase())) return
    setCarpetas((prev) => [...prev, nombre])
    setNombreNueva('')
    setMostrarNueva(false)
  }

  const tipoDeArchivo = (name = '') => {
    const ext = name.toLowerCase().split('.').pop()
    if (ext === 'pdf') return 'PDF'
    if (ext === 'doc' || ext === 'docx') return 'Word'
    if (ext === 'xls' || ext === 'xlsx') return 'Excel'
    if (ext === 'ppt' || ext === 'pptx') return 'PowerPoint'
    return 'Texto'
  }

  const abrirCarpeta = (c) => setAbierta(c)

  const descargarDoc = (d) => {
    const contenido = [
      'STOCKFLOW — Documento',
      '===============================',
      `Código: ${d.id}`,
      `Nombre: ${d.nombre}`,
      `Tipo: ${d.tipo}`,
      `Carpeta: ${d.carpeta}`,
      `Páginas: ${d.paginas}`,
      d.subidoPor ? `Subido por: ${d.subidoPor}` : null,
      `Fecha: ${new Date(d.fecha).toLocaleString('es-PE')}`,
      `Estado: ${d.estado}`,
    ]
      .filter(Boolean)
      .join('\n')
    const blob = new Blob([contenido], { type: 'text/plain;charset=utf-8' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `${d.id}.txt`
    a.click()
    URL.revokeObjectURL(url)
  }

  const registrarDocumento = (e) => {
    e.preventDefault()
    const nombre = form.nombre.trim()
    const subidoPor = form.subidoPor.trim()
    if (!nombre || !subidoPor || !form.carpeta) return
    const doc = {
      id: `DOC-${524 + documentos.length}`,
      nombre,
      tipo: archivo ? tipoDeArchivo(archivo.name) : 'Texto',
      paginas: 1,
      fecha: new Date().toISOString(),
      estado: 'Borrador',
      carpeta: form.carpeta,
      subidoPor,
    }
    setDocumentos((prev) => [doc, ...prev])
    setMostrarForm(false)
    setArchivo(null)
    setForm({ nombre: '', subidoPor: '', carpeta: form.carpeta })
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
                placeholder="Buscar carpeta..."
                className="input-field !pl-11"
              />
            </div>
            <button onClick={() => setMostrarNueva(true)} className="btn-primary !px-4 !py-2.5 !text-xs">
              <FiPlus /> Crear carpeta
            </button>
            <button
              onClick={() => {
                setMostrarForm(true)
                setArchivo(null)
              }}
              className="btn-primary !px-4 !py-2.5 !text-xs"
            >
              <FiFileText /> Agregar documento
            </button>
          </div>
        </div>

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

      {/* Flotante: agregar documento */}
      {mostrarForm && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4 backdrop-blur-sm"
          onClick={() => {
            setMostrarForm(false)
            setArchivo(null)
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
                    <option key={c} value={c}>
                      {c}
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
                    <p className="text-xs text-slate-500">{(archivo.size / 1024).toFixed(0)} KB · clic para cambiar</p>
                  </>
                ) : (
                  <>
                    <p className="text-sm font-semibold text-slate-300">Haz clic para subir un documento</p>
                    <p className="text-xs text-slate-500">PDF, Word, Excel, PowerPoint o texto</p>
                  </>
                )}
              </label>
              <input
                id="upload-doc"
                type="file"
                accept=".pdf,.doc,.docx,.xls,.xlsx,.ppt,.pptx,.txt"
                className="hidden"
                onChange={(e) => setArchivo(e.target.files?.[0] || null)}
              />
            </div>

            <div className="flex justify-end gap-3 border-t border-white/5 pt-4">
              <button
                type="button"
                onClick={() => {
                  setMostrarForm(false)
                  setArchivo(null)
                }}
                className="btn-ghost !px-5 !py-2.5 !text-xs"
              >
                Cancelar
              </button>
              <button type="submit" className="btn-primary !px-5 !py-2.5 !text-xs">
                Registrar documento
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

      {/* Carpetas cuadradas */}
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4 xl:grid-cols-5">
        {filtradas.map((c) => {
          const n = documentos.filter((d) => d.carpeta === c).length
          return (
            <button key={c} onClick={() => abrirCarpeta(c)} className="group text-left">
              <span className="relative mx-auto block h-2.5 w-14 rounded-t-md bg-night-700 ring-1 ring-white/10 transition group-hover:bg-blue-500/40" />
              <span className="panel relative flex aspect-square flex-col items-center justify-center gap-2.5 p-3 text-center transition duration-300 group-hover:-translate-y-1 group-hover:border-blue-500/40">
                <span className="flex h-12 w-12 items-center justify-center rounded-xl bg-blue-600/15 text-blue-400 transition group-hover:scale-110">
                  <FiFolder size={22} />
                </span>
                <span className="block w-full truncate px-0.5 text-xs font-bold text-white sm:text-sm">{c}</span>
                <span className="text-[11px] text-slate-500">
                  {n} {n === 1 ? 'documento' : 'documentos'}
                </span>
              </span>
            </button>
          )
        })}
        {filtradas.length === 0 && (
          <p className="col-span-full py-10 text-center text-sm text-slate-500">No se encontraron carpetas.</p>
        )}
      </div>

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
                      <FiFileText size={18} />
                    </span>
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-semibold text-white">{d.nombre}</p>
                      <p className="text-xs text-slate-500">
                        {d.tipo} · {d.paginas} pág. ·{' '}
                        {new Date(d.fecha).toLocaleString('es-PE', { dateStyle: 'short', timeStyle: 'short' })}
                        {d.subidoPor && ` · Subió: ${d.subidoPor}`}
                      </p>
                    </div>
                    <span className={`shrink-0 rounded-full px-3 py-1 text-xs font-semibold ring-1 ${ESTADO_STYLES[d.estado]}`}>
                      {d.estado !== 'Firmado' && <FiClock size={11} className="mr-1 inline" />}
                      {d.estado}
                    </span>
                    <div className="flex shrink-0 items-center gap-1">
                      <button
                        title="Ver documento"
                        onClick={() => setVerPdf(d)}
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
                    </div>
                  </li>
                ))}
              {documentos.filter((d) => d.carpeta === abierta).length === 0 && (
                <li className="px-6 py-10 text-center text-sm text-slate-500">Esta carpeta está vacía.</li>
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
                  {verPdf.id} · {verPdf.tipo} · {verPdf.paginas} pág. · {verPdf.carpeta}
                  {verPdf.subidoPor && ` · Subió: ${verPdf.subidoPor}`}
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

            <div className="overflow-y-auto bg-slate-300/10 p-4 sm:p-8">
              <div className="mx-auto w-full max-w-[620px] rounded-md bg-white p-7 shadow-[0_20px_60px_-15px_rgba(0,0,0,0.6)] sm:p-10">
                <div className="flex items-start justify-between border-b-2 border-slate-800 pb-4">
                  <div>
                    <p className="font-serif text-xl font-black tracking-tight text-slate-900">STOCKFLOW</p>
                    <p className="mt-0.5 font-mono text-[10px] uppercase tracking-[0.25em] text-slate-500">
                      Documento digital
                    </p>
                  </div>
                  <div className="flex gap-[2px]">
                    {[38, 24, 30, 18, 26, 34].map((h, i) => (
                      <span key={i} className="w-[3px] bg-slate-900" style={{ height: `${h}px` }} />
                    ))}
                  </div>
                </div>

                <h3 className="mt-6 font-serif text-2xl font-bold text-slate-900">{verPdf.nombre}</h3>

                <dl className="mt-5 grid grid-cols-2 gap-x-8 gap-y-3 text-xs">
                  <div>
                    <dt className="font-mono uppercase tracking-wider text-slate-400">Código</dt>
                    <dd className="mt-0.5 font-semibold text-slate-800">{verPdf.id}</dd>
                  </div>
                  <div>
                    <dt className="font-mono uppercase tracking-wider text-slate-400">Carpeta</dt>
                    <dd className="mt-0.5 font-semibold text-slate-800">{verPdf.carpeta}</dd>
                  </div>
                  <div>
                    <dt className="font-mono uppercase tracking-wider text-slate-400">Subido por</dt>
                    <dd className="mt-0.5 font-semibold text-slate-800">{verPdf.subidoPor || '—'}</dd>
                  </div>
                  <div>
                    <dt className="font-mono uppercase tracking-wider text-slate-400">Estado</dt>
                    <dd
                      className={`mt-0.5 font-semibold ${
                        verPdf.estado === 'Firmado'
                          ? 'text-emerald-600'
                          : verPdf.estado === 'Finalizado'
                            ? 'text-blue-600'
                            : 'text-amber-600'
                      }`}
                    >
                      {verPdf.estado}
                    </dd>
                  </div>
                </dl>

                <div className="mt-7 space-y-2.5">
                  {[90, 97, 74, 93, 60, 86, 95, 70].map((w, i) => (
                    <div key={i} className="h-2 rounded-full bg-slate-200" style={{ width: `${w}%` }} />
                  ))}
                  <div className="grid grid-cols-2 gap-3 pt-1">
                    <div className="h-24 rounded-md border border-dashed border-slate-300 bg-slate-50" />
                    <div className="h-24 rounded-md border border-dashed border-slate-300 bg-slate-50" />
                  </div>
                  <div className="space-y-2.5 pt-2">
                    {[88, 96, 62].map((w, i) => (
                      <div key={i} className="h-2 rounded-full bg-slate-200" style={{ width: `${w}%` }} />
                    ))}
                  </div>
                </div>

                <div className="mt-8 flex items-end justify-between border-t border-slate-200 pt-5">
                  <div>
                    <span className="block h-9 w-36 border-b border-slate-400 font-serif text-lg italic text-slate-400">
                      firma
                    </span>
                    <p className="mt-1 text-[10px] uppercase tracking-widest text-slate-400">
                      {verPdf.subidoPor || 'StockFlow'}
                    </p>
                  </div>
                  <p className="font-mono text-[10px] text-slate-400">Página 1 de {verPdf.paginas}</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

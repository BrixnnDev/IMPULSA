import { useEffect, useState } from 'react'
import { io } from 'socket.io-client'
import {
  FiPrinter,
  FiFolder,
  FiCheckCircle,
  FiClock,
  FiFileText,
  FiSearch,
  FiPlus,
  FiX,
  FiList,
  FiEye,
  FiDownload,
  FiInfo,
  FiCopy,
  FiMonitor,
} from 'react-icons/fi'

const PCS = [
  { id: 'pc-01', etiqueta: 'PC-01', responsable: 'María Victoria Rojas' },
  { id: 'pc-02', etiqueta: 'PC-02', responsable: 'Carlos Andrés Peña' },
  { id: 'pc-03', etiqueta: 'PC-03', responsable: 'Luisa Martínez' },
  { id: 'pc-04', etiqueta: 'PC-04', responsable: 'Jorge Iván Ramírez' },
  { id: 'pc-05', etiqueta: 'PC-05', responsable: 'Ana Sofía Cárdenas' },
  { id: 'pc-06', etiqueta: 'PC-06', responsable: 'Pedro Pablo Salgado' },
  { id: 'pc-07', etiqueta: 'PC-07', responsable: 'Camila Torres' },
  { id: 'pc-08', etiqueta: 'PC-08', responsable: 'Andrés Felipe Gómez' },
  { id: 'pc-09', etiqueta: 'PC-09', responsable: 'Diana Carolina Ruiz' },
  { id: 'pc-10', etiqueta: 'PC-10', responsable: 'Julio César Pardo' },
  { id: 'pc-11', etiqueta: 'PC-11', responsable: 'Laura Jiménez' },
  { id: 'pc-12', etiqueta: 'PC-12', responsable: 'Óscar Mauricio Leal' },
  { id: 'pc-13', etiqueta: 'PC-13', responsable: 'Paola Andrea Nieto' },
  { id: 'pc-14', etiqueta: 'PC-14', responsable: 'Ricardo Samir Ospina' },
]

const DOCS = [
  'HV — Postulación banco.pdf',
  'Certificado laboral.pdf',
  'Trabajo universitario fase 2.docx',
  'Boletín de notas.pdf',
  'Solicitud de permiso.docx',
  'Factura servicio 1042.pdf',
  'Resumen ejecutivo.docx',
  'Afiche evento escolar.pdf',
]

function generarImpresiones(pc) {
  const i = Math.max(Number(pc.id.split('-')[1]) - 1 || 0, 0)
  const cantidad = ((i * 7) % 5) + 1
  const horaBase = 9 + (i % 6)
  return Array.from({ length: cantidad }, (_, k) => ({
    id: `PRN-${1000 + i * 10 + k}`,
    pc: pc.etiqueta,
    responsable: pc.responsable,
    documento: DOCS[(i + k * 3) % DOCS.length],
    copias: ((i + k) % 3) + 1,
    paginas: (((i + k) * 3) % 9) + 1,
    hora: `${horaBase + k}:${String(((i * 17 + k * 23) % 55)).padStart(2, '0')} a. m.`,
    estado: (i + k) % 4 === 0 ? 'Pendiente' : 'Impreso',
  }))
}

const TODAS_LAS_IMPRESIONES = PCS.flatMap((p) => [...generarImpresiones(p)].reverse())

function redDePc(p) {
  const i = Math.max(Number(p.id.split('-')[1]) - 1 || 0, 0)
  const hex = (n) => (n % 256).toString(16).padStart(2, '0').toUpperCase()
  return {
    ip: `192.168.1.${20 + i}`,
    mac: `A4:5E:60:${hex(i + 3)}:${hex(i * 11)}:${hex(i * 29 + 7)}`,
    sistema: 'Windows 11 Pro · x64',
    puesto: `Puesto ${String(i + 1).padStart(2, '0')} — Sede principal`,
  }
}

export default function DigitMovimientos() {
  const [pcs, setPcs] = useState(PCS)
  const [busqueda, setBusqueda] = useState('')
  const [mostrarNueva, setMostrarNueva] = useState(false)
  const [nombreNueva, setNombreNueva] = useState('')
  const [modal, setModal] = useState(null)
  const [prevModal, setPrevModal] = useState(null)
  const [verPdf, setVerPdf] = useState(null)
  const [info, setInfo] = useState(null)
  const [pcStatus, setPcStatus] = useState({})

  useEffect(() => {
    fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:8787'}/api/pc/status`)
      .then((r) => r.json())
      .then((list) => {
        const map = {}
        list.forEach((p) => { map[p.pc] = p.online })
        setPcStatus(map)
      })
      .catch(() => {})

    const s = io(import.meta.env.VITE_API_URL || 'http://localhost:8787', { transports: ['websocket'], reconnectionAttempts: 3 })
    s.on('pc:status', ({ pc, online }) => setPcStatus((prev) => ({ ...prev, [pc]: online })))
    return () => s.close()
  }, [])

  const copiar = (texto) => navigator.clipboard?.writeText(texto)

  const cerrarModal = () => {
    if (prevModal) {
      setModal(prevModal)
      setPrevModal(null)
    } else {
      setModal(null)
    }
  }

  const q = busqueda.trim().toLowerCase()
  const carpetasFiltradas = pcs.filter(
    (p) => p.responsable.toLowerCase().includes(q) || p.etiqueta.toLowerCase().includes(q),
  )

  // Totales globales de todas las carpetas
  const totalHoy = pcs.reduce((a, p) => a + generarImpresiones(p).length, 0)
  const totalPaginas = TODAS_LAS_IMPRESIONES.reduce((a, p) => a + p.paginas * p.copias, 0)
  const totalPendientes = TODAS_LAS_IMPRESIONES.filter((p) => p.estado === 'Pendiente').length

  const crearCarpeta = () => {
    const nombre = nombreNueva.trim()
    if (!nombre) return
    const numero = pcs.length + 1
    const nueva = { id: `pc-${numero}`, etiqueta: `PC-${String(numero).padStart(2, '0')}`, responsable: nombre }
    setPcs((prev) => [...prev, nueva])
    setNombreNueva('')
    setMostrarNueva(false)
  }

  const abrirCarpeta = (p, desdeModal = false) => {
    if (desdeModal && modal) setPrevModal(modal)
    setModal({
      titulo: p.responsable,
      etiqueta: p.etiqueta,
      mostrarPc: false,
      datos: [...generarImpresiones(p)].reverse(),
    })
  }

  const irACarpeta = (etiqueta) => {
    const p = pcs.find((x) => x.etiqueta === etiqueta)
    if (p) abrirCarpeta(p, true)
  }

  const descargarImpresion = (r) => {
    const contenido = [
      'STOCKFLOW — Registro de impresión',
      `Código: ${r.id}`,
      `Documento: ${r.documento}`,
      `Carpeta: ${r.responsable} (${r.pc})`,
      `Copias: ${r.copias} · Páginas c/u: ${r.paginas}`,
      `Hora: ${r.hora}`,
      `Estado: ${r.estado}`,
    ].join('\n')
    const blob = new Blob([contenido], { type: 'text/plain;charset=utf-8' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `${r.id}.txt`
    a.click()
    URL.revokeObjectURL(url)
  }

  return (
    <div className="space-y-6">
      {/* Título + buscador + botones en la misma línea */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h2 className="flex items-center gap-2.5 text-2xl font-black text-white">
            <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-600/15 text-blue-400 ring-1 ring-blue-500/30">
              <FiPrinter size={20} />
            </span>
            Historial de impresión
          </h2>
          <p className="mt-1 text-sm text-slate-400">
            Selecciona la carpeta de un computador para ver sus impresiones del día.
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-3">
          <div className="relative w-full min-w-[200px] sm:w-64">
            <FiSearch
              className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-slate-500"
              size={16}
            />
            <input
              value={busqueda}
              onChange={(e) => setBusqueda(e.target.value)}
              placeholder="Buscar carpeta por nombre o PC..."
              className="input-field !pl-11"
            />
          </div>
          <button
            onClick={() => setModal({ titulo: 'Historial de impresiones', mostrarPc: true, datos: TODAS_LAS_IMPRESIONES })}
            className="btn-primary !px-4 !py-2.5 !text-xs"
          >
            <FiList /> Historial
          </button>
          <button onClick={() => setMostrarNueva(true)} className="btn-primary !px-4 !py-2.5 !text-xs">
            <FiPlus /> Crear nueva carpeta
          </button>
        </div>
      </div>

      {/* Formulario nueva carpeta */}
      {mostrarNueva && (
        <div className="panel flex flex-wrap items-end gap-4 p-5">
          <div className="min-w-[220px] flex-1">
            <label className="label-form">Nombre del responsable *</label>
            <input
              autoFocus
              value={nombreNueva}
              onChange={(e) => setNombreNueva(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && crearCarpeta()}
              placeholder="Ej. María Victoria Rojas"
              className="input-field"
            />
          </div>
          <button onClick={crearCarpeta} className="btn-primary !px-5">
            Crear
          </button>
          <button
            onClick={() => {
              setMostrarNueva(false)
              setNombreNueva('')
            }}
            className="btn-ghost !px-5"
          >
            Cancelar
          </button>
        </div>
      )}

      {/* Totales globales de todas las carpetas */}
      <div className="grid grid-cols-3 gap-4">
        <div className="panel flex items-center gap-3 p-4">
          <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-blue-600/15 text-blue-400 ring-1 ring-blue-500/40">
            <FiPrinter />
          </span>
          <div>
            <p className="text-[11px] font-semibold uppercase tracking-wider text-slate-400">Páginas</p>
            <p className="text-xl font-black text-white">{totalPaginas}</p>
          </div>
        </div>
        <div className="panel flex items-center gap-3 p-4">
          <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-emerald-500/15 text-emerald-400 ring-1 ring-emerald-500/40">
            <FiFileText />
          </span>
          <div>
            <p className="text-[11px] font-semibold uppercase tracking-wider text-slate-400">Hoy</p>
            <p className="text-xl font-black text-white">{totalHoy}</p>
          </div>
        </div>
        <div className="panel flex items-center gap-3 p-4">
          <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-amber-500/15 text-amber-400 ring-1 ring-amber-500/40">
            <FiClock />
          </span>
          <div>
            <p className="text-[11px] font-semibold uppercase tracking-wider text-slate-400">Pendientes</p>
            <p className="text-xl font-black text-amber-400">{totalPendientes}</p>
          </div>
        </div>
      </div>

      {/* Carpetas cuadradas: 5 por fila */}
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4 xl:grid-cols-5">
        {carpetasFiltradas.map((p) => {
          const imp = generarImpresiones(p)
          const paginas = imp.reduce((a, x) => a + x.paginas * x.copias, 0)
          const pend = imp.filter((x) => x.estado === 'Pendiente').length
          return (
            <button key={p.id} onClick={() => abrirCarpeta(p)} className="group text-left">
              <span className="relative mx-auto block h-2.5 w-14 rounded-t-md bg-night-700 ring-1 ring-white/10 transition group-hover:bg-blue-500/40" />
              <span className="panel relative flex aspect-square flex-col items-center justify-center gap-2 p-3 text-center transition duration-300 group-hover:-translate-y-1 group-hover:border-blue-500/40">
                <span
                  role="button"
                  tabIndex={0}
                  title="Información del equipo"
                  aria-label={`Información de ${p.etiqueta}`}
                  onClick={(e) => {
                    e.stopPropagation()
                    setInfo(p)
                  }}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' || e.key === ' ') {
                      e.stopPropagation()
                      setInfo(p)
                    }
                  }}
                  className="absolute right-2 top-2 z-10 rounded-lg p-1.5 text-slate-600 transition hover:bg-blue-600/15 hover:text-blue-300"
                >
                  <FiInfo size={14} />
                </span>
                <span className="flex h-12 w-12 items-center justify-center rounded-xl bg-blue-600/15 text-blue-400 transition group-hover:scale-110">
                  <FiFolder size={22} />
                </span>
                <span className="block w-full truncate px-0.5 text-xs font-bold text-white sm:text-sm">{p.responsable}</span>
                <span className="text-[11px] text-slate-500">{p.etiqueta} · {imp.length} hoy</span>
                <span className="flex items-center gap-2 text-[10px] font-semibold">
                  {pcStatus[p.etiqueta] !== undefined && (
                    <span className={`flex items-center gap-1 ${pcStatus[p.etiqueta] ? 'text-emerald-400' : 'text-slate-500'}`}>
                      <span className={`h-1.5 w-1.5 rounded-full ${pcStatus[p.etiqueta] ? 'bg-emerald-400' : 'bg-slate-500'}`} />
                      {pcStatus[p.etiqueta] ? 'En línea' : 'Offline'}
                    </span>
                  )}
                  <span className="rounded-full bg-violet-500/10 px-2 py-0.5 text-violet-300 ring-1 ring-violet-500/25">
                    {paginas} pág.
                  </span>
                  <span className="rounded-full bg-amber-500/10 px-2 py-0.5 text-amber-300 ring-1 ring-amber-500/25">
                    {pend} pend.
                  </span>
                </span>
              </span>
            </button>
          )
        })}
        {carpetasFiltradas.length === 0 && (
          <p className="col-span-full py-10 text-center text-sm text-slate-500">No se encontraron carpetas.</p>
        )}
      </div>

      {/* Panel flotante: impresiones */}
      {modal && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4 backdrop-blur-sm"
          onClick={cerrarModal}
        >
          <div
            className="flex max-h-[85vh] w-full max-w-4xl flex-col overflow-hidden rounded-2xl border border-white/10 bg-night-850 shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center gap-3 border-b border-white/10 px-6 py-5">
              <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-blue-600/15 text-blue-400 ring-1 ring-blue-500/30">
                <FiFolder size={18} />
              </span>
              <div className="min-w-0">
                <h3 className="truncate font-bold text-white">
                  {modal.titulo}
                  {modal.etiqueta && ` · ${modal.etiqueta}`}
                </h3>
                <p className="text-xs text-slate-400">{modal.datos.length} registros hoy</p>
              </div>
              <button
                onClick={cerrarModal}
                aria-label="Cerrar"
                className="ml-auto rounded-xl p-2.5 text-slate-400 transition hover:bg-white/10 hover:text-white"
              >
                <FiX size={16} />
              </button>
            </div>
            <ul className="flex-1 divide-y divide-white/5 overflow-y-auto">
              {modal.datos.map((p) => (
                <li key={p.id} className="flex flex-wrap items-center gap-x-4 gap-y-2 px-6 py-4 transition hover:bg-white/[0.03]">
                  <button
                    onClick={() => irACarpeta(p.pc)}
                    title={`Ir a la carpeta de ${p.responsable}`}
                    aria-label={`Ir a la carpeta de ${p.responsable}`}
                    className="group/f relative flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-blue-600/15 text-blue-400 transition hover:bg-blue-600 hover:text-white"
                  >
                    <FiFolder size={16} />
                    <span className="pointer-events-none absolute left-full top-1/2 z-10 ml-2 -translate-y-1/2 whitespace-nowrap rounded-lg border border-white/10 bg-night-800 px-2.5 py-1 text-[11px] font-semibold text-white opacity-0 shadow-lg transition-opacity duration-150 group-hover/f:opacity-100">
                      {p.responsable} · {p.pc}
                    </span>
                  </button>
                  <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-violet-500/15 text-sm text-violet-400">
                    <FiFileText size={16} />
                  </span>
                  <div className="min-w-[180px] flex-1">
                    <p className="truncate text-sm font-semibold text-white">{p.documento}</p>
                    <p className="text-xs text-slate-500">
                      {p.copias} copia{p.copias > 1 ? 's' : ''} · {p.paginas} pág. c/u · {p.hora}
                    </p>
                  </div>
                  {p.estado === 'Impreso' ? (
                    <span className="shrink-0 rounded-full bg-emerald-500/15 px-3 py-1 text-xs font-semibold text-emerald-400 ring-1 ring-emerald-500/30">
                      <FiCheckCircle size={11} className="mr-1 inline" /> Impreso
                    </span>
                  ) : (
                    <span className="shrink-0 rounded-full bg-amber-500/15 px-3 py-1 text-xs font-semibold text-amber-400 ring-1 ring-amber-500/30">
                      Pendiente
                    </span>
                  )}
                  <div className="flex shrink-0 items-center gap-1">
                    <button
                      onClick={() => setVerPdf(p)}
                      title="Ver documento"
                      aria-label={`Ver ${p.documento}`}
                      className="rounded-lg p-2 text-slate-400 transition hover:bg-blue-600/15 hover:text-blue-300"
                    >
                      <FiEye size={15} />
                    </button>
                    <button
                      onClick={() => descargarImpresion(p)}
                      title="Descargar registro"
                      aria-label={`Descargar ${p.documento}`}
                      className="rounded-lg p-2 text-slate-400 transition hover:bg-blue-600/15 hover:text-blue-300"
                    >
                      <FiDownload size={15} />
                    </button>
                  </div>
                </li>
              ))}
              {modal.datos.length === 0 && (
                <li className="px-6 py-10 text-center text-sm text-slate-500">Sin impresiones registradas hoy.</li>
              )}
            </ul>
          </div>
        </div>
      )}

      {/* Visor de documento impreso */}
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
              <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-red-500/15 text-red-400 ring-1 ring-red-500/30">
                <FiFileText size={18} />
              </span>
              <div className="min-w-0">
                <p className="truncate text-sm font-bold text-white">{verPdf.documento}</p>
                <p className="text-xs text-slate-400">
                  {verPdf.id} · PDF · {verPdf.copias} copia{verPdf.copias > 1 ? 's' : ''} · {verPdf.paginas} pág.
                </p>
              </div>
              <div className="ml-auto flex items-center gap-2">
                <button
                  onClick={() => descargarImpresion(verPdf)}
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
                      Documento impreso
                    </p>
                  </div>
                  <div className="flex gap-[2px]">
                    {[38, 24, 30, 18, 26, 34].map((h, i) => (
                      <span key={i} className="w-[3px] bg-slate-900" style={{ height: `${h}px` }} />
                    ))}
                  </div>
                </div>

                <h3 className="mt-6 font-serif text-2xl font-bold text-slate-900">{verPdf.documento}</h3>

                <dl className="mt-5 grid grid-cols-2 gap-x-8 gap-y-3 text-xs">
                  <div>
                    <dt className="font-mono uppercase tracking-wider text-slate-400">Código</dt>
                    <dd className="mt-0.5 font-semibold text-slate-800">{verPdf.id}</dd>
                  </div>
                  <div>
                    <dt className="font-mono uppercase tracking-wider text-slate-400">Hora de impresión</dt>
                    <dd className="mt-0.5 font-semibold text-slate-800">{verPdf.hora}</dd>
                  </div>
                  <div>
                    <dt className="font-mono uppercase tracking-wider text-slate-400">Impreso por</dt>
                    <dd className="mt-0.5 font-semibold text-slate-800">{verPdf.responsable}</dd>
                  </div>
                  <div>
                    <dt className="font-mono uppercase tracking-wider text-slate-400">Estado</dt>
                    <dd className={`mt-0.5 font-semibold ${verPdf.estado === 'Impreso' ? 'text-emerald-600' : 'text-amber-600'}`}>
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
                    <p className="mt-1 text-[10px] uppercase tracking-widest text-slate-400">{verPdf.responsable}</p>
                  </div>
                  <p className="font-mono text-[10px] text-slate-400">Página 1 de {verPdf.paginas}</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
      {/* Flotante: información del equipo */}
      {info && (() => {
        const red = redDePc(info)
        const imp = generarImpresiones(info)
        const paginas = imp.reduce((a, x) => a + x.paginas * x.copias, 0)
        const pend = imp.filter((x) => x.estado === 'Pendiente').length
        return (
          <div
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4 backdrop-blur-sm"
            onClick={() => setInfo(null)}
          >
            <div
              className="w-full max-w-md overflow-hidden rounded-2xl border border-white/10 bg-night-850 shadow-2xl"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex items-center gap-3 border-b border-white/10 px-5 py-4">
                <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-blue-600/15 text-blue-400 ring-1 ring-blue-500/30">
                  <FiMonitor size={20} />
                </span>
                <div className="min-w-0">
                  <h3 className="truncate font-bold text-white">{info.responsable}</h3>
                  <p className="flex items-center gap-1.5 text-xs text-slate-400">
                    <span className="inline-block h-2 w-2 rounded-full bg-emerald-400" /> En línea · {info.etiqueta}
                  </p>
                </div>
                <button
                  onClick={() => setInfo(null)}
                  aria-label="Cerrar"
                  className="ml-auto rounded-xl p-2.5 text-slate-400 transition hover:bg-white/10 hover:text-white"
                >
                  <FiX size={16} />
                </button>
              </div>

              <div className="space-y-4 p-5">
                <dl className="space-y-2.5 text-sm">
                  {[
                    ['Dirección IP', red.ip],
                    ['Dirección MAC', red.mac],
                    ['Sistema', red.sistema],
                    ['Ubicación', red.puesto],
                  ].map(([k, v]) => (
                    <div key={k} className="flex items-center gap-3 rounded-xl bg-night-800 px-4 py-2.5 ring-1 ring-white/5">
                      <dt className="shrink-0 text-xs font-semibold uppercase tracking-wider text-slate-500">{k}</dt>
                      <dd className="ml-auto truncate font-mono text-xs font-bold text-slate-200">{v}</dd>
                      {(k === 'Dirección IP' || k === 'Dirección MAC') && (
                        <button
                          onClick={() => copiar(v)}
                          title={`Copiar ${k.toLowerCase()}`}
                          aria-label={`Copiar ${v}`}
                          className="shrink-0 rounded-lg p-1.5 text-slate-500 transition hover:bg-white/10 hover:text-blue-300"
                        >
                          <FiCopy size={13} />
                        </button>
                      )}
                    </div>
                  ))}
                </dl>

                <div className="grid grid-cols-3 gap-3">
                  <div className="rounded-xl bg-night-800 px-3 py-2.5 text-center ring-1 ring-white/5">
                    <p className="text-[10px] font-semibold uppercase tracking-wider text-slate-500">Hoy</p>
                    <p className="text-lg font-black text-white">{imp.length}</p>
                  </div>
                  <div className="rounded-xl bg-night-800 px-3 py-2.5 text-center ring-1 ring-white/5">
                    <p className="text-[10px] font-semibold uppercase tracking-wider text-slate-500">Páginas</p>
                    <p className="text-lg font-black text-violet-300">{paginas}</p>
                  </div>
                  <div className="rounded-xl bg-night-800 px-3 py-2.5 text-center ring-1 ring-white/5">
                    <p className="text-[10px] font-semibold uppercase tracking-wider text-slate-500">Pend.</p>
                    <p className="text-lg font-black text-amber-300">{pend}</p>
                  </div>
                </div>

                <button
                  onClick={() => {
                    setInfo(null)
                    abrirCarpeta(info)
                  }}
                  className="btn-primary w-full !py-2.5 !text-xs"
                >
                  <FiFolder /> Ver impresiones de esta carpeta
                </button>
              </div>
            </div>
          </div>
        )
      })()}

    </div>
  )
}

import { useEffect, useState } from 'react'
import { io } from 'socket.io-client'
import {
  FiPrinter, FiFolder, FiCheckCircle, FiClock, FiFileText, FiSearch, FiPlus, FiX,
  FiList, FiEye, FiDownload, FiInfo, FiCopy, FiMonitor, FiWifi, FiWifiOff, FiTrash2,
} from 'react-icons/fi'
import { useAuth } from '../../context/AuthContext'

const API = import.meta.env.VITE_API_URL || 'http://localhost:8787'

const DOCS = [
  'HV — Postulación banco.pdf', 'Certificado laboral.pdf', 'Trabajo universitario fase 2.docx',
  'Boletín de notas.pdf', 'Solicitud de permiso.docx', 'Factura servicio 1042.pdf',
  'Resumen ejecutivo.docx', 'Afiche evento escolar.pdf',
]

function generarImpresiones(pc, idx) {
  const i = idx ?? 0
  const cantidad = ((i * 7) % 5) + 1
  const horaBase = 9 + (i % 6)
  return Array.from({ length: cantidad }, (_, k) => ({
    id: `PRN-${1000 + i * 10 + k}`, pc: pc.etiqueta, responsable: pc.responsable,
    documento: DOCS[(i + k * 3) % DOCS.length], copias: ((i + k) % 3) + 1,
    paginas: (((i + k) * 3) % 9) + 1,
    hora: `${horaBase + k}:${String(((i * 17 + k * 23) % 55)).padStart(2, '0')} a. m.`,
    estado: (i + k) % 4 === 0 ? 'Pendiente' : 'Impreso',
  }))
}

export default function DigitMovimientos() {
  const { user, isAdmin } = useAuth()
  const [pcs, setPcs] = useState([])
  const [printsReales, setPrintsReales] = useState([])
  const [busqueda, setBusqueda] = useState('')
  const [modal, setModal] = useState(null)
  const [prevModal, setPrevModal] = useState(null)
  const [verPdf, setVerPdf] = useState(null)
  const [info, setInfo] = useState(null)
  const [pcStatus, setPcStatus] = useState({})
  const [formOpen, setFormOpen] = useState(false)
  const [nombreCarpeta, setNombreCarpeta] = useState('')
  const [codigoModal, setCodigoModal] = useState(null)
  const [eliminarId, setEliminarId] = useState(null)
  const [codigoEmparejamiento, setCodigoEmparejamiento] = useState({})
  const [emparejandoId, setEmparejandoId] = useState(null)

  useEffect(() => {
    fetch(`${API}/api/pc/list`).then((r) => r.json()).then((d) => { if (Array.isArray(d)) setPcs(d) }).catch(() => {})
    fetch(`${API}/api/pc/prints`).then((r) => r.json()).then((d) => { if (Array.isArray(d)) setPrintsReales(d) }).catch(() => {})
    const s = io(API, { transports: ['websocket'], reconnectionAttempts: 5 })
    s.on('pc:status', ({ pc, online }) => setPcStatus((prev) => ({ ...prev, [pc]: online })))
    s.on('pc:paired', () => {
      fetch(`${API}/api/pc/list`).then((r) => r.json()).then((d) => { if (Array.isArray(d)) setPcs(d) }).catch(() => {})
    })
    s.on('pc:print', (registro) => {
      setPrintsReales((prev) => [registro, ...prev])
    })
    s.on('pc:scan', () => {})
    return () => s.close()
  }, [])

  const copiar = (t) => navigator.clipboard?.writeText(t)
  const cerrarModal = () => { if (prevModal) { setModal(prevModal); setPrevModal(null) } else setModal(null) }

  const q = busqueda.trim().toLowerCase()
  const filtradas = pcs.filter((p) => p.responsable?.toLowerCase().includes(q) || p.etiqueta?.toLowerCase().includes(q))

  const todasImp = [...printsReales, ...pcs.flatMap((p, i) => [...generarImpresiones(p, i)].reverse())]
  const visibles = isAdmin ? todasImp : todasImp.filter((p) => p.responsable === user?.name)
  const totalPaginas = visibles.reduce((a, p) => a + (p.paginas || 1) * (p.copias || 1), 0)
  const totalPendientes = visibles.filter((p) => p.estado === 'Pendiente').length
  const totalHoy = todasImp.length

  // Crear carpeta: solo nombre
  const crearCarpeta = async () => {
    if (!nombreCarpeta.trim()) return
    try {
      const res = await fetch(`${API}/api/pc/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ nombre: nombreCarpeta.trim() }),
      })
      const data = await res.json()
      if (data.ok) {
        setPcs((prev) => [...prev, data.pc])
        setCodigoModal(data.pc)
        setFormOpen(false)
        setNombreCarpeta('')
      }
    } catch (e) {
      console.error('Error creando carpeta:', e)
    }
  }

  // Emparejar carpeta con código del script
  const emparejarCarpeta = async (pcId) => {
    const codigo = codigoEmparejamiento[pcId]
    if (!codigo?.trim()) return
    setEmparejandoId(pcId)
    try {
      const res = await fetch(`${API}/api/pc/pair`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ codigo: codigo.trim() }),
      })
      const data = await res.json()
      if (data.ok) {
        setPcs((prev) => prev.map((p) => p.id === pcId ? { ...p, emparejada: true, ip: data.pc.ip, mac: data.pc.mac, sistema: data.pc.sistema } : p))
        setCodigoEmparejamiento((prev) => ({ ...prev, [pcId]: '' }))
      }
    } catch (e) {
      console.error('Error emparejando:', e)
    }
    setEmparejandoId(null)
  }

  const eliminarPC = async (id) => {
    try { await fetch(`${API}/api/pc/${id}`, { method: 'DELETE' }); setPcs((prev) => prev.filter((p) => p.id !== id)); setEliminarId(null) } catch {}
  }

  const abrirCarpeta = (p, desdeModal = false) => {
    if (desdeModal && modal) setPrevModal(modal)
    const idx = pcs.indexOf(p)
    const reales = printsReales.filter((pr) => pr.pc === p.etiqueta)
    const simuladas = generarImpresiones(p, idx)
    setModal({ titulo: p.responsable, etiqueta: p.etiqueta, datos: [...reales, ...simuladas].reverse() })
  }

  const irACarpeta = (etiqueta) => { const p = pcs.find((x) => x.etiqueta === etiqueta); if (p) abrirCarpeta(p, true) }

  const descargarImpresion = (r) => {
    const txt = ['STOCKFLOW — Registro de impresión', `Código: ${r.id}`, `Documento: ${r.documento}`, `Carpeta: ${r.responsable} (${r.pc})`, `Copias: ${r.copias} · Páginas: ${r.paginas}`, `Hora: ${r.hora}`, `Estado: ${r.estado}`].join('\n')
    const a = document.createElement('a'); a.href = URL.createObjectURL(new Blob([txt], { type: 'text/plain' })); a.download = `${r.id}.txt`; a.click()
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h2 className="flex items-center gap-2.5 text-2xl font-black text-white">
            <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-600/15 text-blue-400 ring-1 ring-blue-500/30"><FiPrinter size={20} /></span>
            Historial de impresión
          </h2>
          <p className="mt-1 text-sm text-slate-400">{isAdmin ? 'Selecciona una carpeta para ver las impresiones.' : 'Selecciona una carpeta para ver tus impresiones.'}</p>
        </div>
        <div className="flex flex-wrap items-center gap-3">
          <div className="relative w-full min-w-[200px] sm:w-64">
            <FiSearch className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-slate-500" size={16} />
            <input value={busqueda} onChange={(e) => setBusqueda(e.target.value)} placeholder="Buscar por nombre..." className="input-field !pl-11" />
          </div>
          <button onClick={() => setModal({ titulo: isAdmin ? 'Historial de impresiones' : 'Mis impresiones', datos: visibles })} className="btn-primary !px-4 !py-2.5 !text-xs"><FiList /> Historial</button>
          {isAdmin && <button onClick={() => setFormOpen(true)} className="btn-primary !px-4 !py-2.5 !text-xs"><FiPlus /> Agregar PC</button>}
        </div>
      </div>

      <div className="grid grid-cols-3 gap-4">
        <div className="panel flex items-center gap-3 p-4"><span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-blue-600/15 text-blue-400 ring-1 ring-blue-500/40"><FiPrinter /></span><div><p className="text-[11px] font-semibold uppercase tracking-wider text-slate-400">Páginas</p><p className="text-xl font-black text-white">{totalPaginas}</p></div></div>
        <div className="panel flex items-center gap-3 p-4"><span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-emerald-500/15 text-emerald-400 ring-1 ring-emerald-500/40"><FiFileText /></span><div><p className="text-[11px] font-semibold uppercase tracking-wider text-slate-400">Hoy</p><p className="text-xl font-black text-white">{totalHoy}</p></div></div>
        <div className="panel flex items-center gap-3 p-4"><span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-amber-500/15 text-amber-400 ring-1 ring-amber-500/40"><FiClock /></span><div><p className="text-[11px] font-semibold uppercase tracking-wider text-slate-400">Pendientes</p><p className="text-xl font-black text-amber-400">{totalPendientes}</p></div></div>
      </div>

      {/* Carpetas */}
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4 xl:grid-cols-5">
        {filtradas.map((p) => {
          const idx = pcs.indexOf(p)
          const imp = generarImpresiones(p, idx)
          const paginas = imp.reduce((a, x) => a + x.paginas * x.copias, 0)
          const pend = imp.filter((x) => x.estado === 'Pendiente').length
          const online = p.emparejada && (pcStatus[p.etiqueta] !== undefined ? pcStatus[p.etiqueta] : p.online)
          return (
            <button key={p.id} onClick={() => p.emparejada && abrirCarpeta(p)} className={`group text-left ${p.emparejada ? 'cursor-pointer' : ''}`}>
              <span className="relative mx-auto block h-2.5 w-14 rounded-t-md bg-night-700 ring-1 ring-white/10 transition group-hover:bg-blue-500/40" />
              <span className="panel relative flex aspect-square flex-col items-center justify-center gap-2 p-3 text-center transition duration-300 group-hover:-translate-y-1 group-hover:border-blue-500/40">
                {isAdmin && (
                  <>
                    <span role="button" tabIndex={0} title="Info" onClick={(e) => { e.stopPropagation(); setInfo(p) }} className="absolute right-8 top-2 z-10 rounded-lg p-1.5 text-slate-600 transition hover:bg-blue-600/15 hover:text-blue-300"><FiInfo size={14} /></span>
                    <span role="button" tabIndex={0} title="Eliminar" onClick={(e) => { e.stopPropagation(); setEliminarId(p) }} className="absolute right-2 top-2 z-10 rounded-lg p-1.5 text-slate-600 transition hover:bg-red-600/15 hover:text-red-400"><FiTrash2 size={13} /></span>
                  </>
                )}
                <span className="flex h-12 w-12 items-center justify-center rounded-xl bg-blue-600/15 text-blue-400 transition group-hover:scale-110"><FiFolder size={22} /></span>
                <span className="block w-full truncate px-0.5 text-xs font-bold text-white sm:text-sm">{p.responsable}</span>
                <span className="text-[11px] text-slate-500">{p.etiqueta} · {imp.length} hoy</span>
                {p.emparejada ? (
                  <span className="flex items-center gap-2 text-[10px] font-semibold">
                    <span className={`flex items-center gap-1 ${online ? 'text-emerald-400' : 'text-slate-500'}`}>
                      {online ? <FiWifi size={11} /> : <FiWifiOff size={11} />}
                      {online ? 'En línea' : 'Offline'}
                    </span>
                    <span className="rounded-full bg-violet-500/10 px-2 py-0.5 text-violet-300 ring-1 ring-violet-500/25">{paginas} pág.</span>
                    <span className="rounded-full bg-amber-500/10 px-2 py-0.5 text-amber-300 ring-1 ring-amber-500/25">{pend} pend.</span>
                  </span>
                ) : (
                  <div className="mt-1 w-full space-y-1.5 px-1" onClick={(e) => e.stopPropagation()}>
                    <p className="text-[10px] text-amber-400 font-semibold">Sin emparejar — pega el código del script:</p>
                    <div className="flex gap-1">
                      <input
                        value={codigoEmparejamiento[p.id] || ''}
                        onChange={(e) => setCodigoEmparejamiento((prev) => ({ ...prev, [p.id]: e.target.value }))}
                        placeholder="Código"
                        className="input-field !py-1.5 !text-[11px] flex-1 text-center font-mono tracking-wider"
                        maxLength={8}
                      />
                      <button
                        onClick={(e) => { e.stopPropagation(); emparejarCarpeta(p.id) }}
                        disabled={!codigoEmparejamiento[p.id]?.trim() || emparejandoId === p.id}
                        className="rounded-lg bg-emerald-600 px-2.5 py-1.5 text-[10px] font-bold text-white transition hover:bg-emerald-500 disabled:opacity-40"
                      >
                        {emparejandoId === p.id ? '...' : 'Vincular'}
                      </button>
                    </div>
                  </div>
                )}
              </span>
            </button>
          )
        })}
        {filtradas.length === 0 && <p className="col-span-full py-10 text-center text-sm text-slate-500">{isAdmin ? 'No hay PCs. Agrega una con "Agregar PC".' : 'No se encontraron carpetas.'}</p>}
      </div>

      {/* Formulario flotante: crear carpeta (solo nombre) */}
      {formOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4 backdrop-blur-sm" onClick={() => setFormOpen(false)}>
          <div className="w-full max-w-md space-y-5 rounded-2xl border border-white/10 bg-night-850 p-6 shadow-2xl" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center gap-3 border-b border-white/5 pb-4">
              <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-600/15 text-blue-400 ring-1 ring-blue-500/40"><FiFolder size={18} /></span>
              <div><h3 className="font-bold text-white">Agregar PC</h3><p className="text-xs text-slate-400">Nombre de la PC o responsable.</p></div>
              <button onClick={() => setFormOpen(false)} className="ml-auto rounded-xl p-2.5 text-slate-400 transition hover:bg-white/10 hover:text-white"><FiX size={16} /></button>
            </div>
            <div>
              <label className="label-form">Nombre de la PC *</label>
              <input autoFocus value={nombreCarpeta} onChange={(e) => setNombreCarpeta(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && crearCarpeta()} placeholder="Ej. María Victoria" className="input-field" />
            </div>
            <div className="flex justify-end gap-3 border-t border-white/5 pt-4">
              <button onClick={() => setFormOpen(false)} className="btn-ghost !px-5 !py-2.5 !text-xs">Cancelar</button>
              <button onClick={crearCarpeta} className="btn-primary !px-5 !py-2.5 !text-xs"><FiPlus /> Agregar</button>
            </div>
          </div>
        </div>
      )}

      {/* Código de emparejamiento */}
      {codigoModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4 backdrop-blur-sm" onClick={() => setCodigoModal(null)}>
          <div className="w-full max-w-lg space-y-5 rounded-2xl border border-white/10 bg-night-850 p-6 shadow-2xl" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center gap-3 border-b border-white/5 pb-4">
              <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-500/15 text-emerald-400 ring-1 ring-emerald-500/40"><FiMonitor size={18} /></span>
              <div><h3 className="font-bold text-white">PC agregada: {codigoModal.etiqueta}</h3><p className="text-xs text-slate-400">Paso 2 — Emparejar la PC</p></div>
              <button onClick={() => setCodigoModal(null)} className="ml-auto rounded-xl p-2.5 text-slate-400 transition hover:bg-white/10 hover:text-white"><FiX size={16} /></button>
            </div>

            <div className="space-y-4">
              <div className="rounded-xl border border-white/5 bg-black/30 p-4">
                <p className="text-xs font-semibold text-slate-300">1. Abre CMD en la PC destino y ejecuta:</p>
                <div className="mt-2 flex items-center gap-2 rounded-lg bg-black/50 p-3">
                  <code className="flex-1 break-all font-mono text-xs text-emerald-400">curl -X POST http://localhost:8787/api/pc/register-from-script -H "Content-Type: application/json" -d {`'{"codigo":"${codigoModal.codigo}","pc":"${codigoModal.etiqueta}"}'`}</code>
                  <button onClick={() => copiar(`curl -X POST http://localhost:8787/api/pc/register-from-script -H "Content-Type: application/json" -d '{"codigo":"${codigoModal.codigo}","pc":"${codigoModal.etiqueta}"}'`)} className="shrink-0 rounded-lg p-2 text-slate-400 transition hover:bg-white/10 hover:text-white" title="Copiar"><FiCopy size={14} /></button>
                </div>
              </div>

              <div className="rounded-xl border border-white/5 bg-black/30 p-4">
                <p className="text-xs font-semibold text-slate-300">2. O copia este código y pégalo en el formulario de vinculación:</p>
                <div className="mt-3 flex items-center justify-center gap-3">
                  <span className="rounded-xl bg-black/40 px-6 py-4 font-mono text-3xl font-black tracking-widest text-emerald-400 ring-1 ring-emerald-500/30">{codigoModal.codigo}</span>
                  <button onClick={() => copiar(codigoModal.codigo)} className="rounded-xl p-3 text-slate-400 transition hover:bg-white/10 hover:text-white" title="Copiar código"><FiCopy size={20} /></button>
                </div>
              </div>

              <p className="text-center text-xs text-slate-500">Una vez emparejado, el script enviará heartbeat cada 30s automáticamente.</p>
            </div>

            <button onClick={() => setCodigoModal(null)} className="btn-primary w-full !py-2.5 !text-xs">Entendido</button>
          </div>
        </div>
      )}

      {/* Confirmar eliminación */}
      {eliminarId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4 backdrop-blur-sm" onClick={() => setEliminarId(null)}>
          <div className="w-full max-w-sm space-y-4 rounded-2xl border border-white/10 bg-night-850 p-6 shadow-2xl" onClick={(e) => e.stopPropagation()}>
            <h3 className="font-bold text-white">Eliminar {eliminarId.etiqueta}?</h3>
            <p className="text-sm text-slate-400">Se eliminará esta carpeta y todas sus impresiones.</p>
            <div className="flex justify-end gap-3">
              <button onClick={() => setEliminarId(null)} className="btn-ghost !px-5 !py-2.5 !text-xs">Cancelar</button>
              <button onClick={() => eliminarPC(eliminarId.id)} className="rounded-xl bg-red-600 px-5 py-2.5 text-xs font-bold text-white transition hover:bg-red-500"><FiTrash2 /> Eliminar</button>
            </div>
          </div>
        </div>
      )}

      {/* Panel impresiones */}
      {modal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4 backdrop-blur-sm" onClick={cerrarModal}>
          <div className="flex max-h-[85vh] w-full max-w-4xl flex-col overflow-hidden rounded-2xl border border-white/10 bg-night-850 shadow-2xl" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center gap-3 border-b border-white/10 px-6 py-5">
              <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-blue-600/15 text-blue-400 ring-1 ring-blue-500/30"><FiFolder size={18} /></span>
              <div className="min-w-0"><h3 className="truncate font-bold text-white">{modal.titulo}{modal.etiqueta && ` · ${modal.etiqueta}`}</h3><p className="text-xs text-slate-400">{modal.datos.length} registros hoy</p></div>
              <button onClick={cerrarModal} className="ml-auto rounded-xl p-2.5 text-slate-400 transition hover:bg-white/10 hover:text-white"><FiX size={16} /></button>
            </div>
            <ul className="flex-1 divide-y divide-white/5 overflow-y-auto">
              {modal.datos.map((p) => (
                <li key={p.id} className="flex flex-wrap items-center gap-x-4 gap-y-2 px-6 py-4 transition hover:bg-white/[0.03]">
                  <button onClick={() => irACarpeta(p.pc)} className="group/f relative flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-blue-600/15 text-blue-400 transition hover:bg-blue-600 hover:text-white">
                    <FiFolder size={16} />
                    <span className="pointer-events-none absolute left-full top-1/2 z-10 ml-2 -translate-y-1/2 whitespace-nowrap rounded-lg border border-white/10 bg-night-800 px-2.5 py-1 text-[11px] font-semibold text-white opacity-0 shadow-lg transition-opacity group-hover/f:opacity-100">{p.responsable}</span>
                  </button>
                  <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-violet-500/15 text-sm text-violet-400"><FiFileText size={16} /></span>
                  <div className="min-w-[180px] flex-1"><p className="truncate text-sm font-semibold text-white">{p.documento}</p><p className="text-xs text-slate-500">{p.copias} copia{p.copias > 1 ? 's' : ''} · {p.paginas} pág. c/u · {p.hora}</p></div>
                  {p.estado === 'Impreso' ? <span className="shrink-0 rounded-full bg-emerald-500/15 px-3 py-1 text-xs font-semibold text-emerald-400 ring-1 ring-emerald-500/30"><FiCheckCircle size={11} className="mr-1 inline" /> Impreso</span> : <span className="shrink-0 rounded-full bg-amber-500/15 px-3 py-1 text-xs font-semibold text-amber-400 ring-1 ring-amber-500/30">Pendiente</span>}
                  <div className="flex shrink-0 items-center gap-1">
                    <button onClick={() => setVerPdf(p)} className="rounded-lg p-2 text-slate-400 transition hover:bg-blue-600/15 hover:text-blue-300"><FiEye size={15} /></button>
                    <button onClick={() => descargarImpresion(p)} className="rounded-lg p-2 text-slate-400 transition hover:bg-blue-600/15 hover:text-blue-300"><FiDownload size={15} /></button>
                  </div>
                </li>
              ))}
              {modal.datos.length === 0 && <li className="px-6 py-10 text-center text-sm text-slate-500">Sin impresiones registradas hoy.</li>}
            </ul>
          </div>
        </div>
      )}

      {/* Visor documento */}
      {verPdf && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/70 p-4 backdrop-blur-sm" onClick={() => setVerPdf(null)}>
          <div className="flex max-h-[92vh] w-full max-w-3xl flex-col overflow-hidden rounded-2xl border border-white/10 bg-night-850 shadow-2xl" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center gap-3 border-b border-white/10 px-5 py-4">
              <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-red-500/15 text-red-400 ring-1 ring-red-500/30"><FiFileText size={18} /></span>
              <div className="min-w-0"><p className="truncate text-sm font-bold text-white">{verPdf.documento}</p><p className="text-xs text-slate-400">{verPdf.id} · {verPdf.copias} copias · {verPdf.paginas} pág.</p></div>
              <div className="ml-auto flex items-center gap-2">
                <button onClick={() => descargarImpresion(verPdf)} className="inline-flex items-center gap-1.5 rounded-xl bg-blue-600 px-3.5 py-2 text-xs font-bold text-white transition hover:bg-blue-500"><FiDownload size={14} /> Descargar</button>
                <button onClick={() => setVerPdf(null)} className="rounded-xl p-2.5 text-slate-400 transition hover:bg-white/10 hover:text-white"><FiX size={16} /></button>
              </div>
            </div>
            <div className="overflow-y-auto bg-slate-300/10 p-4 sm:p-8">
              <div className="mx-auto w-full max-w-[620px] rounded-md bg-white p-7 shadow-[0_20px_60px_-15px_rgba(0,0,0,0.6)] sm:p-10">
                <div className="flex items-start justify-between border-b-2 border-slate-800 pb-4">
                  <div><p className="font-serif text-xl font-black tracking-tight text-slate-900">STOCKFLOW</p><p className="mt-0.5 font-mono text-[10px] uppercase tracking-[0.25em] text-slate-500">Documento impreso</p></div>
                  <div className="flex gap-[2px]">{[38, 24, 30, 18, 26, 34].map((h, i) => <span key={i} className="w-[3px] bg-slate-900" style={{ height: `${h}px` }} />)}</div>
                </div>
                <h3 className="mt-6 font-serif text-2xl font-bold text-slate-900">{verPdf.documento}</h3>
                <dl className="mt-5 grid grid-cols-2 gap-x-8 gap-y-3 text-xs">
                  <div><dt className="font-mono uppercase tracking-wider text-slate-400">Código</dt><dd className="mt-0.5 font-semibold text-slate-800">{verPdf.id}</dd></div>
                  <div><dt className="font-mono uppercase tracking-wider text-slate-400">Hora</dt><dd className="mt-0.5 font-semibold text-slate-800">{verPdf.hora}</dd></div>
                  <div><dt className="font-mono uppercase tracking-wider text-slate-400">Impreso por</dt><dd className="mt-0.5 font-semibold text-slate-800">{verPdf.responsable}</dd></div>
                  <div><dt className="font-mono uppercase tracking-wider text-slate-400">Estado</dt><dd className={`mt-0.5 font-semibold ${verPdf.estado === 'Impreso' ? 'text-emerald-600' : 'text-amber-600'}`}>{verPdf.estado}</dd></div>
                </dl>
                <div className="mt-7 space-y-2.5">{[90, 97, 74, 93, 60, 86, 95, 70].map((w, i) => <div key={i} className="h-2 rounded-full bg-slate-200" style={{ width: `${w}%` }} />)}</div>
                <div className="mt-8 flex items-end justify-between border-t border-slate-200 pt-5">
                  <div><span className="block h-9 w-36 border-b border-slate-400 font-serif text-lg italic text-slate-400">firma</span><p className="mt-1 text-[10px] uppercase tracking-widest text-slate-400">{verPdf.responsable}</p></div>
                  <p className="font-mono text-[10px] text-slate-400">Página 1 de {verPdf.paginas}</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Info del PC (solo admin) — solo se muestra si tiene datos */}
      {info && isAdmin && (() => {
        const imp = generarImpresiones(info, pcs.indexOf(info))
        const paginas = imp.reduce((a, x) => a + x.paginas * x.copias, 0)
        const pend = imp.filter((x) => x.estado === 'Pendiente').length
        const online = info.emparejada && (pcStatus[info.etiqueta] !== undefined ? pcStatus[info.etiqueta] : info.online)
        return (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4 backdrop-blur-sm" onClick={() => setInfo(null)}>
            <div className="w-full max-w-md overflow-hidden rounded-2xl border border-white/10 bg-night-850 shadow-2xl" onClick={(e) => e.stopPropagation()}>
              <div className="flex items-center gap-3 border-b border-white/10 px-5 py-4">
                <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-blue-600/15 text-blue-400 ring-1 ring-blue-500/30"><FiMonitor size={20} /></span>
                <div className="min-w-0">
                  <h3 className="truncate font-bold text-white">{info.responsable}</h3>
                  <p className="flex items-center gap-1.5 text-xs text-slate-400">
                    <span className={`inline-block h-2 w-2 rounded-full ${online ? 'bg-emerald-400' : 'bg-slate-500'}`} />
                    {info.emparejada ? (online ? 'En línea' : 'Offline') : 'Sin emparejar'}
                  </p>
                </div>
                <button onClick={() => setInfo(null)} className="ml-auto rounded-xl p-2.5 text-slate-400 transition hover:bg-white/10 hover:text-white"><FiX size={16} /></button>
              </div>
              <div className="space-y-4 p-5">
                {info.emparejada ? (
                  <dl className="space-y-2.5 text-sm">
                    {info.ip && <div className="flex items-center gap-3 rounded-xl bg-night-800 px-4 py-2.5 ring-1 ring-white/5"><dt className="shrink-0 text-xs font-semibold uppercase tracking-wider text-slate-500">IP</dt><dd className="ml-auto truncate font-mono text-xs font-bold text-slate-200">{info.ip}</dd><button onClick={() => copiar(info.ip)} className="shrink-0 rounded-lg p-1.5 text-slate-500 transition hover:bg-white/10 hover:text-blue-300"><FiCopy size={13} /></button></div>}
                    {info.mac && <div className="flex items-center gap-3 rounded-xl bg-night-800 px-4 py-2.5 ring-1 ring-white/5"><dt className="shrink-0 text-xs font-semibold uppercase tracking-wider text-slate-500">MAC</dt><dd className="ml-auto truncate font-mono text-xs font-bold text-slate-200">{info.mac}</dd><button onClick={() => copiar(info.mac)} className="shrink-0 rounded-lg p-1.5 text-slate-500 transition hover:bg-white/10 hover:text-blue-300"><FiCopy size={13} /></button></div>}
                    {info.sistema && <div className="flex items-center gap-3 rounded-xl bg-night-800 px-4 py-2.5 ring-1 ring-white/5"><dt className="shrink-0 text-xs font-semibold uppercase tracking-wider text-slate-500">Sistema</dt><dd className="ml-auto truncate font-mono text-xs font-bold text-slate-200">{info.sistema}</dd></div>}
                    {info.ubicacion && <div className="flex items-center gap-3 rounded-xl bg-night-800 px-4 py-2.5 ring-1 ring-white/5"><dt className="shrink-0 text-xs font-semibold uppercase tracking-wider text-slate-500">Ubicación</dt><dd className="ml-auto truncate font-mono text-xs font-bold text-slate-200">{info.ubicacion}</dd></div>}
                    {!info.ip && !info.mac && !info.sistema && <p className="text-center text-sm text-slate-500">Esperando info del script...</p>}
                  </dl>
                ) : (
                  <div className="text-center">
                    <p className="text-sm text-slate-400">Código de emparejamiento:</p>
                    <div className="mt-3 flex items-center justify-center gap-2">
                      <span className="rounded-xl bg-black/30 px-5 py-3 font-mono text-2xl font-black tracking-widest text-amber-400 ring-1 ring-amber-500/30">{info.codigo}</span>
                      <button onClick={() => copiar(info.codigo)} className="rounded-xl p-2 text-slate-400 transition hover:bg-white/10 hover:text-white"><FiCopy size={18} /></button>
                    </div>
                    <p className="mt-3 text-xs text-slate-500">Ejecuta el script en la PC y pega este código.</p>
                  </div>
                )}
                <div className="grid grid-cols-3 gap-3">
                  <div className="rounded-xl bg-night-800 px-3 py-2.5 text-center ring-1 ring-white/5"><p className="text-[10px] font-semibold uppercase tracking-wider text-slate-500">Hoy</p><p className="text-lg font-black text-white">{imp.length}</p></div>
                  <div className="rounded-xl bg-night-800 px-3 py-2.5 text-center ring-1 ring-white/5"><p className="text-[10px] font-semibold uppercase tracking-wider text-slate-500">Páginas</p><p className="text-lg font-black text-violet-300">{paginas}</p></div>
                  <div className="rounded-xl bg-night-800 px-3 py-2.5 text-center ring-1 ring-white/5"><p className="text-[10px] font-semibold uppercase tracking-wider text-slate-500">Pend.</p><p className="text-lg font-black text-amber-300">{pend}</p></div>
                </div>
                <button onClick={() => { setInfo(null); abrirCarpeta(info) }} className="btn-primary w-full !py-2.5 !text-xs"><FiFolder /> Ver impresiones</button>
              </div>
            </div>
          </div>
        )
      })()}
    </div>
  )
}

import { useEffect, useState } from 'react'
import { io } from 'socket.io-client'
import {
  FiPrinter, FiFolder, FiCheckCircle, FiClock, FiFileText, FiSearch, FiX,
  FiList, FiEye, FiDownload, FiInfo, FiCopy, FiMonitor, FiWifi, FiWifiOff,
} from 'react-icons/fi'
import { useAuth } from '../../context/AuthContext'

const API = import.meta.env.VITE_API_URL || 'http://localhost:8787'

const esHoy = (p) => {
  if (!p?.fecha) return false
  const d = new Date(p.fecha)
  return !Number.isNaN(d.getTime()) && d.toDateString() === new Date().toDateString()
}

const fmtFecha = (p) => {
  const d = new Date(p?.fecha || Date.now())
  if (Number.isNaN(d.getTime())) return p?.hora || ''
  return d.toLocaleString('es', {
    day: '2-digit', month: '2-digit', year: 'numeric',
    hour: '2-digit', minute: '2-digit',
  })
}

const esDePc = (p, pc) => p?.pc === pc?.etiqueta || p?.pc === pc?.id || p?.pc === pc?.codigo

const esDelUsuario = (item, user) =>
  item?.usuario_id
    ? item.usuario_id === user?.id
    : item?.responsable === user?.name || item?.usuario === user?.name

export default function DigitMovimientos() {
  const { user, isAdmin } = useAuth()
  const [pcs, setPcs] = useState([])
  const [printsReales, setPrintsReales] = useState([])
  const [busqueda, setBusqueda] = useState('')
  const [modal, setModal] = useState(null)
  const [verPdf, setVerPdf] = useState(null)
  const [info, setInfo] = useState(null)
  const [pcStatus, setPcStatus] = useState({})

  useEffect(() => {
    const cargar = () => {
      fetch(`${API}/api/pc/list`).then((r) => r.json()).then((d) => { if (Array.isArray(d)) setPcs(d) }).catch(() => {})
      fetch(`${API}/api/pc/prints`).then((r) => r.json()).then((d) => {
        if (Array.isArray(d)) {
          setPrintsReales([...d].sort((a, b) => new Date(b.fecha || 0) - new Date(a.fecha || 0)))
        }
      }).catch(() => {})
    }
    cargar()
    const id = setInterval(cargar, 3000)
    const s = io(API, { transports: ['websocket'], reconnectionAttempts: 5 })
    s.on('pc:status', ({ pc, online }) => setPcStatus((prev) => ({ ...prev, [pc]: online })))
    s.on('pc:paired', cargar)
    s.on('pc:print', (registro) => {
      setPrintsReales((prev) => [registro, ...prev.filter((p) => p.id !== registro.id)])
    })
    return () => { s.close(); clearInterval(id) }
  }, [])

  const copiar = (t) => navigator.clipboard?.writeText(t)

  const q = busqueda.trim().toLowerCase()
  const ordenadas = [...printsReales].sort((a, b) => new Date(b.fecha || 0) - new Date(a.fecha || 0))
  const coincidentes = ordenadas.filter((p) =>
    `${p.documento || ''} ${p.responsable || ''} ${p.usuario || ''} ${p.pc || ''} ${p.impresora || ''}`
      .toLowerCase().includes(q),
  )
  const visibles = isAdmin
    ? coincidentes
    : coincidentes.filter((p) => esDelUsuario(p, user))

  const hoy = coincidentes.filter(esHoy)
  const totalPaginas = hoy.reduce((a, p) => a + (p.paginas || 1) * (p.copias || 1), 0)
  const totalMaquinas = new Set(coincidentes.map((p) => p.pc).filter(Boolean)).size

  const filtradas = pcs
    .filter((p) => isAdmin || esDelUsuario(p, user))
    .filter((p) => `${p.responsable || ''} ${p.etiqueta || ''}`.toLowerCase().includes(q))

  const abrirCarpeta = (pc) => {
    setModal({
      titulo: pc?.responsable || pc?.etiqueta || 'Impresiones',
      etiqueta: pc?.etiqueta,
      datos: coincidentes.filter((p) => esDePc(p, pc) && esHoy(p)),
    })
  }

  const abrirHistorial = () => setModal({
    titulo: 'Historial de impresiones',
    datos: coincidentes,
  })

  const descargarImpresion = (r) => {
    const txt = [
      'IMPULSA — Registro de impresión',
      `Código: ${r.id}`,
      `Documento: ${r.documento}`,
      `Carpeta: ${r.responsable || ''}`,
      `Impreso por: ${r.usuario || r.responsable || ''}`,
      `Máquina: ${r.pc || ''}`,
      `Impresora: ${r.impresora || 'No identificada'}`,
      `Copias: ${r.copias || 1} · Páginas: ${r.paginas || 1}`,
      `Fecha: ${fmtFecha(r)}`,
      `Estado: ${r.estado || 'Impreso'}`,
    ].join('\n')
    const a = document.createElement('a')
    a.href = URL.createObjectURL(new Blob([txt], { type: 'text/plain' }))
    a.download = `${r.id}.txt`
    a.click()
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h2 className="flex items-center gap-2.5 text-2xl font-black text-white">
            <span className="flex h-10 w-10 shrink-0 items-center justify-center overflow-hidden rounded-xl border border-blue-500/30 bg-blue-600/15 text-blue-400"><FiPrinter size={16} /></span>
            Historial de impresión
          </h2>
          <p className="mt-1 text-sm text-slate-400">
            Impresiones reales registradas por el agente de cada PC. Muestra documento, usuario, máquina, impresora y fecha.
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-3">
          <div className="relative w-full min-w-[200px] sm:w-64">
            <FiSearch className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-slate-500" size={16} />
            <input value={busqueda} onChange={(e) => setBusqueda(e.target.value)} placeholder="Buscar por nombre, PC o impresora..." className="input-field !pl-11 input-upper" />
          </div>
          <button onClick={abrirHistorial} className="btn-primary !px-4 !py-2.5 !text-xs"><FiList /> Historial</button>
        </div>
      </div>

      <div className="grid grid-cols-3 gap-4">
        <div className="panel flex items-center gap-3 p-4"><span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-blue-600/15 text-blue-400 ring-1 ring-blue-500/40"><FiPrinter /></span><div><p className="text-[11px] font-semibold uppercase tracking-wider text-slate-400">Páginas hoy</p><p className="text-xl font-black text-white">{totalPaginas}</p></div></div>
        <div className="panel flex items-center gap-3 p-4"><span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-emerald-500/15 text-emerald-400 ring-1 ring-emerald-500/40"><FiFileText /></span><div><p className="text-[11px] font-semibold uppercase tracking-wider text-slate-400">Impresiones hoy</p><p className="text-xl font-black text-white">{hoy.length}</p></div></div>
        <div className="panel flex items-center gap-3 p-4"><span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-violet-500/15 text-violet-400 ring-1 ring-violet-500/40"><FiMonitor /></span><div><p className="text-[11px] font-semibold uppercase tracking-wider text-slate-400">Máquinas</p><p className="text-xl font-black text-white">{totalMaquinas}</p></div></div>
      </div>

      {/* Carpetas = PCs / responsables */}
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4 xl:grid-cols-5">
        {filtradas.map((pc) => {
          const delPc = visibles.filter((p) => esDePc(p, pc))
          const hoyPc = delPc.filter(esHoy)
          const paginas = hoyPc.reduce((a, x) => a + (x.paginas || 1) * (x.copias || 1), 0)
          const online = pc.emparejada && (pcStatus[pc.etiqueta] !== undefined ? pcStatus[pc.etiqueta] : pc.online)
          return (
            <button key={pc.id} onClick={() => pc.emparejada && abrirCarpeta(pc)} className={`group text-left ${pc.emparejada ? 'cursor-pointer' : ''}`}>
              <span className="relative mx-auto block h-2.5 w-14 rounded-t-md bg-night-700 ring-1 ring-white/10 transition group-hover:bg-blue-500/40" />
              <span className="panel relative flex aspect-square flex-col items-center justify-center gap-2 p-3 text-center transition duration-300 group-hover:-translate-y-1 group-hover:border-blue-500/40">
                {isAdmin && (
                  <span role="button" tabIndex={0} title="Info" onClick={(e) => { e.stopPropagation(); setInfo(pc) }} className="absolute right-2 top-2 z-10 rounded-lg p-1.5 text-slate-600 transition hover:bg-blue-600/15 hover:text-blue-300"><FiInfo size={14} /></span>
                )}
                <span className="flex h-12 w-12 items-center justify-center rounded-xl bg-blue-600/15 text-blue-400 transition group-hover:scale-110"><FiFolder size={22} /></span>
                <span className="block w-full truncate px-0.5 text-xs font-bold text-white sm:text-sm">{pc.responsable}</span>
                <span className="text-[11px] text-slate-500">{pc.etiqueta} · {hoyPc.length} hoy</span>
                {pc.emparejada ? (
                  <span className="flex items-center gap-2 text-[10px] font-semibold">
                    <span className={`flex items-center gap-1 ${online ? 'text-emerald-400' : 'text-slate-500'}`}>
                      {online ? <FiWifi size={11} /> : <FiWifiOff size={11} />}
                      {online ? 'En línea' : 'Offline'}
                    </span>
                    <span className="rounded-full bg-violet-500/10 px-2 py-0.5 text-violet-300 ring-1 ring-violet-500/25">{paginas} pág.</span>
                  </span>
                ) : (
                  <span className="text-[10px] font-semibold text-amber-400">Sin vincular</span>
                )}
              </span>
            </button>
          )
        })}
        {filtradas.length === 0 && <p className="col-span-full py-10 text-center text-sm text-slate-500">No se encontraron carpetas.</p>}
      </div>

      {/* Historial / impresiones de una carpeta */}
      {modal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4 backdrop-blur-sm" onClick={() => setModal(null)}>
          <div className="flex max-h-[85vh] w-full max-w-5xl flex-col overflow-hidden rounded-2xl border border-white/10 bg-night-850 shadow-2xl" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center gap-3 border-b border-white/10 px-6 py-5">
              <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-blue-600/15 text-blue-400 ring-1 ring-blue-500/30"><FiFolder size={18} /></span>
              <div className="min-w-0">
                <h3 className="truncate font-bold text-white">{modal.titulo}{modal.etiqueta && ` · ${modal.etiqueta}`}</h3>
                <p className="text-xs text-slate-400">{modal.datos.length} impresiones registradas</p>
              </div>
              <button onClick={() => setModal(null)} className="ml-auto rounded-xl p-2.5 text-slate-400 transition hover:bg-white/10 hover:text-white"><FiX size={16} /></button>
            </div>
            <ul className="flex-1 divide-y divide-white/5 overflow-y-auto">
              {modal.datos.map((p) => (
                <li key={p.id} className="flex flex-wrap items-center gap-x-4 gap-y-2 px-6 py-4 transition hover:bg-white/[0.03]">
                  <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-violet-500/15 text-sm text-violet-400"><FiFileText size={16} /></span>
                  <div className="min-w-[200px] flex-1">
                    <p className="truncate text-sm font-semibold text-white">{p.documento || 'Documento sin nombre'}</p>
                    <p className="text-xs text-slate-500">
                      {p.usuario || p.responsable || 'Usuario desconocido'}
                      {' · '}<span className="text-blue-300">{p.pc || 'PC no identificada'}</span>
                      {' · '}{p.impresora || 'Impresora no identificada'}
                    </p>
                  </div>
                  <div className="flex shrink-0 flex-col items-end">
                    <span className="flex items-center gap-1 text-xs font-semibold text-slate-300"><FiClock size={11} /> {fmtFecha(p)}</span>
                    <span className="text-[11px] text-slate-500">{p.copias || 1} copia{(p.copias || 1) > 1 ? 's' : ''} · {p.paginas || 1} pág. c/u</span>
                  </div>
                  <span className="shrink-0 rounded-full bg-emerald-500/15 px-3 py-1 text-xs font-semibold text-emerald-400 ring-1 ring-emerald-500/30">
                    <FiCheckCircle size={11} className="mr-1 inline" /> Impreso
                  </span>
                  <div className="flex shrink-0 items-center gap-1">
                    <button onClick={() => setVerPdf(p)} className="rounded-lg p-2 text-slate-400 transition hover:bg-blue-600/15 hover:text-blue-300"><FiEye size={15} /></button>
                    <button onClick={() => descargarImpresion(p)} className="rounded-lg p-2 text-slate-400 transition hover:bg-blue-600/15 hover:text-blue-300"><FiDownload size={15} /></button>
                  </div>
                </li>
              ))}
              {modal.datos.length === 0 && <li className="px-6 py-10 text-center text-sm text-slate-500">Sin impresiones registradas todavía.</li>}
            </ul>
          </div>
        </div>
      )}

      {/* Visor del registro */}
      {verPdf && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/70 p-4 backdrop-blur-sm" onClick={() => setVerPdf(null)}>
          <div className="flex max-h-[92vh] w-full max-w-3xl flex-col overflow-hidden rounded-2xl border border-white/10 bg-night-850 shadow-2xl" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center gap-3 border-b border-white/10 px-5 py-4">
              <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-red-500/15 text-red-400 ring-1 ring-red-500/30"><FiFileText size={18} /></span>
              <div className="min-w-0">
                <p className="truncate text-sm font-bold text-white">{verPdf.documento}</p>
                <p className="text-xs text-slate-400">{verPdf.id} · {verPdf.copias || 1} copias · {verPdf.paginas || 1} pág.</p>
              </div>
              <div className="ml-auto flex items-center gap-2">
                <button onClick={() => descargarImpresion(verPdf)} className="inline-flex items-center gap-1.5 rounded-xl bg-blue-600 px-3.5 py-2 text-xs font-bold text-white transition hover:bg-blue-500"><FiDownload size={14} /> Descargar</button>
                <button onClick={() => setVerPdf(null)} className="rounded-xl p-2.5 text-slate-400 transition hover:bg-white/10 hover:text-white"><FiX size={16} /></button>
              </div>
            </div>
            <div className="overflow-y-auto bg-slate-300/10 p-4 sm:p-8">
              <div className="mx-auto w-full max-w-[620px] rounded-md bg-white p-7 shadow-[0_20px_60px_-15px_rgba(0,0,0,0.6)] sm:p-10">
                <div className="flex items-start justify-between border-b-2 border-slate-800 pb-4">
                  <div><p className="font-serif text-xl font-black tracking-tight text-slate-900">IMPULSA</p><p className="mt-0.5 font-mono text-[10px] uppercase tracking-[0.25em] text-slate-500">Registro de impresión</p></div>
                  <div className="flex gap-[2px]">{[38, 24, 30, 18, 26, 34].map((h, i) => <span key={i} className="w-[3px] bg-slate-900" style={{ height: `${h}px` }} />)}</div>
                </div>
                <h3 className="mt-6 font-serif text-2xl font-bold text-slate-900">{verPdf.documento}</h3>
                <dl className="mt-5 grid grid-cols-2 gap-x-8 gap-y-3 text-xs">
                  <div><dt className="font-mono uppercase tracking-wider text-slate-400">Código</dt><dd className="mt-0.5 font-semibold text-slate-800">{verPdf.id}</dd></div>
                  <div><dt className="font-mono uppercase tracking-wider text-slate-400">Fecha</dt><dd className="mt-0.5 font-semibold text-slate-800">{fmtFecha(verPdf)}</dd></div>
                  <div><dt className="font-mono uppercase tracking-wider text-slate-400">Impreso por</dt><dd className="mt-0.5 font-semibold text-slate-800">{verPdf.usuario || verPdf.responsable}</dd></div>
                  <div><dt className="font-mono uppercase tracking-wider text-slate-400">Carpeta</dt><dd className="mt-0.5 font-semibold text-slate-800">{verPdf.responsable}</dd></div>
                  <div><dt className="font-mono uppercase tracking-wider text-slate-400">Máquina</dt><dd className="mt-0.5 font-semibold text-slate-800">{verPdf.pc}</dd></div>
                  <div><dt className="font-mono uppercase tracking-wider text-slate-400">Impresora</dt><dd className="mt-0.5 font-semibold text-slate-800">{verPdf.impresora || 'No identificada'}</dd></div>
                </dl>
                <div className="mt-8 flex items-end justify-between border-t border-slate-200 pt-5">
                  <div><span className="block h-9 w-36 border-b border-slate-400 font-serif text-lg italic text-slate-400">firma</span><p className="mt-1 text-[10px] uppercase tracking-widest text-slate-400">{verPdf.usuario || verPdf.responsable}</p></div>
                  <p className="font-mono text-[10px] text-slate-400">Página 1 de {verPdf.paginas || 1}</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Info del PC (solo admin) */}
      {info && isAdmin && (() => {
        const delPc = visibles.filter((p) => esDePc(p, info))
        const hoyPc = delPc.filter(esHoy)
        const paginas = hoyPc.reduce((a, x) => a + (x.paginas || 1) * (x.copias || 1), 0)
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
                    {!info.ip && !info.mac && !info.sistema && <p className="text-center text-sm text-slate-500">Esperando info del agente...</p>}
                  </dl>
                ) : (
                  <div className="text-center">
                    <p className="text-sm text-slate-400">Código de emparejamiento:</p>
                    <div className="mt-3 flex items-center justify-center gap-2">
                      <span className="rounded-xl bg-black/30 px-5 py-3 font-mono text-2xl font-black tracking-widest text-amber-400 ring-1 ring-amber-500/30">{info.codigo}</span>
                      <button onClick={() => copiar(info.codigo)} className="shrink-0 rounded-lg p-1.5 text-slate-500 transition hover:bg-white/10 hover:text-blue-300"><FiCopy size={13} /></button>
                    </div>
                  </div>
                )}
                <div className="grid grid-cols-3 gap-3">
                  <div className="rounded-xl bg-night-800 px-3 py-2.5 text-center ring-1 ring-white/5"><p className="text-[10px] font-semibold uppercase tracking-wider text-slate-500">Hoy</p><p className="text-lg font-black text-white">{hoyPc.length}</p></div>
                  <div className="rounded-xl bg-night-800 px-3 py-2.5 text-center ring-1 ring-white/5"><p className="text-[10px] font-semibold uppercase tracking-wider text-slate-500">Páginas</p><p className="text-lg font-black text-violet-300">{paginas}</p></div>
                  <div className="rounded-xl bg-night-800 px-3 py-2.5 text-center ring-1 ring-white/5"><p className="text-[10px] font-semibold uppercase tracking-wider text-slate-500">Total</p><p className="text-lg font-black text-blue-300">{delPc.length}</p></div>
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

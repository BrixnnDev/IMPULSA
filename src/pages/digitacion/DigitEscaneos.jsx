import { useEffect, useState } from 'react'
import { io } from 'socket.io-client'
import { FiFileText, FiSearch, FiDownload, FiEye, FiWifi, FiWifiOff, FiRefreshCw, FiInfo, FiX } from 'react-icons/fi'
import { MdDocumentScanner } from 'react-icons/md'

const API = import.meta.env.VITE_API_URL || 'http://localhost:8787'

const seedEscaneos = [
  { id: 'ESC-0841', archivo: 'demo-01.pdf', nombre: 'HV — María Fernanda Rojas', size: 102400, fecha: new Date(Date.now() - 3600e3 * 5).toISOString(), _demo: true },
  { id: 'ESC-0840', archivo: 'demo-02.pdf', nombre: 'DNI — Carlos Andrés Peña', size: 51200, fecha: new Date(Date.now() - 3600e3 * 7).toISOString(), _demo: true },
  { id: 'ESC-0839', archivo: 'demo-03.pdf', nombre: 'Certificado laboral — Luisa Martínez', size: 204800, fecha: new Date(Date.now() - 86400e3).toISOString(), _demo: true },
]

function formatearTamano(bytes) {
  if (bytes < 1024) return `${bytes} B`
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(0)} KB`
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
}

export default function DigitEscaneos() {
  const [escaneos, setEscaneos] = useState([])
  const [busqueda, setBusqueda] = useState('')
  const [conectado, setConectado] = useState(false)
  const [toast, setToast] = useState('')
  const [showInfo, setShowInfo] = useState(false)

  useEffect(() => {
    fetch(`${API}/api/scans/list`)
      .then((r) => r.json())
      .then((data) => { if (Array.isArray(data) && data.length) setEscaneos(data) })
      .catch(() => setEscaneos([...seedEscaneos]))

    const s = io(API, { transports: ['websocket'], reconnectionAttempts: 5 })
    s.on('connect', () => setConectado(true))
    s.on('disconnect', () => setConectado(false))
    s.on('scan:new', (scan) => {
      setEscaneos((prev) => {
        const filtered = prev.filter((e) => !e._demo)
        return [scan, ...filtered]
      })
      setToast(`Nuevo: ${scan.nombre}`)
      setTimeout(() => setToast(''), 4000)
    })
    return () => s.close()
  }, [])

  const filtrados = escaneos.filter((e) =>
    `${e.nombre} ${e.id} ${e.archivo || ''}`.toLowerCase().includes(busqueda.toLowerCase()),
  )

  const totalHoy = escaneos.filter((e) => {
    const d = new Date(e.fecha)
    const hoy = new Date()
    return d.toDateString() === hoy.toDateString()
  }).length

  return (
    <div className="flex max-h-[calc(100vh-7rem)] flex-col gap-5 overflow-hidden lg:max-h-[calc(100vh-8rem)]">
      {/* Encabezado */}
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h2 className="flex items-center gap-2.5 text-2xl font-black text-white">
            <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-600/15 text-blue-400 ring-1 ring-blue-500/30">
              <MdDocumentScanner size={20} />
            </span>
            Historial de escáner
          </h2>
          <p className="mt-1 text-sm text-slate-400">
            Documentos digitalizados por el escáner en tiempo real.
          </p>
        </div>
        <div className="flex items-center gap-3">
          <span className={`flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider ring-1 ${conectado ? 'bg-emerald-500/10 text-emerald-400 ring-emerald-500/30' : 'bg-amber-500/10 text-amber-400 ring-amber-500/30'}`}>
            {conectado ? <FiWifi size={12} /> : <FiWifiOff size={12} />}
            {conectado ? 'En vivo' : 'Sin servidor'}
          </span>
          <button onClick={() => setShowInfo(true)} className="btn-ghost !px-3 !py-2 !text-xs">
            <FiInfo /> Cómo conectar
          </button>
          <div className="relative w-full max-w-sm sm:w-auto sm:min-w-[280px]">
            <FiSearch className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-slate-500" />
            <input
              value={busqueda}
              onChange={(e) => setBusqueda(e.target.value)}
              placeholder="Buscar por nombre o archivo…"
              className="input-field !pl-11"
            />
          </div>
        </div>
      </div>

      {/* Estadísticas */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        {[
          { label: 'Total', valor: escaneos.filter((e) => !e._demo).length || escaneos.length },
          { label: 'Hoy', valor: totalHoy },
          { label: 'Estado', valor: conectado ? 'Conectado' : 'Esperando', color: conectado ? 'text-emerald-400' : 'text-amber-400' },
        ].map(({ label, valor, color }) => (
          <div key={label} className="panel px-4 py-3">
            <p className="text-xs text-slate-400">{label}</p>
            <p className={`mt-1 text-lg font-black ${color || 'text-white'}`}>{valor}</p>
          </div>
        ))}
        <button onClick={() => setShowInfo(true)} className="panel flex items-center gap-3 px-4 py-3 transition hover:bg-white/[0.03]">
          <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-blue-600/15 text-blue-400"><FiRefreshCw size={14} /></span>
          <div className="text-left"><p className="text-xs text-slate-400">Escáner</p><p className="mt-1 text-sm font-bold text-blue-400">+ Conectar</p></div>
        </button>
      </div>

      {/* Toast */}
      {toast && (
        <div className="flex items-center gap-3 rounded-xl border border-emerald-500/30 bg-emerald-500/10 px-5 py-3 text-sm text-emerald-300">
          <FiFileText size={16} /> {toast}
          <button onClick={() => setToast('')} className="ml-auto text-emerald-300/60 hover:text-emerald-200"><FiX size={14} /></button>
        </div>
      )}

      {/* Lista */}
      <div className="panel min-h-0 flex-1 overflow-hidden">
        <div className="border-b border-white/5 px-6 py-4">
          <h3 className="font-bold text-white">Escaneos ({filtrados.length})</h3>
        </div>
        <ul className="min-h-0 flex-1 divide-y divide-white/5 overflow-y-auto">
          {filtrados.map((e) => (
            <li key={e.id} className="flex flex-wrap items-center gap-x-4 gap-y-2 px-6 py-4 transition hover:bg-white/[0.03]">
              <span className="rounded-lg bg-blue-600/10 px-2.5 py-1 font-mono text-xs font-bold text-blue-300 ring-1 ring-blue-500/25">
                {e.id}
              </span>
              <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-violet-500/15 text-sm text-violet-400">
                <FiFileText size={16} />
              </span>
              <div className="min-w-[180px] flex-1">
                <p className="truncate text-sm font-semibold text-white">{e.nombre}</p>
                <p className="text-xs text-slate-500">
                  {formatearTamano(e.size)} · {new Date(e.fecha).toLocaleString('es-PE', { dateStyle: 'short', timeStyle: 'short' })}
                  {e._demo && <span className="ml-2 text-amber-500/70">demo</span>}
                </p>
              </div>
              {!e._demo && (
                <button
                  onClick={() => window.open(`${API}/api/scans/file/${encodeURIComponent(e.archivo)}`, '_blank')}
                  title="Ver documento"
                  className="shrink-0 rounded-lg p-2 text-slate-400 transition hover:bg-blue-600/15 hover:text-blue-300"
                >
                  <FiEye size={16} />
                </button>
              )}
              {!e._demo && (
                <a
                  href={`${API}/api/scans/file/${encodeURIComponent(e.archivo)}`}
                  download
                  title="Descargar"
                  className="shrink-0 rounded-lg p-2 text-slate-400 transition hover:bg-blue-600/15 hover:text-blue-300"
                >
                  <FiDownload size={16} />
                </a>
              )}
            </li>
          ))}
          {filtrados.length === 0 && (
            <li className="px-6 py-12 text-center text-sm text-slate-500">
              No se encontraron escaneos.
            </li>
          )}
        </ul>
      </div>

      {/* Modal: Cómo conectar el escáner */}
      {showInfo && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4 backdrop-blur-sm" onClick={() => setShowInfo(false)}>
          <div className="flex w-full max-w-lg flex-col gap-5 rounded-2xl border border-white/10 bg-night-850 p-6 shadow-2xl" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center gap-3">
              <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-600/15 text-blue-400 ring-1 ring-blue-500/30"><FiInfo size={18} /></span>
              <div>
                <h3 className="font-bold text-white">Conectar el escáner</h3>
                <p className="text-xs text-slate-400">Paso a paso para digitalizar en vivo</p>
              </div>
              <button onClick={() => setShowInfo(false)} className="ml-auto rounded-xl p-2 text-slate-400 hover:bg-white/10 hover:text-white"><FiX size={16} /></button>
            </div>
            <ol className="space-y-4 text-sm text-slate-300">
              <li className="flex gap-3">
                <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-blue-600 text-[11px] font-bold text-white">1</span>
                <div>
                  <p className="font-semibold text-white">Corre el servidor</p>
                  <p className="text-xs text-slate-400">En el PC servidor: <code className="rounded bg-black/30 px-1.5 py-0.5 font-mono text-xs text-blue-300">cd server &amp;&amp; npm run dev</code></p>
                </div>
              </li>
              <li className="flex gap-3">
                <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-blue-600 text-[11px] font-bold text-white">2</span>
                <div>
                  <p className="font-semibold text-white">Abre config.json</p>
                  <p className="text-xs text-slate-400">Junto al .exe, edita la ruta de la carpeta del escáner y la dirección del servidor.</p>
                </div>
              </li>
              <li className="flex gap-3">
                <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-blue-600 text-[11px] font-bold text-white">3</span>
                <div>
                  <p className="font-semibold text-white">Abre el .exe</p>
                  <p className="text-xs text-slate-400">Doble clic en <code className="rounded bg-black/30 px-1.5 py-0.5 font-mono text-xs text-blue-300">EscanerStockFlow.exe</code>. Cada archivo que aparezca en la carpeta se envía solo.</p>
                </div>
              </li>
              <li className="flex gap-3">
                <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-blue-600 text-[11px] font-bold text-white">4</span>
                <div>
                  <p className="font-semibold text-white">Escanea normal</p>
                  <p className="text-xs text-slate-400">El programa observa la carpeta en tiempo real — cada escaneo aparece aquí automáticamente.</p>
                </div>
              </li>
            </ol>
            <div className="rounded-xl border border-white/5 bg-black/20 px-4 py-3 text-xs text-slate-400">
              <p className="font-semibold text-slate-300">Archivos que necesitas:</p>
              <ul className="mt-1 list-disc space-y-0.5 pl-4">
                <li><code className="text-blue-300">EscanerStockFlow.exe</code> — el programa vigilante (solo Windows)</li>
                <li><code className="text-blue-300">config.json</code> — configura la ruta y el servidor</li>
              </ul>
            </div>
            <button onClick={() => setShowInfo(false)} className="btn-primary self-end">Entendido</button>
          </div>
        </div>
      )}
    </div>
  )
}

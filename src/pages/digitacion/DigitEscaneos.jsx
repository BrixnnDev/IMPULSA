import { useEffect, useState } from 'react'
import { FiFileText, FiSearch, FiDownload, FiEye } from 'react-icons/fi'
import RocketLogo from '../../components/RocketLogo'

const API = import.meta.env.VITE_API_URL || 'http://localhost:8787'

function formatearTamano(bytes) {
  if (!bytes) return '0 KB'
  if (bytes < 1024) return `${bytes} B`
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(0)} KB`
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
}

export default function DigitEscaneos() {
  const [escaneos, setEscaneos] = useState([])
  const [busqueda, setBusqueda] = useState('')

  useEffect(() => {
    fetch(`${API}/api/scans/list?limit=500`)
      .then((r) => r.json())
      .then((data) => {
        const items = Array.isArray(data.items) ? data.items : Array.isArray(data) ? data : []
        setEscaneos(items)
      })
      .catch(() => setEscaneos([]))
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
              <FiFileText size={20} />
            </span>
            Historial de escáner
          </h2>
          <p className="mt-1 text-sm text-slate-400">
            Documentos digitalizados que se guardan en IMPULSA.
          </p>
        </div>
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

      {/* Estadísticas */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
        <div className="panel px-4 py-3">
          <p className="text-xs text-slate-400">Total</p>
          <p className="mt-1 text-lg font-black text-white">{escaneos.length}</p>
        </div>
        <div className="panel px-4 py-3">
          <p className="text-xs text-slate-400">Hoy</p>
          <p className="mt-1 text-lg font-black text-white">{totalHoy}</p>
        </div>
        <div className="panel flex items-center gap-3 px-4 py-3 col-span-2 sm:col-span-1">
          <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-blue-600 to-cyan-500 text-white shadow-lg shadow-blue-600/30">
            <RocketLogo size={16} />
          </span>
          <div className="min-w-0 text-left">
            <p className="text-xs font-bold tracking-wide text-white">IMPULSA</p>
            <p className="truncate text-[11px] text-slate-500">Archivos digitalizados</p>
          </div>
        </div>
      </div>

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
                </p>
              </div>
              <button
                onClick={() => window.open(`${API}/api/scans/file/${encodeURIComponent(e.archivo)}`, '_blank')}
                title="Ver documento"
                className="shrink-0 rounded-lg p-2 text-slate-400 transition hover:bg-blue-600/15 hover:text-blue-300"
              >
                <FiEye size={16} />
              </button>
              <a
                href={`${API}/api/scans/file/${encodeURIComponent(e.archivo)}`}
                download
                title="Descargar"
                className="shrink-0 rounded-lg p-2 text-slate-400 transition hover:bg-blue-600/15 hover:text-blue-300"
              >
                <FiDownload size={16} />
              </a>
            </li>
          ))}
          {filtrados.length === 0 && (
            <li className="flex flex-col items-center gap-3 px-6 py-16 text-center text-sm text-slate-500">
              <span className="flex h-14 w-14 items-center justify-center rounded-2xl bg-blue-600/10 text-blue-400/60 ring-1 ring-blue-500/20">
                <FiFileText size={26} />
              </span>
              <div>
                <p className="font-semibold text-slate-400">Aún no hay escaneos</p>
                <p className="mt-1 text-xs text-slate-600">Los documentos digitalizados aparecerán aquí en IMPULSA.</p>
              </div>
            </li>
          )}
        </ul>
      </div>
    </div>
  )
}

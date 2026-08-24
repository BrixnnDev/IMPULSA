import { useState } from 'react'
import { FiFileText, FiCheckCircle, FiX, FiSearch } from 'react-icons/fi'
import { MdDocumentScanner } from 'react-icons/md'
import { productosSeed } from '../../data/mockData'

const seedEscaneos = [
  { id: 'ESC-0841', doc: 'HV — María Fernanda Rojas', paginas: 2, calidad: 'Alta', fecha: new Date(Date.now() - 3600e3 * 5).toISOString(), estado: 'Digitalizado' },
  { id: 'ESC-0840', doc: 'DNI — Carlos Andrés Peña', paginas: 1, calidad: 'Media', fecha: new Date(Date.now() - 3600e3 * 7).toISOString(), estado: 'Digitalizado' },
  { id: 'ESC-0839', doc: 'Certificado laboral — Luisa Martínez', paginas: 3, calidad: 'Alta', fecha: new Date(Date.now() - 86400e3).toISOString(), estado: 'Revisado' },
  { id: 'ESC-0838', doc: 'HV — Jorge Iván Ramírez', paginas: 2, calidad: 'Baja', fecha: new Date(Date.now() - 86400e3 * 1.5).toISOString(), estado: 'Revisado' },
]

const ESTADO_STYLES = {
  Digitalizado: 'bg-blue-600/15 text-blue-400 ring-blue-500/30',
  Revisado: 'bg-emerald-500/15 text-emerald-400 ring-emerald-500/30',
}

export default function DigitEscaneos() {
  const [escaneos] = useState(seedEscaneos)
  const [busqueda, setBusqueda] = useState('')
  const [ok] = useState('')

  const filtrados = escaneos.filter(
    (e) =>
      e.doc.toLowerCase().includes(busqueda.toLowerCase()) ||
      e.id.toLowerCase().includes(busqueda.toLowerCase()),
  )

  return (
    <div className="space-y-6">
      <div>
        <h2 className="flex items-center gap-2.5 text-2xl font-black text-white">
          <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-600/15 text-blue-400 ring-1 ring-blue-500/30">
            <MdDocumentScanner size={20} />
          </span>
          Historial de escáner
        </h2>
        <p className="mt-1 text-sm text-slate-400">Documentos digitalizados por el escáner.</p>
      </div>

      {ok && (
        <div className="flex items-center gap-3 rounded-xl border border-emerald-500/30 bg-emerald-500/10 px-5 py-4 text-sm text-emerald-300">
          <FiCheckCircle size={18} /> {ok}
          <button onClick={() => {}} className="ml-auto text-emerald-300/70 hover:text-emerald-200">
            <FiX size={16} />
          </button>
        </div>
      )}

      {/* Buscador */}
      <div className="relative max-w-md">
        <FiSearch className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-slate-500" />
        <input
          value={busqueda}
          onChange={(e) => setBusqueda(e.target.value)}
          placeholder="Buscar por documento o código…"
          className="input-field !pl-11"
        />
      </div>

      {/* Lista */}
      <div className="panel overflow-hidden">
        <div className="border-b border-white/5 px-6 py-5">
          <h3 className="font-bold text-white">Escaneos ({filtrados.length})</h3>
        </div>
        <ul className="divide-y divide-white/5">
          {filtrados.map((e) => (
            <li key={e.id} className="flex flex-wrap items-center gap-x-4 gap-y-2 px-6 py-4 transition hover:bg-white/[0.03]">
              <span className="rounded-lg bg-blue-600/10 px-2.5 py-1 font-mono text-xs font-bold text-blue-300 ring-1 ring-blue-500/25">
                {e.id}
              </span>
              <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-violet-500/15 text-sm text-violet-400">
                <FiFileText size={16} />
              </span>
              <div className="min-w-[180px] flex-1">
                <p className="truncate text-sm font-semibold text-white">{e.doc}</p>
                <p className="text-xs text-slate-500">
                  {e.paginas} pág. · Calidad: {e.calidad} · {new Date(e.fecha).toLocaleString('es-PE', { dateStyle: 'short', timeStyle: 'short' })}
                </p>
              </div>
              <span className={`shrink-0 rounded-full px-3 py-1 text-xs font-semibold ring-1 ${ESTADO_STYLES[e.estado]}`}>
                {e.estado}
              </span>
            </li>
          ))}
          {filtrados.length === 0 && (
            <li className="px-6 py-10 text-center text-sm text-slate-500">
              No se encontraron escaneos.
            </li>
          )}
        </ul>
      </div>

      {/* Catálogo de documentos digitalizados */}
      <div className="panel overflow-hidden">
        <div className="border-b border-white/5 px-6 py-5">
          <h3 className="font-bold text-white">Catálogo digitalizado ({productosSeed.length})</h3>
        </div>
        <ul className="divide-y divide-white/5">
          {[...productosSeed].reverse().map((p) => (
            <li key={p.id} className="flex flex-wrap items-center gap-x-4 gap-y-1 px-6 py-4 transition hover:bg-white/[0.03]">
              <span className="rounded-lg bg-blue-600/10 px-2.5 py-1 font-mono text-xs font-bold text-blue-300 ring-1 ring-blue-500/25">
                {p.codigo}
              </span>
              <div className="min-w-[180px] flex-1">
                <p className="text-sm font-semibold text-white">{p.nombre}</p>
                <p className="text-xs text-slate-500">{p.categoria}</p>
              </div>
              <span className="rounded-full bg-emerald-500/15 px-3 py-1 text-xs font-bold text-emerald-400">
                Stock: {p.stock}
              </span>
            </li>
          ))}
        </ul>
      </div>
    </div>
  )
}

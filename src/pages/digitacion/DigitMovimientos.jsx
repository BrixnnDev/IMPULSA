import { useState } from 'react'
import { FiPrinter, FiFolder, FiCheckCircle, FiClock, FiFileText } from 'react-icons/fi'

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

function generarImpresiones(pcIndex) {
  const cantidad = ((pcIndex * 7) % 5) + 1
  const horaBase = 9 + (pcIndex % 6)
  return Array.from({ length: cantidad }, (_, i) => ({
    id: `PRN-${1000 + pcIndex * 10 + i}`,
    pc: PCS[pcIndex].etiqueta,
    documento: DOCS[(pcIndex + i * 3) % DOCS.length],
    copias: ((pcIndex + i) % 3) + 1,
    paginas: (((pcIndex + i) * 3) % 9) + 1,
    hora: `${horaBase + i}:${String(((pcIndex * 17 + i * 23) % 55)).padStart(2, '0')} a. m.`,
    estado: (pcIndex + i) % 4 === 0 ? 'Pendiente' : 'Impreso',
  }))
}

const TODAS_LAS_IMPRESIONES = PCS.flatMap((_, i) => [...generarImpresiones(i)].reverse())

export default function DigitMovimientos() {
  const [seleccionada, setSeleccionada] = useState(null)
  const pc = PCS.find((p) => p.id === seleccionada)
  const impresiones = seleccionada
    ? [...generarImpresiones(PCS.findIndex((p) => p.id === seleccionada))].reverse()
    : TODAS_LAS_IMPRESIONES

  const totalPages = impresiones.reduce((a, p) => a + p.paginas * p.copias, 0)
  const pendientes = impresiones.filter((p) => p.estado === 'Pendiente').length

  return (
    <div className="space-y-6">
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

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-[300px_1fr]">
        {/* Contenedor izquierdo: 14 carpetas */}
        <div className="space-y-3">
          <button
            onClick={() => setSeleccionada(null)}
            className={`w-full rounded-xl px-4 py-2.5 text-xs font-bold uppercase tracking-wider ring-1 transition ${
              seleccionada === null
                ? 'bg-blue-600 text-white ring-blue-500'
                : 'bg-white/5 text-slate-400 ring-white/10 hover:text-white'
            }`}
          >
            Todas las carpetas
          </button>
          <div className="grid grid-cols-2 gap-3 lg:grid-cols-1">
            {PCS.map((p, idx) => {
              const activa = seleccionada === p.id
              const n = generarImpresiones(idx).length
              return (
                <button key={p.id} onClick={() => setSeleccionada(p.id)} className="group text-left">
                  <span className={`ml-5 block h-3 w-14 rounded-t-lg transition ${activa ? 'bg-blue-500/70' : 'bg-slate-600/50 group-hover:bg-blue-500/50'}`} />
                  <span
                    className={`flex items-center gap-3 rounded-lg rounded-tl-none border p-3.5 transition ${
                      activa
                        ? 'border-blue-500/60 bg-blue-600/10'
                        : 'border-white/10 bg-night-900/40 hover:border-blue-500/40 hover:bg-white/[0.04]'
                    }`}
                  >
                    <FiFolder size={24} className={activa ? 'shrink-0 text-blue-400' : 'shrink-0 text-slate-400'} />
                    <span className="min-w-0">
                      <span className="block truncate text-sm font-bold leading-tight text-white">{p.responsable}</span>
                      <span className="text-[11px] text-slate-400">{p.etiqueta} · {n} hoy</span>
                    </span>
                  </span>
                </button>
              )
            })}
          </div>
        </div>

        {/* Contenedor derecho: historial de impresiones */}
        <div className="space-y-5">
          {/* Nombre de la carpeta */}
          <div className="panel flex items-center gap-4 p-5">
            <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-blue-600/15 text-xl text-blue-400 ring-1 ring-blue-500/30">
              <FiFolder size={22} />
            </span>
            <div className="min-w-0">
              <p className="text-[11px] font-semibold uppercase tracking-wider text-slate-400">Carpeta de impresión</p>
              <p className="truncate text-lg font-black leading-tight text-white">
                {pc ? pc.responsable : 'Todas las carpetas'}
              </p>
            </div>
            {pc ? (
              <span className="ml-auto shrink-0 rounded-full bg-blue-600/15 px-3.5 py-1.5 text-xs font-bold text-blue-300 ring-1 ring-blue-500/40">
                {pc.etiqueta}
              </span>
            ) : (
              <span className="ml-auto shrink-0 rounded-full bg-white/5 px-3.5 py-1.5 text-xs font-bold text-slate-400 ring-1 ring-white/10">
                {PCS.length} carpetas
              </span>
            )}
          </div>

          <div className="grid grid-cols-3 gap-4">
            <div className="panel flex items-center gap-3 p-4">
              <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-blue-600/15 text-blue-400 ring-1 ring-blue-500/40">
                <FiPrinter />
              </span>
              <div>
                <p className="text-[11px] font-semibold uppercase tracking-wider text-slate-400">Hoy</p>
                <p className="text-xl font-black text-white">{impresiones.length}</p>
              </div>
            </div>
            <div className="panel flex items-center gap-3 p-4">
              <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-violet-500/15 text-violet-400 ring-1 ring-violet-500/40">
                <FiFileText />
              </span>
              <div>
                <p className="text-[11px] font-semibold uppercase tracking-wider text-slate-400">Páginas</p>
                <p className="text-xl font-black text-white">{totalPages}</p>
              </div>
            </div>
            <div className="panel flex items-center gap-3 p-4">
              <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-amber-500/15 text-amber-400 ring-1 ring-amber-500/40">
                <FiClock />
              </span>
              <div>
                <p className="text-[11px] font-semibold uppercase tracking-wider text-slate-400">Pendientes</p>
                <p className="text-xl font-black text-amber-400">{pendientes}</p>
              </div>
            </div>
          </div>

          <div className="panel overflow-hidden">
            <div className="border-b border-white/5 px-6 py-5">
              <h3 className="font-bold text-white">Impresiones ({impresiones.length})</h3>
            </div>
            <ul className="divide-y divide-white/5">
              {impresiones.map((p) => (
                <li key={p.id} className="flex flex-wrap items-center gap-x-4 gap-y-2 px-6 py-4 transition hover:bg-white/[0.03]">
                  <span className="rounded-lg bg-blue-600/10 px-2.5 py-1 font-mono text-xs font-bold text-blue-300 ring-1 ring-blue-500/25">
                    {p.id}
                  </span>
                  {!seleccionada && (
                    <span className="rounded-full bg-white/5 px-2.5 py-1 text-[11px] font-bold text-slate-300 ring-1 ring-white/10">
                      {p.pc}
                    </span>
                  )}
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
                </li>
              ))}
              {impresiones.length === 0 && (
                <li className="px-6 py-10 text-center text-sm text-slate-500">Sin impresiones registradas hoy.</li>
              )}
            </ul>
          </div>
        </div>
      </div>
    </div>
  )
}

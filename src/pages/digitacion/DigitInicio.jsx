import {
  FiFileText,
  FiPrinter,
  FiSave,
  FiEdit3,
  FiClock,
  FiCheckSquare,
  FiDollarSign,
} from 'react-icons/fi'

const TIPO_STYLES = {
  Digitalizada: 'bg-blue-600/15 text-blue-400 ring-blue-500/30',
  Impresa: 'bg-emerald-500/15 text-emerald-400 ring-emerald-500/30',
  Modificada: 'bg-amber-500/15 text-amber-400 ring-amber-500/30',
  Guardada: 'bg-violet-500/15 text-violet-400 ring-violet-500/30',
}

const TIPO_ICONS = {
  Digitalizada: FiFileText,
  Impresa: FiPrinter,
  Modificada: FiEdit3,
  Guardada: FiSave,
}

const trabajosRecientes = [
  { id: 'HV-1024', persona: 'María Fernanda Rojas', tipo: 'Digitalizada', digitador: 'María Victoria Rojas', pago: 2.5, hora: '09:12 a. m.' },
  { id: 'HV-1023', persona: 'Carlos Andrés Peña', tipo: 'Impresa', digitador: 'Jorge Iván Ramírez', pago: 1.0, hora: '09:40 a. m.' },
  { id: 'HV-1019', persona: 'Luisa Martínez', tipo: 'Modificada', digitador: 'María Victoria Rojas', pago: 1.8, hora: '10:05 a. m.' },
  { id: 'HV-1018', persona: 'Jorge Iván Ramírez', tipo: 'Guardada', digitador: 'Ana Sofía Cárdenas', pago: 0.8, hora: '10:22 a. m.' },
  { id: 'HV-1017', persona: 'Ana Sofía Cárdenas', tipo: 'Digitalizada', digitador: 'Jorge Iván Ramírez', pago: 2.5, hora: '10:51 a. m.' },
]

const stats = [
  { label: 'Hojas de vida hoy', value: 14, icon: FiFileText },
  { label: 'Por imprimir', value: 5, icon: FiPrinter, warn: true },
  { label: 'Trabajos pagados', value: 32, icon: FiCheckSquare },
  { label: 'Ganado hoy', value: 'S/ 86.00', icon: FiDollarSign, money: true },
]

const tareas = [
  { t: 'Digitalizar HV impresa de Dario Salgado (2 págs.)', done: true },
  { t: 'Imprimir HV de Camila Torres — 3 copias', done: true },
  { t: 'Modificar datos de contacto de HV-0992', done: false },
  { t: 'Guardar y respaldar lote del día en la carpeta compartida', done: false },
  { t: 'Archivar hojas de vida impresas del viernes', done: false },
]

export default function DigitInicio() {
  const progreso = Math.round((tareas.filter((t) => t.done).length / tareas.length) * 100)

  return (
    <div className="flex max-h-[calc(100vh-7rem)] flex-col gap-5 overflow-hidden lg:max-h-[calc(100vh-8rem)]">
      <div>
        <h2 className="text-2xl font-black text-white">Centro de digitación</h2>
        <p className="mt-1 text-sm text-slate-400">
          Digitaliza, imprime, guarda y modifica hojas de vida. Ganas por cada trabajo completado.
        </p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 gap-5 xl:grid-cols-4">
        {stats.map(({ label, value, icon: Icon, warn }) => (
          <div key={label} className="panel relative overflow-hidden p-5">
            <span className="absolute -right-4 -top-4 h-20 w-20 rounded-full bg-blue-600/10 blur-xl" />
            <span
              className={`flex h-11 w-11 items-center justify-center rounded-xl text-lg ring-1 ${
                warn
                  ? 'bg-amber-500/15 text-amber-400 ring-amber-500/40'
                  : 'bg-blue-600/15 text-blue-400 ring-blue-500/40'
              }`}
            >
              <Icon />
            </span>
            <p className="mt-4 text-xs font-semibold uppercase tracking-wider text-slate-400">{label}</p>
            <p className="text-3xl font-black text-white">{value}</p>
          </div>
        ))}
      </div>

      <div className="grid min-h-0 flex-1 grid-cols-1 gap-5 xl:grid-cols-3">
        {/* Trabajos recientes */}
        <div className="panel flex min-h-0 flex-col overflow-hidden xl:col-span-2">
          <div className="flex items-center justify-between border-b border-white/5 px-6 py-5">
            <h3 className="font-bold text-white">Últimos trabajos realizados</h3>
            <span className="rounded-full bg-blue-600/15 px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wider text-blue-300 ring-1 ring-blue-500/30">
              Global
            </span>
          </div>
          <ul className="min-h-0 flex-1 divide-y divide-white/5 overflow-y-auto">
            {trabajosRecientes.map((t) => {
              const Icon = TIPO_ICONS[t.tipo]
              return (
                <li key={t.id} className="flex items-center gap-4 px-6 py-4">
                  <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-blue-600/15 text-sm text-blue-400">
                    <Icon size={16} />
                  </span>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-semibold text-white">{t.persona}</p>
                    <p className="truncate text-xs text-slate-500">
                      {t.id} · {t.hora} · Por:{' '}
                      <span className="font-semibold text-slate-400">{t.digitador}</span>
                    </p>
                  </div>
                  <span
                    className={`hidden shrink-0 rounded-full px-3 py-1 text-[11px] font-semibold ring-1 sm:block ${TIPO_STYLES[t.tipo]}`}
                  >
                    {t.tipo}
                  </span>
                </li>
              )
            })}
          </ul>
        </div>

        {/* Tareas del día */}
        <div className="panel flex min-h-0 flex-col overflow-hidden p-6">
          <div className="flex items-center gap-3">
            <FiClock className="text-blue-400" />
            <h3 className="font-bold text-white">Tareas del día</h3>
          </div>
          <div className="mt-4 h-2 overflow-hidden rounded-full bg-night-700">
            <div
              className="h-full rounded-full bg-gradient-to-r from-blue-600 to-cyan-400 transition-all duration-500"
              style={{ width: `${progreso}%` }}
            />
          </div>
          <p className="mt-2 text-right text-xs font-semibold text-blue-400">{progreso}% completado</p>
          <ul className="mt-4 min-h-0 flex-1 space-y-3 overflow-y-auto pr-1">
            {tareas.map((t) => (
              <li key={t.t} className="flex items-start gap-3 text-sm">
                <span
                  className={`mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-md text-[10px] ring-1 ${
                    t.done
                      ? 'bg-emerald-500/20 text-emerald-400 ring-emerald-500/40'
                      : 'bg-white/5 text-transparent ring-white/15'
                  }`}
                >
                  ✓
                </span>
                <span className={t.done ? 'text-slate-500 line-through' : 'text-slate-300'}>{t.t}</span>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </div>
  )
}

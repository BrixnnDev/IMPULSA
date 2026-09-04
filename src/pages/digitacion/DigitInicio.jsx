import { useEffect, useState } from 'react'
import {
  FiFileText,
  FiPrinter,
  FiSave,
  FiEdit3,
  FiClock,
  FiCheckSquare,
  FiDollarSign,
} from 'react-icons/fi'
import { useAuth } from '../../context/AuthContext'

const API = import.meta.env.VITE_API_URL || 'http://localhost:8787'

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

const trabajosRecientes = []

const tareas = [
  { t: 'Digitalizar HV impresa de Dario Salgado (2 págs.)', done: true },
  { t: 'Imprimir HV de Camila Torres — 3 copias', done: true },
  { t: 'Modificar datos de contacto de HV-0992', done: false },
  { t: 'Guardar y respaldar lote del día en la carpeta compartida', done: false },
  { t: 'Archivar hojas de vida impresas del viernes', done: false },
]

export default function DigitInicio() {
  const { user } = useAuth()
  const [comisiones, setComisiones] = useState([])
  const proximo = 32

  useEffect(() => {
    const cargar = () => {
      fetch(`${API}/api/comisiones`)
        .then((r) => r.json())
        .then((arr) => setComisiones(Array.isArray(arr) ? arr : []))
        .catch(() => {})
    }
    cargar()
    const id = setInterval(cargar, 500)
    return () => clearInterval(id)
  }, [])

  const aprobadas = comisiones.filter((c) => c.aprobado === true)
  const pagados = aprobadas.filter((c) => c.estado === 'Pagado').length
  const porCobrar = aprobadas.filter((c) => c.estado !== 'Pagado').length
  const totalGanado = aprobadas.reduce((a, c) => a + (c.ganancia || 0), 0)

  const stats = [
    { label: 'Trabajos hoy', value: comisiones.length, icon: FiFileText },
    { label: 'Por cobrar', value: porCobrar, icon: FiPrinter, warn: true },
    { label: 'Trabajos pagados', value: pagados, icon: FiCheckSquare },
    { label: 'Ganado', value: `S/ ${totalGanado.toFixed(2)}`, icon: FiDollarSign, money: true },
  ]

  const recientes = [...comisiones]
    .sort((a, b) => new Date(b.fecha) - new Date(a.fecha))
    .slice(0, 5)
    .map((c) => ({
      id: c.id,
      persona: c.trabajador || 'Trabajo registrado',
      tipo: c.estado === 'Pagado' ? 'Impresa' : 'Modificada',
      digitador: user?.name || '—',
      hora: new Date(c.fecha).toLocaleTimeString('es-PE', { hour: '2-digit', minute: '2-digit' }),
    }))
    .concat(trabajosRecientes)

  const progreso = Math.round((tareas.filter((t) => t.done).length / tareas.length) * 100)
  const saludo = `Hola, ${user?.name?.split(' ')[0] || 'digitador'}`

  return (
    <div className="flex max-h-[calc(100vh-7rem)] flex-col gap-5 overflow-hidden lg:max-h-[calc(100vh-8rem)]">
      <div>
        <h2 className="text-2xl font-black text-white">{saludo} 👋</h2>
        <p className="mt-1 text-sm text-slate-400">
          {user?.email || 'Digitación'} · Ganas por cada trabajo completado que registres.
        </p>
      </div>

      <div className="flex flex-wrap items-center gap-3">
        <span className="flex h-11 w-11 items-center justify-center rounded-full bg-blue-600/20 text-base font-black text-blue-300 ring-1 ring-blue-500/40">
          {user?.name?.charAt(0).toUpperCase() || 'U'}
        </span>
        <div className="min-w-0">
          <p className="truncate font-bold text-white">{user?.name || 'Usuario'}</p>
          <p className="truncate text-xs text-slate-500">{user?.email || 'cuenta@impulsa.app'}</p>
        </div>
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
            {recientes.length === 0 ? (
              <li className="flex items-center justify-center px-6 py-10 text-sm text-slate-500">
                Aún no hay trabajos registrados.
              </li>
            ) : (
              recientes.map((t) => {
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
              })
            )}
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

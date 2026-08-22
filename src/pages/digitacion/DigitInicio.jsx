import { FiFileText, FiUploadCloud, FiArrowDownCircle, FiArrowUpCircle, FiClock, FiCheckSquare } from 'react-icons/fi'
import { Link } from 'react-router-dom'
import { movimientosSeed, productosSeed, ventasSemana } from '../../data/mockData'

const pendientes = movimientosSeed.filter((m) => m.estado === 'Pendiente').length
const entradas = movimientosSeed.filter((m) => m.tipo === 'Entrada').length
const salidas = movimientosSeed.filter((m) => m.tipo === 'Salida').length

const stats = [
  { label: 'Registros hoy', value: movimientosSeed.length + 3, icon: FiFileText },
  { label: 'Por validar', value: pendientes, icon: FiClock, warn: true },
  { label: 'Entradas', value: entradas, icon: FiArrowDownCircle },
  { label: 'Salidas', value: salidas, icon: FiArrowUpCircle },
]

const tareas = [
  { t: 'Digitalizar factura Nº 00821 — Distribuidora Andina', done: true },
  { t: 'Actualizar precios de la categoría Bebidas', done: true },
  { t: 'Registrar ingreso de 120 aguas San Mateo', done: false },
  { t: 'Validar movimiento MOV-499', done: false },
  { t: 'Cuadrar inventario físico de Snacks', done: false },
]

export default function DigitInicio() {
  const progreso = Math.round((tareas.filter((t) => t.done).length / tareas.length) * 100)

  return (
    <div className="space-y-8">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h2 className="text-2xl font-black text-white">Centro de digitación</h2>
          <p className="mt-1 text-sm text-slate-400">Registra y valida los movimientos del almacén.</p>
        </div>
        <Link to="/digitacion/productos" className="btn-primary !px-4 !py-2.5 !text-xs">
          <FiUploadCloud /> Digitalizar producto
        </Link>
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

      <div className="grid grid-cols-1 gap-6 xl:grid-cols-3">
        {/* Actividad reciente */}
        <div className="panel overflow-hidden xl:col-span-2">
          <div className="flex items-center justify-between border-b border-white/5 px-6 py-5">
            <h3 className="font-bold text-white">Últimos movimientos registrados</h3>
            <Link to="/digitacion/movimientos" className="text-xs font-semibold text-blue-400 hover:text-blue-300">
              Ver todos →
            </Link>
          </div>
          <ul className="divide-y divide-white/5">
            {movimientosSeed.map((m) => (
              <li key={m.id} className="flex items-center gap-4 px-6 py-4">
                <span
                  className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-lg text-sm ${
                    m.tipo === 'Entrada'
                      ? 'bg-emerald-500/15 text-emerald-400'
                      : m.tipo === 'Salida'
                        ? 'bg-red-500/15 text-red-400'
                        : 'bg-blue-600/15 text-blue-400'
                  }`}
                >
                  {m.tipo === 'Entrada' ? <FiArrowDownCircle size={16} /> : m.tipo === 'Salida' ? <FiArrowUpCircle size={16} /> : <FiFileText size={16} />}
                </span>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-semibold text-white">{m.producto}</p>
                  <p className="truncate text-xs text-slate-500">{m.motivo} · {m.id}</p>
                </div>
                <span className="shrink-0 font-bold text-slate-200">
                  {m.cantidad > 0 && m.tipo !== 'Entrada' ? `+${m.cantidad}` : m.cantidad}
                </span>
                <span
                  className={`hidden shrink-0 rounded-full px-3 py-1 text-[11px] font-semibold sm:block ${
                    m.estado === 'Validado'
                      ? 'bg-emerald-500/10 text-emerald-400 ring-1 ring-emerald-500/30'
                      : 'bg-amber-500/10 text-amber-400 ring-1 ring-amber-500/30'
                  }`}
                >
                  {m.estado}
                </span>
              </li>
            ))}
          </ul>
        </div>

        {/* Tareas del día */}
        <div className="space-y-6">
          <div className="panel p-6">
            <div className="flex items-center gap-3">
              <FiCheckSquare className="text-blue-400" />
              <h3 className="font-bold text-white">Tareas del día</h3>
            </div>
            <div className="mt-4 h-2 overflow-hidden rounded-full bg-night-700">
              <div
                className="h-full rounded-full bg-gradient-to-r from-blue-600 to-cyan-400 transition-all duration-500"
                style={{ width: `${progreso}%` }}
              />
            </div>
            <p className="mt-2 text-right text-xs font-semibold text-blue-400">{progreso}% completado</p>
            <ul className="mt-4 space-y-3">
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

          <div className="panel p-6">
            <h3 className="font-bold text-white">Resumen del catálogo</h3>
            <dl className="mt-4 space-y-3 text-sm">
              <div className="flex items-center justify-between rounded-xl bg-night-800 px-4 py-3 ring-1 ring-white/5">
                <dt className="text-slate-400">Productos digitalizados</dt>
                <dd className="font-black text-white">{productosSeed.length}</dd>
              </div>
              <div className="flex items-center justify-between rounded-xl bg-night-800 px-4 py-3 ring-1 ring-white/5">
                <dt className="text-slate-400">Valor del stock</dt>
                <dd className="font-black text-white">
                  S/ {productosSeed.reduce((a, p) => a + p.precioCompra * p.stock, 0).toFixed(2)}
                </dd>
              </div>
              <div className="flex items-center justify-between rounded-xl bg-night-800 px-4 py-3 ring-1 ring-white/5">
                <dt className="text-slate-400">Ventas semana (ref.)</dt>
                <dd className="font-black text-white">{ventasSemana.reduce((a, b) => a + b, 0)}</dd>
              </div>
            </dl>
          </div>
        </div>
      </div>
    </div>
  )
}
